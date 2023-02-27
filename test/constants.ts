import { ethers } from 'hardhat';

export const ZERO_ADDRESS = ethers.constants.AddressZero;

export const ONE_SECOND_MS = 1000;

// Contract storage slots for user balances
// Use to overwrite a users balance to any value for testing
// Removes need for a whole dex and swap setup just for test tokens
export const ASHARE_BALANCEOF_SLOT = 0;
export const BUSD_BALANCEOF_SLOT = 1;
export const USDC_BALANCEOF_SLOT = 1;
export const AMES_BALANCEOF_SLOT = 0;
export const WBNB_BALANCEOF_SLOT = 3;

export const GAUGE_BALANCEOF_SLOT = 5;
export const BAL_POOL_BALANCEOFSLOT = 0; // WeightedPool instance slot
