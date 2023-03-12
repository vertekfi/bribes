import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { parseEther } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { addBribe, bribeAmount } from './bribe.utils';
import { ZERO_ADDRESS, ZERO_BYTES_32 } from './constants';
import { MERKLE_ROOT, TOKENS, USER_DATA } from './data';
import { bribeFixture } from './fixtures/bribe.fixture';
import { getAccessControlRevertString, getERC20, getRandomBytes32 } from './utils';

async function doBribeAndDistribution(root?: string) {
  const { rewardHandler, adminAccount } = await loadFixture(bribeFixture);

  const { epochTime } = await addBribe();

  // addBribe uses index zero by default
  const token = TOKENS[0];
  const distributionId = 0;
  const merkleRoot = root || getRandomBytes32();

  await expect(
    rewardHandler.createDistribution(
      token,
      bribeAmount,
      adminAccount.address,
      distributionId,
      merkleRoot
    )
  ).to.not.be.reverted;

  return {
    epochTime,
    distributionId,
    token,
    rewardHandler,
    adminAccount,
    merkleRoot,
  };
}

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
      it('reverts if merkle root is not provided', async () => {
        const { rewardHandler, adminAccount } = await loadFixture(bribeFixture);

        // addBribe uses index zero by default
        const token = TOKENS[0];
        const distributionId = 0;

        await expect(
          rewardHandler.createDistribution(
            token,
            bribeAmount,
            adminAccount.address,
            distributionId,
            ZERO_BYTES_32 // invalid zero bytes
          )
        ).to.be.revertedWith('Merkle root not set');
      });
    });

    describe('When input values are correct', () => {
      it('increments the distribution id for the channel', async () => {
        const { distributionId, rewardHandler, token, adminAccount } =
          await doBribeAndDistribution();

        const nextDistId = await rewardHandler.getNextDistributionId(token, adminAccount.address);
        expect(nextDistId).to.equal(distributionId + 1);
      });

      it('sets the merkle root for the distribution', async () => {
        const { distributionId, rewardHandler, token, adminAccount, merkleRoot } =
          await doBribeAndDistribution();

        const root = await rewardHandler.getDistributionRoot(
          token,
          adminAccount.address,
          distributionId
        );
        expect(root).to.equal(merkleRoot);
      });
    });
  });

  describe('Verifying claim state', () => {
    it('returns true to if claim is valid', async () => {
      // We know the user is apart of the tree
      const testClaimer = USER_DATA[1];
      // Submitting with real generated root that contains the test user leaf
      const { distributionId, adminAccount, token, rewardHandler } = await doBribeAndDistribution(
        MERKLE_ROOT
      );
      const briber = adminAccount.address;
      const userClaimAmount = testClaimer.values.value[1];
      const claimer = testClaimer.user;
      const merkleProof = testClaimer.values.proof;
      const isValidClaim = await rewardHandler.verifyClaim(
        token,
        briber,
        distributionId,
        claimer,
        userClaimAmount,
        merkleProof
      );

      expect(isValidClaim).to.be.true;
    });

    it('returns false to if claim is invalid', async () => {
      const testClaimer = USER_DATA[1];
      const { distributionId, adminAccount, token, rewardHandler } = await doBribeAndDistribution(
        MERKLE_ROOT
      );
      const briber = adminAccount.address;
      let userClaimAmount = '1000000'; // provide an incorrect amount
      let claimer = testClaimer.user;
      const merkleProof = testClaimer.values.proof;
      let isValidClaim = await rewardHandler.verifyClaim(
        token,
        briber,
        distributionId,
        claimer,
        userClaimAmount,
        merkleProof
      );

      expect(isValidClaim).to.be.false;

      // Provide invalid user address. Account is not part of the generated tree
      claimer = adminAccount.address;
      userClaimAmount = testClaimer.values.value[1];
      isValidClaim = await rewardHandler.verifyClaim(
        token,
        briber,
        distributionId,
        claimer,
        userClaimAmount,
        merkleProof
      );

      expect(isValidClaim).to.be.false;
    });

    it('returns false if the user has not claimed the distribution', async () => {
      const testClaimer = USER_DATA[1];
      // Submitting with real generated root that contains the test user leaf
      const { distributionId, adminAccount, token, rewardHandler } = await doBribeAndDistribution(
        MERKLE_ROOT
      );

      const briber = adminAccount.address;
      const claimer = testClaimer.user;
      const isClaimed = await rewardHandler.isClaimed(token, briber, distributionId, claimer);

      // User is valid but has not claimed distribution
      expect(isClaimed).to.be.false;
    });
  });

  describe('Claiming Rewards', () => {
    async function doValidClaim() {
      const { rewardHandler, distributionId, adminAccount, token } = await doBribeAndDistribution(
        MERKLE_ROOT
      );
      const testClaimer = USER_DATA[1];
      const balance = testClaimer.values.value[1]; // amount being claimed
      const distributor = adminAccount.address;
      const tokenIndex = 0;
      const merkleProof = testClaimer.values.proof;
      const claimer = testClaimer.user;
      const tokensToClaim = [token];

      // Verify the user received their tokens
      const tokenInstance = getERC20(token, adminAccount);
      const userBalanceBefore: BigNumber = await tokenInstance.balanceOf(claimer);

      const claims = [[distributionId, balance, distributor, tokenIndex, merkleProof]];

      await rewardHandler.claimDistributions(claimer, claims, tokensToClaim);

      const userBalanceAfter: BigNumber = await tokenInstance.balanceOf(claimer);

      expect(userBalanceAfter.sub(userBalanceBefore)).to.equal(balance);

      const isClaimed = await rewardHandler.isClaimed(token, distributor, distributionId, claimer);

      expect(isClaimed).to.be.true;

      return {
        claimer,
        claims,
        tokensToClaim,
        rewardHandler,
      };
    }

    describe('When claim state is valid', () => {
      it('claims a distribution for a user', async () => {
        await doValidClaim();
      });

      // it('claims multiple distributions for a user', async () => {
      //   const { rewardHandler, adminAccount } = await loadFixture(bribeFixture);
      //   const testClaimer = USER_DATA[1];

      //   // Test claiming with multiple tokens/distributions, etc.
      //   const tokenOne = BUSD;
      //   const bribeOne = await addBribe(tokenOne);

      //   const tokenTwo = WBNB;
      //   const bribeTwo = await addBribe();

      //   // await rewardHandler.createDistribution(
      //   //   token,
      //   //   gauge,
      //   //   epochTime,
      //   //   bribeRecordIndex,
      //   //   bribeAmount,
      //   //   adminAccount.address,
      //   //   distributionId,
      //   //   merkleRoot
      //   // )
      // });
    });

    describe('When claim state is not valid', () => {
      it('does not allow claiming a distribution again', async () => {
        const { claimer, claims, tokensToClaim, rewardHandler } = await doValidClaim();

        await expect(
          rewardHandler.claimDistributions(claimer, claims, tokensToClaim)
        ).to.be.revertedWith('cannot claim twice');
      });
    });
  });
});
