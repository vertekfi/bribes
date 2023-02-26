// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import "./IRewardHandler.sol";

interface IBribeManager {
    function getBribe(
        address gauge,
        uint256 epoch,
        uint256 index
    ) external view returns (Bribe memory);
}
