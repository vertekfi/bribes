// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

interface ILiquidityGauge {
  function is_killed() external returns (bool);
}
