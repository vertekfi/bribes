import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { bribeFixture } from "./fixtures/bribe.fixture";

describe("Tests", () => {
  beforeEach(async () => {});

  it("Should", async () => {
    const { bribeManager } = await loadFixture(bribeFixture);
    expect(true).to.be.true;
  });
});
