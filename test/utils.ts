import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { BigNumber, Contract, ethers } from 'ethers';
import { parseEther } from 'ethers/lib/utils';
import * as erc20 from '../node_modules/@openzeppelin/contracts/build/contracts/ERC20.json';
import { TOKENS, GAUGES } from './data';
import { bribeFixture } from './fixtures/bribe.fixture';

export const oneSecondInMs = 1000;

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

export const keccak256 = ethers.utils.solidityKeccak256;

export const bribeAmount = parseEther('100');

export async function addBribe(
  token = TOKENS[0],
  amount = bribeAmount,
  gauge = GAUGES[0],
  epochStartTime?: number
) {
  const { bribeManager, gaugeController } = await loadFixture(bribeFixture);

  // Give valid args and then verify
  await bribeManager.addBribe(token, amount, gauge);
  const epochTime = epochStartTime || (await gaugeController.time_total());
  const gaugeBribes: any[] = await bribeManager.getGaugeBribes(gauge, epochTime);

  expect(gaugeBribes.length).to.equal(1);

  return epochTime;
}

export const prepStorageSlotWrite = (receiverAddress: string, storageSlot: number) => {
  return ethers.utils.solidityKeccak256(
    ['uint256', 'uint256'],
    [receiverAddress, storageSlot] // key, slot - solidity mappings storage = keccak256(mapping key value, value at that key)
  );
};

export const toBytes32 = (bn: BigNumber) => {
  return ethers.utils.hexlify(ethers.utils.zeroPad(bn.toHexString(), 32));
};

export const setStorageAt = async (
  provider: ethers.providers.JsonRpcProvider,
  contractAddress: string,
  index: string,
  value: BigNumber
) => {
  await provider.send('hardhat_setStorageAt', [
    contractAddress,
    index,
    toBytes32(value).toString(),
  ]);
  await provider.send('evm_mine', []); // Just mines to the next block
};

export const giveTokenBalanceFor = async (
  provider: ethers.providers.JsonRpcProvider,
  contractAddress: string,
  addressToSet: string,
  storageSlot: number,
  amount: BigNumber
) => {
  const index = prepStorageSlotWrite(addressToSet, storageSlot);
  await setStorageAt(provider, contractAddress, index, amount);
};

export function getERC20(address: string, signer) {
  return new Contract(address, erc20.abi, signer);
}

export function getRandomBytes32(value = parseEther('1')) {
  return ethers.utils.hexZeroPad(value.toHexString(), 32);
}

/**
 * Replicates error string return from OpenZeppelin AccessControl contract
 */
export function getAccessControlRevertString(account: string, role: string) {
  return `AccessControl: account ${account.toLowerCase()} is missing role ${role}`;
}
