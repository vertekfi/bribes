import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { defaultAbiCoder, parseEther } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { GAUGES, TOKENS } from './data';
import { bribeFixture } from './fixtures/bribe.fixture';
import { addBribe } from './utils';

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
          // prettier-ignore
          `AccessControl: account ${randomUserAccount.address.toLowerCase()} is missing role ${await rewardHandler.DISTRIBUTOR_ROLE()}`
        );
      });
    });

    describe('Incorrect input values', () => {
      it('reverts when the bribe record values do not match input parameters', async () => {
        const { rewardHandler, adminAccount } = await loadFixture(bribeFixture);

        // Create a valid bribe record and provide values for a nonexistent one
        const epochTime = await addBribe();

        // Use values from the default bribe creation to pass checks in `getBribe`,
        // since that was already test and not the concern here

        // addBribe uses index zero by default
        const token = TOKENS[0];
        const gauge = GAUGES[0];

        const dummyBytes32 = ethers.utils.hexZeroPad(parseEther('1').toHexString(), 32);

        await expect(
          rewardHandler.createDistribution(
            token,
            gauge,
            epochTime,
            0, // valid index
            parseEther('1'), // invalid, default 100 was used
            adminAccount.address, // valid
            0, // valid
            dummyBytes32 // valid
          )
        ).to.be.revertedWith('Invalid bribe record');
      });
    });

    // describe('When input values are correct', () => {
    //   // Need to create a bribe
    //   // Which creates a distribution record on rewarder <- verify

    //   it('increments the distribution id for the channel', async () => {});
    // });
  });

  // describe('Claiming Rewards', () => {
  //   it('', async () => {});
  // });
});
