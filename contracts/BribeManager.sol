// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";

import "./interfaces/IGaugeController.sol";
import "./interfaces/ILiquidityGauge.sol";
import "./interfaces/IRewardHandler.sol";
import "./interfaces/IVault.sol";

contract BribeManager is AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IGaugeController private _gaugeController;

    IVault private _vault;

    // Reference to reward handler contract
    // Used to send bribe amounts to vault internal balance of rewarder contract
    address private _rewardHandler;

    EnumerableSetUpgradeable.AddressSet private _whitelistedTokens;

    EnumerableSetUpgradeable.AddressSet private _approvedGauges;

    // gauge => epoch start time => list of bribes for that epoch
    mapping(address => mapping(uint256 => Bribe[])) private _gaugeEpochBribes;

    event BribeAdded(uint256 epoch, address gauge, address token, uint256 amount);
    event AddWhitelistToken(address token);
    event RemoveWhitelistToken(address token);
    event GaugeAdded(address gauge);
    event GaugeRemoved(address gauge);
    event GaugeControllerSet(address controller);
    event RewardHandlerSet(address handler);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        /**
         * Prevents later initialization attempts after deployment.
         * If a base contract was left uninitialized, the implementation contracts
         * could potentially be compromised in some way.
         */
        _disableInitializers();
    }

    function initialize(
        address gaugeController,
        address rewardHandler,
        address vault,
        address[] memory _initialGauges,
        address[] memory _initialTokens
    ) public initializer {
        require(gaugeController != address(0), "GaugeController not provided");
        require(rewardHandler != address(0), "Reward handler not provided");
        require(vault != address(0), "Vault not provided");

        _gaugeController = IGaugeController(gaugeController);
        _rewardHandler = rewardHandler;
        _vault = IVault(vault);

        // Call all base initializers
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(ADMIN_ROLE, _msgSender());

        uint256 gaugeCount = _initialGauges.length;
        for (uint i = 0; i < gaugeCount; ) {
            _addGauge(_initialGauges[i]);

            unchecked {
                i++;
            }
        }

        uint256 tokenCount = _initialTokens.length;
        for (uint256 i = 0; i < tokenCount; ) {
            _addToken(_initialTokens[i]);

            unchecked {
                i++;
            }
        }
    }

    // ====================================== STATE TRANSITIONS ===================================== //

    /**
     * @dev Adds a new bribe to a gauge for the coming epoch
     *
     * @param token Token to be given as bribe reward
     * @param amount Amount of `token` offered for the bribe
     * @param gauge Address of the gauge the bribe is being offered to
     */
    function addBribe(address token, uint256 amount, address gauge) external nonReentrant {
        // TODO: unit test edge cases
        require(token != address(0), "Token not provided");
        require(_whitelistedTokens.contains(token), "Token not permitted");
        require(amount > 0, "Zero bribe amount");

        // Gauge validation
        require(gauge != address(0), "Gauge not provided");
        // This covers _addGauge gauge controller check for gauge existance as well then
        require(isGaugeApproved(gauge), "Gauge not permitted");
        // Skip killed gauges in case the contract state here was not updated to match yet
        require(!ILiquidityGauge(gauge).is_killed(), "Gauge is not active");

        // Instead of numerous checks and balances we will force the bribe to be for the start of next epoch
        uint256 nextEpochStart = _gaugeController.time_total();

        // In the event the bribe is added in some small window where the controller has not been
        // checkpointed to the start of the next week
        if (block.timestamp > nextEpochStart) {
            _gaugeController.checkpoint();
            nextEpochStart = _gaugeController.time_total();
        }

        // Single propery writes can save gas
        Bribe memory bribe;
        bribe.token = token;
        bribe.amount = amount;
        bribe.gauge = gauge;
        bribe.epochStartTime = nextEpochStart;
        bribe.briber = _msgSender();
        // bribe.protocolId = protocolId;

        _gaugeEpochBribes[gauge][nextEpochStart].push(bribe);

        // Transfering here to avoid user needing to approve vault as well.
        // Would be required if we attempted to deposit straight to internal balance from them.
        IERC20Upgradeable(token).safeTransferFrom(_msgSender(), address(this), amount);

        // Transfer out to reward handlers vault internal balance
        // TODO: unit test
        _updateRewardHandlerInternalBalance(token, amount);

        emit BribeAdded(nextEpochStart, gauge, token, amount);
    }

    function _updateRewardHandlerInternalBalance(address token, uint256 amount) private {
        IVault.UserBalanceOp[] memory ops = new IVault.UserBalanceOp[](1);

        ops[0] = IVault.UserBalanceOp({
            asset: token,
            amount: amount,
            sender: address(this),
            recipient: payable(_rewardHandler),
            kind: IVault.UserBalanceOpKind.DEPOSIT_INTERNAL
        });

        getVault().manageUserBalance(ops);
    }

    // ====================================== VIEW ===================================== //

    function getVault() public view returns (IVault) {
        return _vault;
    }

    function getRewardHandler() public view returns (address) {
        return _rewardHandler;
    }

    /// @dev Checks whether a token has been added to the token whitelist
    function isWhitelistedToken(address token) public view returns (bool) {
        return _whitelistedTokens.contains(token);
    }

    function isGaugeApproved(address gauge) public view returns (bool) {
        return _approvedGauges.contains(gauge);
    }

    /// @dev Gets the list of bribes for a gauge for a given epoch
    function getGaugeBribes(address gauge, uint256 epoch) external view returns (Bribe[] memory) {
        return _gaugeEpochBribes[gauge][epoch];
    }

    function getGaugeController() external view returns (IGaugeController) {
        return _gaugeController;
    }

    /// @dev Gets a single bribe record for a gauge by index for a given epoch
    function getBribe(
        address gauge,
        uint256 epoch,
        uint256 index
    ) public view returns (Bribe memory) {
        // TODO: Test various edge cases
        // Test this for learning also. Mappings are init to default values
        // Try testing scenarios where what not thinking of or accounting for these(and or others) could let happen
        require(gauge != address(0), "Invalid gauge");
        require(epoch > 0, "Invalid epoch");

        Bribe[] memory bribes = _gaugeEpochBribes[gauge][epoch];

        // TODO: Test various edge cases
        require(bribes.length > 0, "No bribes for epoch");
        require(index < bribes.length, "Invalid index");

        return bribes[index];
    }

    // ====================================== ADMIN ===================================== //

    /// @dev Adds a list of tokens to the token whitelist to be used as bribe reward options
    function addWhiteListTokens(address[] calldata tokens) external onlyRole(ADMIN_ROLE) {
        uint256 count = tokens.length;
        for (uint256 i = 0; i < count; ) {
            _addToken(tokens[i]);

            unchecked {
                i++;
            }
        }
    }

    function _addToken(address token) internal {
        require(token != address(0), "Token not provided");

        // Skipping any additional checks for gas. Duplicates just get skipped
        _whitelistedTokens.add(token);
        // Approve once now to save gas later for each bribe created
        IERC20Upgradeable(token).approve(address(_vault), type(uint256).max);

        emit AddWhitelistToken(token);
    }

    function removeWhiteListToken(address token) external onlyRole(ADMIN_ROLE) {
        // Skipping any additional checks for gas
        _whitelistedTokens.remove(token);

        emit RemoveWhitelistToken(token);
    }

    /// @dev Adds a gauge that is able to receive bribes
    function _addGauge(address gauge) internal {
        require(gauge != address(0), "Gauge not provided");
        require(!isGaugeApproved(gauge), "Gauge already added");
        require(_gaugeController.gauge_exists(gauge), "Gauge does not exist on Controller");
        require(!ILiquidityGauge(gauge).is_killed(), "Gauge is not active");

        _approvedGauges.add(gauge);
        emit GaugeAdded(gauge);
    }

    function addGauge(address gauge) external onlyRole(ADMIN_ROLE) {
        _addGauge(gauge);
    }

    /// @dev Removes a gauge from the list that is able to receive new bribes.
    // TODO: Need to test/check for any potential issues around this.
    // Any active bribes will not be effected. Will just disable any new bribes from being added.
    function removeGauge(address gauge) external onlyRole(ADMIN_ROLE) {
        require(gauge != address(0), "Gauge not provided");
        require(isGaugeApproved(gauge), "Gauge not added");

        _approvedGauges.remove(gauge);
        emit GaugeRemoved(gauge);
    }

    /// @dev Sets a new address for the GaugeController contract
    function setGaugeController(address gaugeController) external onlyRole(ADMIN_ROLE) {
        require(gaugeController != address(0), "GaugeController not provided");

        _gaugeController = IGaugeController(gaugeController);
        emit GaugeControllerSet(gaugeController);
    }

    /// @dev Sets a new address for the RewardHandler contract
    function setRewardHandler(address handler) external onlyRole(ADMIN_ROLE) {
        require(handler != address(0), "RewardHandler not provided");

        _rewardHandler = handler;

        emit RewardHandlerSet(handler);
    }
}
