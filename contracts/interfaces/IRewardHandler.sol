// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

struct Bribe {
    uint256 amount;
    uint256 epochStartTime; // use controller epochs as options on UI but validate in contract as needed
    address briber;
    address token;
    address gauge;
    // string[64] protocolId;
}

interface IRewardHandler {
    function addDistribution(IERC20Upgradeable token, address briber, uint256 amount) external;
}
