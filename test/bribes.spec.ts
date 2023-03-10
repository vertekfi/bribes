import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { BigNumberish } from 'ethers';
import { parseEther } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { addBribe } from './bribe.utils';
import { GAUGES, TOKENS } from './data';
import { bribeFixture } from './fixtures/bribe.fixture';
import { getERC20 } from './utils';

const ZERO_ADDRESS = ethers.constants.AddressZero;
const WBTC = '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c';
const BNB_BUSD_GAUGE = '0xC32389561da25C3AD66aBd55A2db0B6172F9C759';

const bribeAmount = parseEther('100');

const DAY = 86400;
const WEEK = DAY * 7;

// const protocolId = "Funny dummy money";

describe('BribeManager', () => {
  // describe('Contract State Initialization', () => {
  it('adds initial tokens', async () => {
    const { bribeManager } = await loadFixture(bribeFixture);

    for (const token of TOKENS) {
      expect(await bribeManager.isWhitelistedToken(token)).to.be.true;
    }
  });

  it('adds initial gauges', async () => {
    const { bribeManager } = await loadFixture(bribeFixture);

    for (const gauge of GAUGES) {
      expect(await bribeManager.isGaugeApproved(gauge)).to.be.true;
    }
  });
});

describe('Adding Bribes', () => {
  describe('Token input validation', () => {
    it('reverts for zero address', async () => {
      const { bribeManager } = await loadFixture(bribeFixture);

      await expect(bribeManager.addBribe(ZERO_ADDRESS, 0, ZERO_ADDRESS)).to.be.revertedWith(
        'Token not provided'
      );
    });

    it('reverts for non whitelist tokens', async () => {
      const { bribeManager } = await loadFixture(bribeFixture);

      await expect(bribeManager.addBribe(WBTC, 0, ZERO_ADDRESS)).to.be.revertedWith(
        'Token not permitted'
      );
    });

    it('reverts for a zero amount provided', async () => {
      const { bribeManager } = await loadFixture(bribeFixture);

      await expect(bribeManager.addBribe(TOKENS[0], 0, ZERO_ADDRESS)).to.be.revertedWith(
        'Zero bribe amount'
      );
    });
  });

  describe('Gauge input validation', () => {
    it('reverts for zero address', async () => {
      const { bribeManager } = await loadFixture(bribeFixture);

      await expect(bribeManager.addBribe(TOKENS[0], bribeAmount, ZERO_ADDRESS)).to.be.revertedWith(
        'Gauge not provided'
      );
    });

    it('reverts for an unapproved gauge', async () => {
      const { bribeManager } = await loadFixture(bribeFixture);

      await expect(
        bribeManager.addBribe(TOKENS[0], bribeAmount, BNB_BUSD_GAUGE)
      ).to.be.revertedWith('Gauge not permitted');
    });
  });

  describe('When inputs are correct', () => {
    it('adds a bribe', async () => {
      await addBribe();
    });

    it('correctly sets all bribe fields', async () => {
      const { bribeManager, gaugeController, adminAccount } = await loadFixture(bribeFixture);

      // Give valid args and then verify
      const gauge = GAUGES[0];
      const token = TOKENS[0];
      await bribeManager.addBribe(token, bribeAmount, gauge);
      const controllerNextEpochTime = await gaugeController.time_total();
      const gaugeBribes: any[] = await bribeManager.getGaugeBribes(gauge, controllerNextEpochTime);

      expect(gaugeBribes.length).to.equal(1);
      const gaugeBribe = gaugeBribes[0];
      expect(gaugeBribe.epochStartTime).to.equal(controllerNextEpochTime);
      expect(gaugeBribe.briber).to.equal(adminAccount.address);
      expect(gaugeBribe.gauge).to.equal(gauge);
      expect(gaugeBribe.token).to.equal(token);
    });

    it('checkpoints the controller to set epoch time correctly', async () => {
      const { bribeManager, gaugeController } = await loadFixture(bribeFixture);

      /**
       * Validate that a bribe added during a time when the controller checkpoint is lagging, still has the epochStartTime set correctly.
       * Should trigger a controller checkpoint to update time_total to the next week, and then set the bribe time to match the new epoch start reference.
       */

      let controllerNextEpochTime = (await gaugeController.time_total()).toNumber();

      // Move to start of next epoch plus some buffer
      await time.increaseTo(controllerNextEpochTime + DAY);
      // Controller has not be checkpointed now in the new epoch

      const currentBlockTime = await time.latest();
      controllerNextEpochTime = (await gaugeController.time_total()).toNumber();

      // sanity check
      expect(currentBlockTime > controllerNextEpochTime).to.be.true;

      // After adding a bribe, the controller time_total should be set to the next epoch time.
      // Also the new bribe should have an epoch start time matching the now updated controller epoch time.

      const gauge = GAUGES[0];
      const token = TOKENS[0];

      const controllerTimeBefore = (await gaugeController.time_total()).toNumber();

      await bribeManager.addBribe(token, bribeAmount, gauge);

      // Make sure epoch was updated
      controllerNextEpochTime = (await gaugeController.time_total()).toNumber();
      expect(controllerNextEpochTime).to.equal(controllerTimeBefore + WEEK);

      const gaugeBribes: any[] = await bribeManager.getGaugeBribes(gauge, controllerNextEpochTime);

      // New bribe should be aligned with updated controller checkpoint epoch
      expect(gaugeBribes[0].epochStartTime).to.equal(controllerNextEpochTime);
    });

    describe('Updating reward handler state', () => {
      it('reward handler balance for token is updated', async () => {
        const { adminAccount, rewardHandler } = await loadFixture(bribeFixture);
        const token = getERC20(TOKENS[0], adminAccount);
        await addBribe(token.address);
        expect(await token.balanceOf(rewardHandler.address)).to.equal(bribeAmount);
      });

      it('updates the remaining balance for the reward distribution channel', async () => {
        const { adminAccount, rewardHandler } = await loadFixture(bribeFixture);

        const token = TOKENS[1];
        const amount = bribeAmount;
        await addBribe(token, amount);

        // channel ids are created from the hash of the token and the briber
        const balance = await rewardHandler.getRemainingBalance(token, adminAccount.address);
        expect(balance).to.equal(amount);
      });
    });
  });

  describe('Accessing bribe records', () => {
    const token = TOKENS[0];
    const amount = bribeAmount;
    const gauge = GAUGES[0];

    // let epochTime: BigNumberish;

    describe('Improper arguments', () => {
      // TODO: Update contract and test removing zero checks to see effect on contract operations
      it('reverts for zero gauge address', async () => {
        const { bribeManager } = await loadFixture(bribeFixture);
        await expect(bribeManager.getBribe(ZERO_ADDRESS, 0, 0)).to.be.revertedWith('Invalid gauge');
      });

      it('reverts for zero epoch time', async () => {
        const { bribeManager } = await loadFixture(bribeFixture);

        await expect(bribeManager.getBribe(gauge, 0, 0)).to.be.revertedWith(
          'Invalid epoch timestamp'
        );
      });

      it('reverts if bribe record does not exist', async () => {
        const { bribeManager } = await loadFixture(bribeFixture);
        const { epochTime } = await addBribe(token, amount, gauge);

        // Give valid inputs but for a gauge that no bribe has been created for
        await expect(bribeManager.getBribe(GAUGES[1], epochTime, 0)).to.be.revertedWith(
          'No bribes for epoch'
        );
      });

      it('reverts for an invalid bribe index', async () => {
        const { bribeManager } = await loadFixture(bribeFixture);
        const { epochTime } = await addBribe(token, amount, gauge);

        // Currently only one record added. So index of 1 should be invalid
        await expect(bribeManager.getBribe(gauge, epochTime, 1)).to.be.revertedWith(
          'Invalid index'
        );
      });
    });

    describe('Correct arguments provided', () => {
      it('returns the bribe record', async () => {
        const { bribeManager, adminAccount } = await loadFixture(bribeFixture);
        const { epochTime } = await addBribe(token, amount, gauge);

        const bribe = await bribeManager.getBribe(gauge, epochTime, 0);
        expect(bribe.gauge).to.equal(gauge);
        expect(bribe.amount).to.equal(amount);
        expect(bribe.token).to.equal(token);
        expect(bribe.briber).to.equal(adminAccount.address);
      });
    });
  });
});
