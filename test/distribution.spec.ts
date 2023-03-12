import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { addBribe, bribeAmount } from './bribe.utils';
import { GAUGES, TEST_DIST_DATA, TOKENS } from './data';
import { bribeFixture } from './fixtures/bribe.fixture';
import { getERC20, getRandomBytes32 } from './utils';

async function doBribe(root: string) {
  const { rewardHandler, adminAccount } = await loadFixture(bribeFixture);

  const { epochTime } = await addBribe();

  // addBribe uses index zero by default
  const token = TOKENS[0];
  const distributionId = 0;
  const merkleRoot = root || getRandomBytes32();

  return {
    epochTime,
    distributionId,
    token,
    rewardHandler,
    adminAccount,
    briber: adminAccount.address,
    merkleRoot,
    bribeAmount,
  };
}

// async function doValidClaim() {
//   const { rewardHandler, distributionId, adminAccount, token } = await doBribe(
//     MERKLE_ROOT
//   );
//   const testClaimer = USER_DATA[1];
//   const balance = testClaimer.values.value[1]; // amount being claimed
//   const distributor = adminAccount.address;
//   const tokenIndex = 0;
//   const merkleProof = testClaimer.values.proof;
//   const claimer = testClaimer.user;
//   const tokensToClaim = [token];

//   // Verify the user received their tokens
//   const tokenInstance = getERC20(token, adminAccount);
//   const userBalanceBefore: BigNumber = await tokenInstance.balanceOf(claimer);

//   await rewardHandler.claimDistributions(
//     claimer,
//     [[distributionId, balance, distributor, tokenIndex, merkleProof]],
//     tokensToClaim
//   );

//   const userBalanceAfter: BigNumber = await tokenInstance.balanceOf(claimer);

//   expect(userBalanceAfter.sub(userBalanceBefore)).to.equal(balance);

//   const isClaimed = await rewardHandler.isClaimed(token, distributor, distributionId, claimer);

//   expect(isClaimed).to.be.true;

//   return {
//     claimer,
//     claims: [[distributionId, balance, distributor, tokenIndex, merkleProof]],
//     tokensToClaim,
//     rewardHandler,
//   };
// }

describe('Reward Distribution Update', () => {
  async function bribeeee() {
    return await doBribe(TEST_DIST_DATA.merkleRoot);
  }

  async function createDirectDistribution() {
    const { rewardHandler, token, briber, merkleRoot, bribeAmount, adminAccount, distributionId } =
      await bribeeee();

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
      rewardHandler,
      token,
      briber,
      merkleRoot,
      bribeAmount,
      adminAccount,
      distributionId,
    };
  }

  async function createAdminDistros() {
    const { rewardHandler, token, briber, merkleRoot, bribeAmount, adminAccount, distributionId } =
      await bribeeee();

    const structs = [
      {
        // token,
        // amount: bribeAmount,
        // briber,
        // merkleRoot,
      },
    ];
  }

  describe('Creating distributions', () => {
    it('creates one', async () => {
      await createDirectDistribution();
    });

    it('creates multiple distros at once', async () => {
      // test admin version also if time
    });
  });

  describe('Claiming Rewards', () => {
    it('lets a user claim', async () => {
      const { rewardHandler, distributionId, adminAccount, token } =
        await createDirectDistribution();

      // use test user to claim his waalto
      const user = TEST_DIST_DATA.userData[0];
      const merkleProof = user.values.proof;
      const amountBeingClaim = user.values.value[1];
      const briber = adminAccount.address;
      const tokensToClaim = [token];
      const tokenIndex = 0;

      // Claim structs
      const claims = [[distributionId, amountBeingClaim, briber, tokenIndex, merkleProof]];

      // Verify the user received their tokens
      const tokenInstance = getERC20(token, adminAccount);
      const userBalanceBefore: BigNumber = await tokenInstance.balanceOf(user.user);

      // We dont need to connect since can claim for anyone
      await rewardHandler.claimDistributions(user.user, claims, tokensToClaim);

      const userBalanceAfter: BigNumber = await tokenInstance.balanceOf(user.user);

      expect(userBalanceAfter.sub(userBalanceBefore)).to.equal(amountBeingClaim);

      const isClaimed = await rewardHandler.isClaimed(token, briber, distributionId, user.user);

      expect(isClaimed).to.be.true;
    });
  });
});
