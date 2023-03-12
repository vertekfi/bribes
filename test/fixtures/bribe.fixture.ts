import { Contract } from 'ethers';
import { parseEther } from 'ethers/lib/utils';
import { ethers, upgrades } from 'hardhat';
import { BUSD, GAUGES, GAUGE_CONTROLLER, TOKENS, VAULT, WBNB } from '../data';
import { giveTokenBalanceFor } from '../utils';
import vaultABI from '../abis/Vault.json';
import { BUSD_BALANCEOF_SLOT, WBNB_BALANCEOF_SLOT } from '../constants';

export async function bribeFixture() {
  const [gaugeController, vault] = await Promise.all([
    ethers.getContractAt(['function time_total() public view returns (uint256)'], GAUGE_CONTROLLER),
    ethers.getContractAt(vaultABI, VAULT),
  ]);

  const MerkleOrchard = await ethers.getContractFactory('MerkleOrchard');
  const rewardHandler = await upgrades.deployProxy(MerkleOrchard, []);
  await rewardHandler.deployed();

  const BribeManager = await ethers.getContractFactory('BribeManager');
  const bribeManager = await upgrades.deployProxy(BribeManager, [
    gaugeController.address,
    rewardHandler.address,
    GAUGES,
    TOKENS,
  ]);
  await bribeManager.deployed();

  const accounts = await ethers.getSigners();
  const adminAccount = accounts[0];
  const randomUserAccount = accounts[1];

  await rewardHandler.setBribeManager(bribeManager.address);
  await rewardHandler.grantRole(await rewardHandler.DISTRIBUTOR_ROLE(), adminAccount.address);

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
      BUSD,
      adminAccount.address,
      BUSD_BALANCEOF_SLOT,
      parseEther('1000')
    ),
    giveTokenBalanceFor(
      ethers.provider,
      WBNB,
      adminAccount.address,
      WBNB_BALANCEOF_SLOT,
      parseEther('1000')
    ),
    giveTokenBalanceFor(
      ethers.provider,
      BUSD,
      randomUserAccount.address,
      BUSD_BALANCEOF_SLOT,
      parseEther('1000')
    ),
    giveTokenBalanceFor(
      ethers.provider,
      WBNB,
      randomUserAccount.address,
      WBNB_BALANCEOF_SLOT,
      parseEther('1000')
    ),
  ]);

  return { bribeManager, gaugeController, adminAccount, randomUserAccount, rewardHandler, vault };
}

async function giveTokies() {}
