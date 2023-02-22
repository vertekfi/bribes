// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

struct Bribe {
  uint256 amount;
  uint256 epochStartTime; // use controller epochs as option on UI but validate here
  address briber;
  address token;
  address gauge;
  string protocolId;
}

interface IRewardHandler {
  function submitGaugeBribe(Bribe memory bribe) external;
}
