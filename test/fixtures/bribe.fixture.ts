import { ethers, upgrades } from "hardhat";
import { GAUGES, GAUGE_CONTROLLER, TOKENS } from "../data";

export async function bribeFixture() {
  const BribeManager = await ethers.getContractFactory("BribeManager");
  const bribeManager = await upgrades.deployProxy(BribeManager, [GAUGE_CONTROLLER, GAUGES, TOKENS]);
  await bribeManager.deployed();

  return { bribeManager };
}
