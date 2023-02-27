import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { parseEther } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { GAUGES, TOKENS } from './data';
import { bribeFixture } from './fixtures/bribe.fixture';
import { addBribe, getAccessControlRevertString, getRandomBytes32 } from './utils';

const ZERO_ADDRESS = ethers.constants.AddressZero;
const WBTC = '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c';
const BNB_BUSD_GAUGE = '0xC32389561da25C3AD66aBd55A2db0B6172F9C759';
const bribeAmount = parseEther('100');

describe('Merkle Rewards', () => {
  describe('Creation Distributions', () => {
    describe('When caller does not have the proper role', () => {
      it('reverts', async () => {
        const { rewardHandler, randomUserAccount } = await loadFixture(bribeFixture);

        await expect(
          rewardHandler
            .connect(randomUserAccount)
            .createDistribution(
              ZERO_ADDRESS,
              ZERO_ADDRESS,
              0,
              0,
              0,
              ZERO_ADDRESS,
              0,
              ethers.constants.HashZero
            )
        ).to.be.revertedWith(
          getAccessControlRevertString(
            randomUserAccount.address,
            await rewardHandler.DISTRIBUTOR_ROLE()
          )
        );
      });
    });

    describe('Incorrect input values', () => {
      it('reverts when the bribe record values do not match input parameters', async () => {
        const { rewardHandler, adminAccount } = await loadFixture(bribeFixture);
        const epochTime = await addBribe();
        // addBribe uses index zero by default
        const token = TOKENS[0];
        const gauge = GAUGES[0];
        const distributionId = 0;
        await expect(
          rewardHandler.createDistribution(
            token,
            gauge,
            epochTime,
            0, // valid index
            parseEther('1'), // invalid, default 100 was used
            adminAccount.address, // valid
            distributionId, // valid
            getRandomBytes32() // valid
          )
        ).to.be.revertedWith('Invalid bribe record');
      });
    });

    describe('When input values are correct', () => {
      async function doBribeAndDistribution() {
        const { rewardHandler, adminAccount } = await loadFixture(bribeFixture);

        const epochTime = await addBribe();

        // addBribe uses index zero by default
        const token = TOKENS[0];
        const gauge = GAUGES[0];
        const distributionId = 0;

        await expect(
          rewardHandler.createDistribution(
            token,
            gauge,
            epochTime,
            0,
            bribeAmount,
            adminAccount.address,
            distributionId,
            getRandomBytes32()
          )
        ).to.not.be.reverted;

        return {
          epochTime,
          distributionId,
          token,
          rewardHandler,
          adminAccount,
        };
      }

      it('increments the distribution id for the channel', async () => {
        const { distributionId, rewardHandler, token, adminAccount } =
          await doBribeAndDistribution();

        const nextDistId = await rewardHandler.getNextDistributionId(token, adminAccount.address);
        expect(nextDistId).to.equal(distributionId + 1);
      });
    });
  });

  // describe('Claiming Rewards', () => {
  //   it('', async () => {});
  // });
});
