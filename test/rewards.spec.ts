import { impersonateAccount, loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { BigNumber, Contract } from 'ethers';
import { defaultAbiCoder, formatEther, parseEther } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { addBribe } from './bribe.utils';
import { ZERO_ADDRESS } from './constants';
import { GAUGES, MERKLE_ROOT, TOKENS, USER_DATA } from './data';
import { bribeFixture } from './fixtures/bribe.fixture';
import { getAccessControlRevertString, getERC20, getRandomBytes32 } from './utils';

const bribeAmount = parseEther('100');

async function doBribeAndDistribution(root?: string) {
  const { rewardHandler, adminAccount } = await loadFixture(bribeFixture);

  const epochTime = await addBribe();

  // addBribe uses index zero by default
  const token = TOKENS[0];
  const gauge = GAUGES[0];
  const distributionId = 0;
  const merkleRoot = root || getRandomBytes32();

  await expect(
    rewardHandler.createDistribution(
      token,
      gauge,
      epochTime,
      0,
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
      it('reverts if merkle root is not provided', async () => {
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
            getRandomBytes32(parseEther('0')) // invalid zero bytes
          )
        ).to.be.revertedWith('Merkle root not set');
      });

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

  describe('Claiming Rewards', () => {
    describe('Verifying claim state', () => {
      it('returns true to if claim is valid', async () => {
        // TODO: How to manage this for UI?
        // Need to get the distribution id during submission?
        // Can call from fe/be for next distribution id and minus 1
        // What if same briber adds bribes?
        // Might be an issue here with how the state is held then
        //
        // **Contract does account for this in some way already
        // Multiple distributions are consolidated by token at claim time then
        // "Note that balances to claim are here accumulated *per token*, independent of the distribution channel and
        // claims set accounting."

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

    describe('When claim state is valid', () => {
      it('claims a distribution for a user', async () => {
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
        console.log(formatEther(userBalanceBefore));

        await rewardHandler.claimDistributions(
          claimer,
          [[distributionId, balance, distributor, tokenIndex, merkleProof]],
          tokensToClaim
        );

        const userBalanceAfter: BigNumber = await tokenInstance.balanceOf(claimer);
        console.log(formatEther(userBalanceAfter));

        expect(userBalanceAfter.sub(userBalanceBefore)).to.equal(balance);

        const isClaimed = await rewardHandler.isClaimed(
          token,
          distributor,
          distributionId,
          claimer
        );

        expect(isClaimed).to.be.true;
      });

      //  it('does not allow claiming a distribution again', async () => {
      //   const { distributionId, adminAccount, token } = await doBribeAndDistribution(MERKLE_ROOT);

      //   const testClaimer = USER_DATA[1];

      //   const balance = testClaimer.values.value[1]; // amount being claimed
      //   const distributor = adminAccount.address;
      //   const tokenIndex = 0;
      //   const merkleProof = [];

      //   const claim = {
      //     distributionId,
      //     balance,
      //     distributor,
      //   };
      // });

      // it('claims multiple distributions for a user', async () => {
      //   const { distributionId, adminAccount, token } = await doBribeAndDistribution(MERKLE_ROOT);

      //   const testClaimer = USER_DATA[1];
      // // TODO: Test claiming with multiple tokens/distributions, etc.
      //   const balance = testClaimer.values.value[1]; // amount being claimed
      //   const distributor = adminAccount.address;
      //   const tokenIndex = 0;
      //   const merkleProof = [];

      //   const claim = {
      //     distributionId,
      //     balance,
      //     distributor,
      //   };
      // });
    });
  });
});
