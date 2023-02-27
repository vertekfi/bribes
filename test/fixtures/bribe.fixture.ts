import { Contract } from 'ethers';
import { parseEther } from 'ethers/lib/utils';
import { ethers, upgrades } from 'hardhat';
import { GAUGES, GAUGE_CONTROLLER, TOKENS, VAULT } from '../data';
import { BUSD_BALANCEOF_SLOT, giveTokenBalanceFor, WBNB_BALANCEOF_SLOT } from '../utils';
import vaultABI from '../abis/Vault.json';

export async function bribeFixture() {
  const [gaugeController, vault] = await Promise.all([
    ethers.getContractAt(['function time_total() public view returns (uint256)'], GAUGE_CONTROLLER),
    ethers.getContractAt(vaultABI, VAULT),
  ]);

  const MerkleOrchard = await ethers.getContractFactory('MerkleOrchard');
  const rewardHandler = await upgrades.deployProxy(MerkleOrchard, [VAULT]);
  await rewardHandler.deployed();

  const BribeManager = await ethers.getContractFactory('BribeManager');
  const bribeManager = await upgrades.deployProxy(BribeManager, [
    gaugeController.address,
    rewardHandler.address,
    VAULT,
    GAUGES,
    TOKENS,
  ]);
  await bribeManager.deployed();

  await rewardHandler.setBribeManager(bribeManager.address);

  const accounts = await ethers.getSigners();
  const adminAccount = accounts[0];
  const randomUserAccount = accounts[1];

  // Run approvals once so taken care of
  for (const token of TOKENS) {
    const instance = new Contract(
      token,
      ['function approve(address, uint256) external'],
      adminAccount
    );
    await instance.approve(bribeManager.address, ethers.constants.MaxUint256);
    await instance
      .connect(randomUserAccount)
      .approve(bribeManager.address, ethers.constants.MaxUint256);
  }

  // Provide some fundages
  await Promise.all([
    giveTokenBalanceFor(
      ethers.provider,
      TOKENS[0],
      adminAccount.address,
      BUSD_BALANCEOF_SLOT,
      parseEther('1000')
    ),
    giveTokenBalanceFor(
      ethers.provider,
      TOKENS[1],
      adminAccount.address,
      WBNB_BALANCEOF_SLOT,
      parseEther('1000')
    ),
    giveTokenBalanceFor(
      ethers.provider,
      TOKENS[0],
      randomUserAccount.address,
      BUSD_BALANCEOF_SLOT,
      parseEther('1000')
    ),
    giveTokenBalanceFor(
      ethers.provider,
      TOKENS[1],
      randomUserAccount.address,
      WBNB_BALANCEOF_SLOT,
      parseEther('1000')
    ),
  ]);

  return { bribeManager, gaugeController, adminAccount, randomUserAccount, rewardHandler, vault };
}
