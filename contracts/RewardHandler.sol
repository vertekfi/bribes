// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableMapUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "./interfaces/IRewardHandler.sol";

contract RewardHandler is AccessControlUpgradeable, ReentrancyGuardUpgradeable, IRewardHandler {
  using EnumerableMapUpgradeable for EnumerableMapUpgradeable.AddressToUintMap;

  struct GaugeEpochReward {
    uint256 epochTime;
    bytes32 rootHash;
    address[] rewardTokens;
  }

  bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

  address public bribeManager;

  // epoch => gauge => tokenEnumerableMapping(token => amount)
  mapping(uint256 => mapping(address => EnumerableMapUpgradeable.AddressToUintMap))
    private _epochRewards;

  // epoch => user => claimed
  mapping(uint256 => mapping(address => bool)) private _userClaims;

  // epoch => gauge => merkle root
  mapping(uint256 => mapping(address => bytes32)) private _epochRootHashes;

  modifier onlyManager() {
    require(msg.sender == bribeManager, "Not the manager");
    _;
  }

  event BribeManagerSet(address oldManager, address newManager);

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    /**
     * Prevents later initialization attempts after deployment.
     * If a base contract was left uninitialized, the implementation contracts
     * could potentially be compromised in some way.
     */
    _disableInitializers();
  }

  function initialize(address _bribeManger) public initializer {
    require(_bribeManger != address(0), "Manager not provided");

    // Call all base initializers
    __AccessControl_init();

    _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    _grantRole(ADMIN_ROLE, _msgSender());
  }

  function claimRewards(uint256[] memory epochs, address[] memory gauges) external nonReentrant {
    require(epochs.length == gauges.length, "Mismatched lengths");
    // is valid gauge
    // is valid epoch

    // Use end of epoch week weights
    // Users have voting power as soon as they lock
    // Which can of course happen all throughout an epoch
    // So end of week balances is the only baseline that can be used

    // Or use merkle tree and provide proofs here

    uint256 epochCount = epochs.length;
    address user = _msgSender();

    for (uint256 i = 0; i < epochCount; ) {
      require(!_userClaims[epochs[i]][user], "Already claimed");

      _userClaims[epochs[i]][user] = true;

      unchecked {
        ++i;
      }
    }
  }

  // ====================================== ONLY MANAGER ===================================== //

  function submitGaugeBribe(Bribe memory bribe) external onlyManager {
    //
  }

  // ====================================== ADMIN ===================================== //

  // Not sure this is the route. May be the only efficient way of doing it though
  //
  // The rewards are simply for people who voted for that gauge during that epoch
  // So we are submitting a hashed tree of
  // - user address
  // - ve weight at the start of that epoch (this can be pulled in this contract though)
  // - ve total weight (this can be pulled in this contract though)
  // - user is entitled to some % of the bribe token(s) for that gauge for that epoch
  //
  // -> -> So we really just need a list of addresses who voted for the gauge...
  // What's the most gas/cost efficient way of doing that?
  // Just pushing addresses onto an array seems no bueno
  // Still merkle tree with just addresses?
  //
  // function submitEpochVoterInfo(
  //   bytes32 merkleRoot,
  //   uint256 epochStartTime,
  //   address gauge
  // ) external onlyRole(ADMIN_ROLE) {
  //   //
  // }

  function setBribeManager(address manager) external onlyRole(ADMIN_ROLE) {
    require(manager != address(0), "Manager not provided");

    address oldManager = bribeManager;
    bribeManager = manager;

    emit BribeManagerSet(oldManager, manager);
  }
}
