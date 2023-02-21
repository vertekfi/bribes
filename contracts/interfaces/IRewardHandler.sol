// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

struct Bribe {
  address briber;
  address token;
  address gauge;
  uint256 amount;
  uint256 epochStartTime; // use controller epochs as option on UI but validate here
}

interface IRewardHandler {
  function submitGaugeBribe(Bribe memory bribe) external;
}
