// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "./interfaces/IRewardHandler.sol";
import "./interfaces/IVault.sol";

contract MerkleOrchard is AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    struct Claim {
        uint256 distributionId;
        uint256 balance;
        address distributor;
        uint256 tokenIndex;
        bytes32[] merkleProof;
    }

    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");

    IVault private _vault;

    // Recorded distributions
    // channelId > distributionId
    mapping(bytes32 => uint256) private _nextDistributionId; // Acts as a sort of nonce for a "channel"

    // channelId > distributionId > root
    mapping(bytes32 => mapping(uint256 => bytes32)) private _distributionRoot;

    // channelId > claimer > distributionId / 256 (word index) -> bitmap
    mapping(bytes32 => mapping(address => mapping(uint256 => uint256))) private _claimedBitmap;

    // channelId > balance
    // Remaining balance for a token for/from a briber
    // The "channel" is created/enabled through the combination of their account address and the token address
    mapping(bytes32 => uint256) private _remainingBalance;

    event DistributionAdded(
        address indexed briber,
        IERC20Upgradeable indexed token,
        uint256 distributionId,
        bytes32 merkleRoot,
        uint256 amount
    );
    event DistributionClaimed(
        address indexed briber,
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

        _vault = IVault(vault);

        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(DISTRIBUTOR_ROLE, _msgSender());
    }

    function getVault() public view returns (IVault) {
        return _vault;
    }

    function getDistributionRoot(
        IERC20Upgradeable token,
        address briber,
        uint256 distributionId
    ) external view returns (bytes32) {
        bytes32 channelId = _getChannelId(token, briber);
        return _distributionRoot[channelId][distributionId];
    }

    function getRemainingBalance(
        IERC20Upgradeable token,
        address briber
    ) external view returns (uint256) {
        bytes32 channelId = _getChannelId(token, briber);
        return _remainingBalance[channelId];
    }

    /**
     * @notice distribution ids must be sequential and can have an optional offset
     */
    function getNextDistributionId(
        IERC20Upgradeable token,
        address briber
    ) external view returns (uint256) {
        bytes32 channelId = _getChannelId(token, briber);
        return _nextDistributionId[channelId];
    }

    function isClaimed(
        IERC20Upgradeable token,
        address briber,
        uint256 distributionId,
        address claimer
    ) public view returns (bool) {
        (uint256 distributionWordIndex, uint256 distributionBitIndex) = _getIndices(distributionId);

        bytes32 channelId = _getChannelId(token, briber);
        return
            (_claimedBitmap[channelId][claimer][distributionWordIndex] &
                (1 << distributionBitIndex)) != 0;
    }

    function verifyClaim(
        IERC20Upgradeable token,
        address briber,
        uint256 distributionId,
        address claimer,
        uint256 claimedBalance,
        bytes32[] memory merkleProof
    ) external view returns (bool) {
        bytes32 channelId = _getChannelId(token, briber);

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

    // Helper functions

    function _getChannelId(IERC20Upgradeable token, address briber) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(token, briber));
    }

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

        // Bribe manager deposits tokens from bribers into this contract vault internal balance.
        // This adds a bit of abstraction but removes the need for a two way link between both contracts.
        // Transfer out from this contracts internal vault balance to the recipient.
        IVault.UserBalanceOp[] memory ops = new IVault.UserBalanceOp[](tokens.length);

        for (uint256 i = 0; i < tokens.length; i++) {
            ops[i] = IVault.UserBalanceOp({
                asset: address(tokens[i]),
                amount: amounts[i],
                sender: address(this),
                recipient: payable(recipient),
                kind: IVault.UserBalanceOpKind.WITHDRAW_INTERNAL
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
