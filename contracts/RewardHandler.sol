// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import "./interfaces/IRewardHandler.sol";

contract RewardHandler is IRewardHandler, AccessControlUpgradeable {
  bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

  address public bribeManager;

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

  // ====================================== ONLY MANAGER ===================================== //

  function submitGaugeBribe(address gauge) external onlyManager {
    //
  }

  // ====================================== ADMIN ===================================== //

  function setBribeManager(address manager) external onlyRole(ADMIN_ROLE) {
    require(manager != address(0), "Manager not provided");

    address oldManager = bribeManager;
    bribeManager = manager;

    emit BribeManagerSet(oldManager, manager);
  }
}
