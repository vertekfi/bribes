import { ethers, upgrades } from 'hardhat';

export const GAUGE_CONTROLLER = '0x99bFf5953843A211792BF3715b1b3b4CBeE34CE6';
const INITIAL_TOKENS = [];
const INITIAL_GAUGES = [];

async function main() {
  // const MerkleOrchard = await ethers.getContractFactory('MerkleOrchard');
  // const rewardHandler = await upgrades.deployProxy(MerkleOrchard, []);
  // await rewardHandler.deployed();

  // console.log(`MerkelOrchard deployed to: ${rewardHandler.address}`);

  // const BribeManager = await ethers.getContractFactory('BribeManager');
  // const bribeManager = await upgrades.deployProxy(BribeManager, [
  //   GAUGE_CONTROLLER,
  //   rewardHandler.address,
  //   INITIAL_GAUGES,
  //   INITIAL_TOKENS,
  // ]);
  // await bribeManager.deployed();

  // console.log(`BribeManager deployed to: ${bribeManager.address}`);

  // await rewardHandler.setBribeManager(bribeManager.address);

  const BribeManager = await ethers.getContractFactory('BribeManager');
  const bribeManager = await upgrades.upgradeProxy(
    '0xe1f6A52798b54D07E0Bed1d16e23897E0B336FDD',
    BribeManager
  );
  await bribeManager.deployed();
  console.log(`BribeManager complete`);

  // const MerkleOrchard = await ethers.getContractFactory('MerkleOrchard');
  // const rewardHandler = await upgrades.upgradeProxy('0xf774745E9aDb7f82c461b04bef02AF1E00043386', MerkleOrchard);
  // await rewardHandler.deployed();
  // console.log(`MerkelOrchardupgrade complete`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
