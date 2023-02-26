// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableMapUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";

contract BribeClaim is AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");

    struct Claim {
        uint256 week;
        uint256 balance;
        bytes32[] merkleProof;
    }

    // Recorded weeks
    mapping(uint256 => bytes32) public weekMerkleRoots;

    mapping(uint256 => mapping(address => bool)) public claimed;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        /**
         * Prevents later initialization attempts after deployment.
         * If a base contract was left uninitialized, the implementation contracts
         * could potentially be compromised in some way.
         */
        _disableInitializers();
    }

    function initialize() public initializer {
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(DISTRIBUTOR_ROLE, _msgSender());
    }

    /**
     * @notice Allows a user to claim a particular week's worth of rewards
     */
    function claimWeek(
        uint256 week,
        uint256 claimedBalance,
        bytes32[] memory merkleProof
    ) external nonReentrant {
        require(!claimed[week][_msgSender()], "Cannot claim twice");

        claimed[week][_msgSender()] = true;
        _disburse(_msgSender(), claimedBalance);
    }

    function _disburse(address user, uint256 amount) private {
        // So we do need something a bit more complicated to account for different tokens
        // Explains why the "channel" thing in the MerkleRedeem
        // if (amount > 0) {
        //     emit RewardPaid(recipient, address(rewardToken), amount);
        //     rewardToken.safeTransfer(recipient, amount);
        // }
    }

    function verifyClaim(
        address liquidityProvider,
        uint256 week,
        uint256 claimedBalance,
        bytes32[] memory merkleProof
    ) public view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(liquidityProvider, claimedBalance));

        return MerkleProofUpgradeable.verify(merkleProof, weekMerkleRoots[week], leaf);
    }

    /**
     * @notice
     * Allows the owner to add funds to the contract as a merkle tree,
     */
    function seedAllocations(
        uint256 week,
        bytes32 merkleRoot,
        uint256 amount
    ) external onlyRole(DISTRIBUTOR_ROLE) {
        require(weekMerkleRoots[week] == bytes32(0), "cannot rewrite merkle root");

        // So, we can use this. If we add a token, mapping/channel

        // What if, distribution was token based...
        // week/epoch is root mapping key,
        // I guess it already is. Some has to add a bribe(token) in order for their to be anything
        // to generate a tree for

        weekMerkleRoots[week] = merkleRoot;
        // rewardToken.safeTransferFrom(_msgSender(), address(this), amount);

        // emit RewardAdded(address(rewardToken), amount);
    }
}
