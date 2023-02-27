import { ethers, upgrades } from 'hardhat';

export const GAUGE_CONTROLLER = '0x99bFf5953843A211792BF3715b1b3b4CBeE34CE6';
const INITIAL_TOKENS = [];
const INITIAL_GAUGES = [];

async function main() {
  const MerkleOrchard = await ethers.getContractFactory('MerkleOrchard');
  const rewardHandler = await upgrades.deployProxy(MerkleOrchard, []);
  await rewardHandler.deployed();

  const BribeManager = await ethers.getContractFactory('BribeManager');
  const bribeManager = await upgrades.deployProxy(BribeManager, [
    GAUGE_CONTROLLER,
    rewardHandler.address,
    INITIAL_GAUGES,
    INITIAL_TOKENS,
  ]);
  await bribeManager.deployed();

  await rewardHandler.setBribeManager(bribeManager.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
