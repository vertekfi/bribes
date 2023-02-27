import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { parseEther } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { GAUGES, TOKENS } from './data';
import { bribeFixture } from './fixtures/bribe.fixture';

const ZERO_ADDRESS = ethers.constants.AddressZero;
const WBTC = '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c';
const BNB_BUSD_GAUGE = '0xC32389561da25C3AD66aBd55A2db0B6172F9C759';

const bribeAmount = parseEther('100');

const DAY = 86400;
const WEEK = DAY * 7;

describe('Merkle Rewards', () => {
  async function addBribe(token = TOKENS[0], amount = bribeAmount, gauge = GAUGES[0]) {
    const { bribeManager, gaugeController } = await loadFixture(bribeFixture);

    // Give valid args and then verify
    await bribeManager.addBribe(token, amount, gauge);
    const epochTime = await gaugeController.time_total();
    const gaugeBribes: any[] = await bribeManager.getGaugeBribes(gauge, epochTime);

    expect(gaugeBribes.length).to.equal(1);
  }

  describe('Creation Distributions', () => {
    describe('Caller does not have the proper role', () => {
      it('reverts', async () => {});
    });

    describe('Incorrect input values', () => {
      it('reverts when the bribe manager has not been set', async () => {});
      it('reverts when the bribe record does not exist', async () => {});
    });

    describe('When input values are correct', () => {
      // Need to create a bribe
      // Which creates a distribution record on rewarder <- verify

      it('increments the distribution id for the channel', async () => {});
    });
  });

  describe('Claiming Rewards', () => {
    it('', async () => {});
  });
});
