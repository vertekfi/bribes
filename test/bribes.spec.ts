import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { GAUGES, TOKENS } from "./data";
import { bribeFixture } from "./fixtures/bribe.fixture";

const ZERO_ADDRESS = ethers.constants.AddressZero;
const WBTC = "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c";
const BNB_BUSD_GAUGE = "0xC32389561da25C3AD66aBd55A2db0B6172F9C759";

describe("BribeManager", () => {
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

  describe("Adding Bribes", () => {
    describe("Token input validation", () => {
      it("reverts for zero address", async () => {
        const { bribeManager } = await loadFixture(bribeFixture);

        await expect(bribeManager.addBribe(ZERO_ADDRESS, 0, ZERO_ADDRESS)).to.be.revertedWith(
          "Token not provided"
        );
      });

      it("reverts for non whitelist tokens", async () => {
        const { bribeManager } = await loadFixture(bribeFixture);

        await expect(bribeManager.addBribe(WBTC, 0, ZERO_ADDRESS)).to.be.revertedWith(
          "Token not permitted"
        );
      });

      it("reverts for a zero amount provided", async () => {
        const { bribeManager } = await loadFixture(bribeFixture);

        await expect(bribeManager.addBribe(TOKENS[0], 0, ZERO_ADDRESS)).to.be.revertedWith(
          "Zero bribe amount"
        );
      });
    });

    describe("Gauge input validation", () => {
      const bribeAmount = parseEther("100");

      it("reverts for zero address", async () => {
        const { bribeManager } = await loadFixture(bribeFixture);

        await expect(
          bribeManager.addBribe(TOKENS[0], bribeAmount, ZERO_ADDRESS)
        ).to.be.revertedWith("Gauge not provided");
      });

      it("reverts for an unapproved gauge", async () => {
        const { bribeManager } = await loadFixture(bribeFixture);

        await expect(
          bribeManager.addBribe(TOKENS[0], bribeAmount, BNB_BUSD_GAUGE)
        ).to.be.revertedWith("Gauge not permitted");
      });
    });
  });
});
