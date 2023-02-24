// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableMapUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";

import "./interfaces/IVault.sol";
import "./interfaces/IDistributorCallback.sol";

contract RewardHandler is AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using EnumerableMapUpgradeable for EnumerableMapUpgradeable.AddressToUintMap;

    struct Claim {
        uint256 distributionId;
        uint256 balance;
        address distributor;
        uint256 tokenIndex;
        bytes32[] merkleProof;
    }

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // address public bribeManager;
    IVault private _vault;

    // Recorded distributions
    // channelId > distributionId
    mapping(bytes32 => uint256) private _nextDistributionId;
    // channelId > distributionId > root
    mapping(bytes32 => mapping(uint256 => bytes32)) private _distributionRoot;
    // channelId > claimer > distributionId / 256 (word index) -> bitmap
    mapping(bytes32 => mapping(address => mapping(uint256 => uint256))) private _claimedBitmap;
    // channelId > balance
    mapping(bytes32 => uint256) private _remainingBalance;

    event DistributionAdded(
        address indexed distributor,
        IERC20Upgradeable indexed token,
        uint256 distributionId,
        bytes32 merkleRoot,
        uint256 amount
    );
    event DistributionClaimed(
        address indexed distributor,
        IERC20Upgradeable indexed token,
        uint256 distributionId,
        address indexed claimer,
        address recipient,
        uint256 amount
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        /**
         * Prevents later initialization attempts after deployment.
         * If a base contract was left uninitialized, the implementation contracts
         * could potentially be compromised in some way.
         */
        _disableInitializers();
    }

    function initialize(address vault) public initializer {
        require(vault != address(0), "Vault not provided");

        // Call all base initializers
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(ADMIN_ROLE, _msgSender());
    }

    function getVault() public view returns (IVault) {
        return _vault;
    }

    function getDistributionRoot(
        IERC20Upgradeable token,
        address distributor,
        uint256 distributionId
    ) external view returns (bytes32) {
        bytes32 channelId = _getChannelId(token, distributor);
        return _distributionRoot[channelId][distributionId];
    }

    function getRemainingBalance(
        IERC20Upgradeable token,
        address distributor
    ) external view returns (uint256) {
        bytes32 channelId = _getChannelId(token, distributor);
        return _remainingBalance[channelId];
    }

    /**
     * @notice distribution ids must be sequential and can have an optional offset
     */
    function getNextDistributionId(
        IERC20Upgradeable token,
        address distributor
    ) external view returns (uint256) {
        bytes32 channelId = _getChannelId(token, distributor);
        return _nextDistributionId[channelId];
    }

    function isClaimed(
        IERC20Upgradeable token,
        address distributor,
        uint256 distributionId,
        address claimer
    ) public view returns (bool) {
        (uint256 distributionWordIndex, uint256 distributionBitIndex) = _getIndices(distributionId);

        bytes32 channelId = _getChannelId(token, distributor);
        return
            (_claimedBitmap[channelId][claimer][distributionWordIndex] &
                (1 << distributionBitIndex)) != 0;
    }

    function verifyClaim(
        IERC20Upgradeable token,
        address distributor,
        uint256 distributionId,
        address claimer,
        uint256 claimedBalance,
        bytes32[] memory merkleProof
    ) external view returns (bool) {
        bytes32 channelId = _getChannelId(token, distributor);
        return _verifyClaim(channelId, distributionId, claimer, claimedBalance, merkleProof);
    }

    // Claim functions

    /**
     * @notice Allows anyone to claim multiple distributions for a claimer.
     */
    function claimDistributions(
        address claimer,
        Claim[] memory claims,
        IERC20Upgradeable[] memory tokens
    ) external {
        _processClaims(claimer, claimer, claims, tokens, false);
    }

    /**
     * @notice Allows a user to claim their own multiple distributions to internal balance.
     */
    function claimDistributionsToInternalBalance(
        address claimer,
        Claim[] memory claims,
        IERC20Upgradeable[] memory tokens
    ) external {
        require(msg.sender == claimer, "user must claim own balance");
        _processClaims(claimer, claimer, claims, tokens, true);
    }

    /**
     * @notice Allows a user to claim their own several distributions to a callback.
     */
    function claimDistributionsWithCallback(
        address claimer,
        Claim[] memory claims,
        IERC20Upgradeable[] memory tokens,
        IDistributorCallback callbackContract,
        bytes calldata callbackData
    ) external {
        require(msg.sender == claimer, "user must claim own balance");
        _processClaims(claimer, address(callbackContract), claims, tokens, true);
        callbackContract.distributorCallback(callbackData);
    }

    /**
     * @notice Allows a distributor to add funds to the contract as a merkle tree.
     */
    function createDistribution(
        IERC20Upgradeable token,
        bytes32 merkleRoot,
        uint256 amount,
        uint256 distributionId
    ) external {
        address distributor = msg.sender;

        bytes32 channelId = _getChannelId(token, distributor);
        require(
            _nextDistributionId[channelId] == distributionId || _nextDistributionId[channelId] == 0,
            "invalid distribution ID"
        );
        token.safeTransferFrom(distributor, address(this), amount);

        token.approve(address(getVault()), amount);
        IVault.UserBalanceOp[] memory ops = new IVault.UserBalanceOp[](1);

        ops[0] = IVault.UserBalanceOp({
            asset: address(token),
            amount: amount,
            sender: address(this),
            recipient: payable(address(this)),
            kind: IVault.UserBalanceOpKind.DEPOSIT_INTERNAL
        });

        getVault().manageUserBalance(ops);

        _remainingBalance[channelId] += amount;
        _distributionRoot[channelId][distributionId] = merkleRoot;
        _nextDistributionId[channelId] = distributionId + 1;
        emit DistributionAdded(distributor, token, distributionId, merkleRoot, amount);
    }

    // Helper functions

    function _getChannelId(
        IERC20Upgradeable token,
        address distributor
    ) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(token, distributor));
    }

    /**
     * @dev Verifies an accounts claim to a list of rewards.
     * This contract does not hold the bribe token balances itself and instead uses
     * it's own "internal balance" within the Vault.
     */
    function _processClaims(
        address claimer,
        address recipient,
        Claim[] memory claims,
        IERC20Upgradeable[] memory tokens,
        bool asInternalBalance
    ) internal {
        uint256[] memory amounts = new uint256[](tokens.length);
        Claim memory claim;

        for (uint256 i = 0; i < claims.length; i++) {
            claim = claims[i];

            (uint256 distributionWordIndex, uint256 distributionBitIndex) = _getIndices(
                claim.distributionId
            );

            bytes32 currentChannelId = _getChannelId(tokens[claim.tokenIndex], claim.distributor);
            uint256 currentBits = 1 << distributionBitIndex;
            _setClaimedBits(currentChannelId, claimer, distributionWordIndex, currentBits);
            _deductClaimedBalance(currentChannelId, claim.balance);

            require(
                _verifyClaim(
                    currentChannelId,
                    claim.distributionId,
                    claimer,
                    claim.balance,
                    claim.merkleProof
                ),
                "incorrect merkle proof"
            );

            // Note that balances to claim are here accumulated *per token*, independent of the distribution channel and
            // claims set accounting.
            amounts[claim.tokenIndex] += claim.balance;

            emit DistributionClaimed(
                claim.distributor,
                tokens[claim.tokenIndex],
                claim.distributionId,
                claimer,
                recipient,
                claim.balance
            );
        }

        IVault.UserBalanceOpKind kind = asInternalBalance
            ? IVault.UserBalanceOpKind.TRANSFER_INTERNAL
            : IVault.UserBalanceOpKind.WITHDRAW_INTERNAL;
        IVault.UserBalanceOp[] memory ops = new IVault.UserBalanceOp[](tokens.length);

        for (uint256 i = 0; i < tokens.length; i++) {
            ops[i] = IVault.UserBalanceOp({
                asset: address(tokens[i]),
                amount: amounts[i],
                sender: address(this),
                recipient: payable(recipient),
                kind: kind
            });
        }
        getVault().manageUserBalance(ops);
    }

    /**
     * @dev Sets the bits set in `newClaimsBitmap` for the corresponding distribution.
     */
    function _setClaimedBits(
        bytes32 channelId,
        address claimer,
        uint256 wordIndex,
        uint256 newClaimsBitmap
    ) private {
        uint256 currentBitmap = _claimedBitmap[channelId][claimer][wordIndex];

        // All newly set bits must not have been previously set
        require((newClaimsBitmap & currentBitmap) == 0, "cannot claim twice");

        _claimedBitmap[channelId][claimer][wordIndex] = currentBitmap | newClaimsBitmap;
    }

    /**
     * @dev Deducts `balanceBeingClaimed` from a distribution channel's allocation. This isolates tokens accross
     * distribution channels, and prevents claims for one channel from using the tokens of another one.
     */
    function _deductClaimedBalance(bytes32 channelId, uint256 balanceBeingClaimed) private {
        require(
            _remainingBalance[channelId] >= balanceBeingClaimed,
            "distributor hasn't provided sufficient tokens for claim"
        );
        _remainingBalance[channelId] -= balanceBeingClaimed;
    }

    function _verifyClaim(
        bytes32 channelId,
        uint256 distributionId,
        address claimer,
        uint256 claimedBalance,
        bytes32[] memory merkleProof
    ) internal view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(claimer, claimedBalance));
        return
            MerkleProofUpgradeable.verify(
                merkleProof,
                _distributionRoot[channelId][distributionId],
                leaf
            );
    }

    function _getIndices(
        uint256 distributionId
    ) private pure returns (uint256 distributionWordIndex, uint256 distributionBitIndex) {
        distributionWordIndex = distributionId / 256;
        distributionBitIndex = distributionId % 256;
    }
}
