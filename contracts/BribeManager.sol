// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "./interfaces/IGaugeController.sol";
import "./interfaces/IGauge.sol";
import "./interfaces/IRewardHandler.sol";

contract BribeManager is AccessControlUpgradeable, ReentrancyGuardUpgradeable {
  using SafeERC20Upgradeable for IERC20Upgradeable;

  bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

  IGaugeController public gaugeController;

  // public rewardHandler;

  // token => allowed
  mapping(address => bool) public whitelistedTokens;

  // gauge => added
  mapping(address => bool) public gauges;

  // epoch start time => gauge => list of bribes for that epoch
  mapping(uint256 => mapping(address => Bribe[])) private _gaugeEpochBribes;

  // mapping(uint256 => Bribe[]) private _epochBribes;

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
    address _gaugeController,
    address[] memory _initialGauges,
    address[] memory _initialTokens
  ) public initializer {
    require(_gaugeController != address(0), "GaugeController not provided");

    gaugeController = IGaugeController(_gaugeController);

    // rewardHandler = IRewardHandler(_rewardHandler);

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

  function addBribe(Bribe memory bribe) external {
    // TODO: unit test edge cases
    require(whitelistedTokens[bribe.token], "Token not permitted");
    require(bribe.amount > 0, "Zero bribe amount");
    require(bribe.gauge != address(0), "Gauge not provided");
    // This covers_addGauge gauge controller check as well then
    require(gauges[bribe.gauge], "Gauge not permitted");
    // Skip killed gauges in case the contract state here was not updated to match yet
    require(!IGauge(bribe.gauge).isKilled(), "Gauge is not active");

    // Instead of numerous checks and balances we will force the bribe to be for the start of next epoch
    // require(bribe.epochStartTime >= nextEpochStart, "Start time too soon");
    // require(bribe.epochStartTime < nextEpochStart + 1 weeks, "Start time past next epoch");

    uint256 nextEpochStart = gaugeController.time_total();

    // In the event the bribe is added in some small window where the controller has not been
    // checkpointed to the start of the next week
    // TODO: test
    if (block.timestamp > nextEpochStart) {
      gaugeController.checkpoint();
      nextEpochStart = gaugeController.time_total();
    }

    bribe.epochStartTime = nextEpochStart;
    bribe.briber = _msgSender();

    // TODO: test
    _gaugeEpochBribes[nextEpochStart][bribe.gauge].push(bribe);

    // We know the token is valid at this point
    // Could send directly to rewarder contract but going in steps for now
    IERC20Upgradeable(bribe.token).safeTransferFrom(_msgSender(), address(this), bribe.amount);

    emit BribeAdded(nextEpochStart, bribe.gauge, bribe.token, bribe.amount);
  }

  // TODO: We probably want to support scheduling bribes for beyond next epoch
  // (up to some very short limit, eg. a couple weeks)
  // We could mark only specific gauges as capabale of this, etc.
  // function addFutureEpochBribe() external nonReentrant {

  // }

  // /**
  //  * @dev Rounds the provided timestamp down to the beginning of the previous week (Thurs 00:00 UTC)
  //  */
  // function _roundDownTimestamp(uint256 timestamp) private pure returns (uint256) {
  //   // Division by zero or overflows are impossible here.
  //   return (timestamp / 1 weeks) * 1 weeks;
  // }

  // /**
  //  * @dev Rounds the provided timestamp up to the beginning of the next week (Thurs 00:00 UTC)
  //  */
  // function _roundUpTimestamp(uint256 timestamp) private pure returns (uint256) {
  //   // Overflows are impossible here for all realistic inputs.
  //   return _roundDownTimestamp(timestamp + 1 weeks - 1);
  // }

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
    require(!whitelistedTokens[token], "Already whitelisted");

    whitelistedTokens[token] = true;
    emit AddWhitelistToken(token);
  }

  function removeWhiteListToken(address token) external onlyRole(ADMIN_ROLE) {
    require(whitelistedTokens[token], "Token not whitelisted");

    whitelistedTokens[token] = false;
    emit RemoveWhitelistToken(token);
  }

  /// @dev Adds a gauge that is able to receive bribes
  function _addGauge(address gauge) internal {
    require(gauge != address(0), "Gauge not provided");
    require(!gauges[gauge], "Gauge already added");
    require(gaugeController.gauge_types(gauge) >= 0, "Gauge does not exist on Controller");
    require(!IGauge(gauge).isKilled(), "Gauge is not active");

    gauges[gauge] = true;
    emit GaugeAdded(gauge);
  }

  function addGauge(address gauge) external onlyRole(ADMIN_ROLE) {
    _addGauge(gauge);
  }

  /// @dev Removes a gauge from the list that is able to receive bribes
  function removeGauge(address gauge) external onlyRole(ADMIN_ROLE) {
    require(gauge != address(0), "Gauge not provided");
    require(gauges[gauge], "Gauge not added");

    gauges[gauge] = false;
    emit GaugeRemoved(gauge);
  }

  /// @dev Sets a new address for the GaugeController contract
  function setGaugeController(address _gaugeController) external onlyRole(ADMIN_ROLE) {
    require(_gaugeController != address(0), "GaugeController not provided");

    gaugeController = IGaugeController(_gaugeController);
    emit GaugeControllerSet(_gaugeController);
  }

  /// @dev Sets a new address for the GaugeController contract
  function setRewardHandler(address handler) external onlyRole(ADMIN_ROLE) {
    require(handler != address(0), "RewardHandler not provided");

    rewardHandler = IRewardHandler(handler);
    emit RewardHandlerSet(handler);
  }
}
