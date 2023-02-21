// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

interface IGaugeController {
  function gauge_types(address) external returns (int128);

  function time_total() external returns (uint256);

  function checkpoint() external;
}
