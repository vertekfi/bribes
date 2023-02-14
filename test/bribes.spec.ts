import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { awesomeFixture } from "./fixtures/awesome.fixture";

describe("Tests", () => {
  beforeEach(async () => {
   
  });

  it("Should", async () => {
    const fixture = await loadFixture(awesomeFixture)
    expect(true).to.be.true;
  });
});
