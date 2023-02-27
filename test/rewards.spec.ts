import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { parseEther, parseUnits } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { GAUGES, MERKLE_ROOT, TOKENS, USER_DATA } from './data';
import { bribeFixture } from './fixtures/bribe.fixture';
import { addBribe, getAccessControlRevertString, getRandomBytes32, keccak256 } from './utils';

const ZERO_ADDRESS = ethers.constants.AddressZero;
const WBTC = '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c';
const BNB_BUSD_GAUGE = '0xC32389561da25C3AD66aBd55A2db0B6172F9C759';
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
    describe('Invalid claim state', () => {
      it('reverts when invalid proofs are provided', async () => {
        await doBribeAndDistribution();
      });

      it('reverts when user has already claimed for distribbution', async () => {
        await doBribeAndDistribution();
      });
    });

    describe('Verifying claim state', () => {
      it('returns true to if claim is valid', async () => {
        // TODO: How to manage this for UI?
        // Need to get the distribution id during submission?
        // Can call from fe/be for next distribution id and minus 1
        // What if same briber adds bribes?
        // Might be an issue here with how the state is held then
        // ....

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

      // it('returns to false if the distribution has not been claimed', async () => {
      //   // We know the user is apart of the tree
      //   const testClaimer = USER_DATA[2];

      //   // Submitting with real generated root that contains the test user leaf
      //   const { distributionId, adminAccount, token, rewardHandler } = await doBribeAndDistribution(
      //     MERKLE_ROOT
      //   );

      //   // isClaimed()

      //   const distributor = adminAccount.address;
      //   const userClaimAmount = parseUnits(String(testClaimer.userRelativeAmount));
      //   const merkleProof = testClaimer.values.proof;

      //   const isValidClaim = await rewardHandler.isClaimed(
      //     token,
      //     distributor,
      //     distributionId,
      //     testClaimer.user,
      //     userClaimAmount,
      //     merkleProof
      //   );
      // });
    });

    // describe('Valid claim state', () => {
    //   it('claims a distribution for a user', async () => {
    //     const { distributionId, adminAccount } = await doBribeAndDistribution(MERKLE_ROOT);
    //     // isClaimed()
    //     // verifyClaim()
    //     // We know the user is apart of the tree
    //     const testClaimer = USER_DATA[2];
    //     // struct Claim {
    //     //   uint256 distributionId;
    //     //   uint256 balance;
    //     //   address distributor;
    //     //   uint256 tokenIndex;
    //     //   bytes32[] merkleProof;
    //     // }
    //     const balance = parseEther(''); // amount being claimed
    //     const distributor = adminAccount.address;
    //     const tokenIndex = 0;
    //     const merkleProof = [];
    //     const claim = {
    //       distributionId,
    //     };
    //     // function claimDistributions(
    //     //   address claimer,
    //     //   Claim[] memory claims,
    //     //   IERC20Upgradeable[] memory tokens
    //     // ) external {
    //     //     _processClaims(claimer, claimer, claims, tokens);
    //     // }
    //   });
    // });
  });
});
