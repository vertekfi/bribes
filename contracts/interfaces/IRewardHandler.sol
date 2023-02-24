// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

struct Bribe {
    uint256 amount;
    uint256 epochStartTime; // use controller epochs as options on UI but validate in contract as needed
    address briber;
    address token;
    address gauge;
    // string[64] protocolId;
}

interface IRewardHandler {
    function submitGaugeBribe(Bribe memory bribe) external;
}
