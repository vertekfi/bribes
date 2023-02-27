import { BigNumber, Contract, ethers } from 'ethers';
import { parseEther } from 'ethers/lib/utils';
import * as erc20 from '../node_modules/@openzeppelin/contracts/build/contracts/ERC20.json';

export const keccak256 = ethers.utils.solidityKeccak256;

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
