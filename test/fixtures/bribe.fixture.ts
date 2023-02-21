import { ethers, upgrades } from "hardhat";

export async function bribeFixture() {
  const BribeManager = await ethers.getContractFactory("BribeManager");
  const bribeManager = await upgrades.deployProxy(BribeManager, []);
  await bribeManager.deployed();

  return { bribeManager };
}
