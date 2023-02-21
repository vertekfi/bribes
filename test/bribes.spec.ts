import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { GAUGES, TOKENS } from "./data";
import { bribeFixture } from "./fixtures/bribe.fixture";

describe("BribeManager", () => {
  async function addBribe() {}

  it("adds initial tokens", async () => {
    const { bribeManager } = await loadFixture(bribeFixture);

    for (const token of TOKENS) {
      expect(await bribeManager.isWhitelistedToken(token)).to.be.true;
    }
  });

  it("adds initial gauges", async () => {
    const { bribeManager } = await loadFixture(bribeFixture);

    for (const gauge of GAUGES) {
      expect(await bribeManager.approvedGauges(gauge)).to.be.true;
    }
  });

  // it("add a bribe", async () => {
  //   const { bribeManager } = await loadFixture(bribeFixture);

  //   const bribe = {
  //     token: '',
  //     amount: parseEther('100'),

  //   }
  //   await bribeManager.addBribe()
  // });
});
