// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import "./interfaces/IGaugeController.sol";
import "./interfaces/IGauge.sol";

contract BribeManager is AccessControlUpgradeable {
  bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

  struct Bribe {
    address briber;
    address token;
    address gauge;
    uint256 amount;
    uint256 epochStartTime; // use controller epochs as option on UI but validate here
  }

  IGaugeController public gaugeController;

  // token => allowed
  mapping(address => bool) public whitelistedTokens;

  // gauge => added
  mapping(address => bool) public gauges;

  // gauge => epoch start time => list of bribes for that epoch
  mapping(address => mapping(uint256 => Bribe[])) private _gaugeEpochBribes;

  // gauge => bribe[]
  // mapping(address => bool) public bribes;

  event GaugeControllerSet(address controller);
  event AddWhitelistToken(address token);
  event RemoveWhitelistToken(address token);
  event GaugeAdded(address gauge);
  event GaugeRemoved(address gauge);

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
    address _rewardHandler
  ) public initializer {
    require(_gaugeController != address(0), "GaugeController not provided");

    gaugeController = IGaugeController(_gaugeController);

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
  }

  function addBribe(Bribe memory bribe) external {
    require(whitelistedTokens[bribe.token], "Token not permitted");
    require(bribe.amount > 0, "Zero bribe amount");
    require(bribe.gauge != address(0), "Gauge not provided");
    // Will cover gauge controller check as well then
    require(gauges[bribe.gauge], "Gauge not permitted");
    // Skip killed gauges in case the contract state here was not updated to match yet
    require(!IGauge(bribe.gauge).isKilled(), "Gauge is not active");

    // Attempt to help and validate start time by getting the start of next epoch for controller (time_total)
    // Could be a scenario where a bribe is added in a window before controller is checkpointed to next epoch
    // Automation handles this immediately after a new epoch starts
    // But that would essentially reward voters from a previous epoch
    uint256 nextEpochStart = gaugeController.time_total();
    require(bribe.epochStartTime >= nextEpochStart, "Start time too soon");

    bribe.briber = msg.sender;

    // transfer funds from caller, will be sent to a reward handler contract of some sort
    // provide the gauge, token, amount
  }

  // ====================================== ADMIN ===================================== //

  function addWhiteListToken(address token) external onlyRole(ADMIN_ROLE) {
    require(!whitelistedTokens[token], "Already whitelisted");

    whitelistedTokens[token] = true;
    emit AddWhitelistToken(token);
  }

  function removeWhiteListToken(address token) external onlyRole(ADMIN_ROLE) {
    require(whitelistedTokens[token], "Token not whitelisted");

    whitelistedTokens[token] = false;
    emit RemoveWhitelistToken(token);
  }

  function _addGauge(address gauge) internal {
    require(gauge != address(0), "Gauge not provided");
    require(!gauges[gauge], "Gauge already added");
    require(gaugeController.gauge_types(gauge) >= 0, "Gauge does not exist on Controller");

    gauges[gauge] = true;
    emit GaugeAdded(gauge);
  }

  function addGauge(address gauge) external onlyRole(ADMIN_ROLE) {
    _addGauge(gauge);
  }

  function removeGauge(address gauge) external onlyRole(ADMIN_ROLE) {
    require(gauge != address(0), "Gauge not provided");
    require(gauges[gauge], "Gauge not added");

    gauges[gauge] = false;
    emit GaugeRemoved(gauge);
  }

  function setGaugeController(address _gaugeController) external onlyRole(ADMIN_ROLE) {
    require(_gaugeController != address(0), "GaugeController not provided");

    gaugeController = IGaugeController(_gaugeController);
    emit GaugeControllerSet(_gaugeController);
  }
}
