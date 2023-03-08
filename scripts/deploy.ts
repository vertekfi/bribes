import { ethers, upgrades } from 'hardhat';

export const GAUGE_CONTROLLER = '0x99bFf5953843A211792BF3715b1b3b4CBeE34CE6';
const INITIAL_TOKENS = [
  '0x50d8d7f7ccea28cc1c9ddb996689294dc62569ca',
  '0x7a5c2c519a8e0f384692280fd4cff02261557f76',
  '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c',
  '0x5376a83112100ff1567b2782e0d99c6d949b5509',
  '0xed236c32f695c83efde232c288701d6f9c23e60e',
  '0xad29abb318791d579433d831ed122afeaf29dcfe',
  '0xb9e05b4c168b56f73940980ae6ef366354357009',
  '0xfa4b16b0f63f5a6d0651592620d585d308f749a4',
  '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
  '0x55d398326f99059ff775485246999027b3197955',
  '0xf22894d191212b6871182417df61ad832bce57c7',
  '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3',
  '0xe9e7cea3dedca5984780bafc599bd69add087d56',
  '0x60d66a5152612f7d550796910d022cb2c77b09de',
  '0x3cc9e655b6c4f530dfc1b1fc51ceea65c6344716',
  '0x90c97f71e18723b0cf0dfa30ee176ab653e89f40',
  '0x14016e85a25aeb13065688cafb43044c2ef86784',
  '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
  '0xd50c729cebb64604b99e1243a54e840527360581',
  '0x3bc5ac0dfdc871b365d159f728dd1b9a0b5481e8',
  '0xd68f75b3aa54bee23e6ac3ad4b3c28d3e6319725',
  '0x6640e6f8e3dd1fb5d7361ee2249e1ea23cb2c297',
  '0x12b70d84dab272dc5a24f49bdbf6a4c4605f15da',
  '0xc91324601b20ea0e238b63c9fafca18d32600722',
  '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
  '0x9562ca0c2b05d089063f562fc3ecc95e4424ad02',
  '0xc95cd75dcea473a30c8470b232b36ee72ae5dcc2',
];
const INITIAL_GAUGES = [
  '0x1DdAC329f570dF5d83DfAC1720828276Ca49b129',
  '0xE7A9d3F14A19E6CF1C482aB0e8c7aE40b40a61c0',
  '0x2dA4D175C614Fd758ecB90c5338458467dE869E4',
  '0xb5c57d37cc7cCEC7Cf22836A087DEC280daB99f5',
  '0x9C4e2444d40508dF540466cCBD83855e39E5972B',
  '0xC32389561da25C3AD66aBd55A2db0B6172F9C759',
  '0x35756EB391B93Fe3457aC4A7fae198552AC3AC28',
  '0xfB1B49d41E64D44eE5ab69cD6aC8576213CE2223',
  '0x148708d34F797473Cad01AC113CFD4208a57C081',
  '0xb49e0053C1d6ccF4250FCD21F3906f624727b722',
  '0x9E7dF5b7B29d46B10C28b4AB5fb0E7b6A4ffAE55',
  '0x2837b3A08Cbfc3Eb3E1FFe363Fb1E443667e287f',
  '0xFf71E6499f492Ce41c84Eefbf727774165dC5aBa',
  '0x7916972323a4e881eF4b12c6c6AED6e0C5C6377E',
  '0xe05DE828EedCe4c4cAa532750F8f0d95a0Fd094e',
  '0xEAaECFEc3DC43c1702A477D8CbC7c92749adCD87',
  '0x355827abb16998a07700FAF52AeE09f2b01Fad4C',
  '0x8601DFCeE55E9e238f7ED7c42f8E46a7779e3f6f',
  '0x9DAb43a1D850eC820C88a19561C1fD87dEC09193',
];

async function main() {
  // const MerkleOrchard = await ethers.getContractFactory('MerkleOrchard');
  // const rewardHandler = await upgrades.deployProxy(MerkleOrchard, []);
  // await rewardHandler.deployed();

  // console.log(`MerkelOrchard deployed to: ${rewardHandler.address}`);

  // const BribeManager = await ethers.getContractFactory('BribeManager');
  // const bribeManager = await upgrades.deployProxy(BribeManager, [
  //   GAUGE_CONTROLLER,
  //   rewardHandler.address,
  //   INITIAL_GAUGES,
  //   INITIAL_TOKENS,
  // ]);
  // await bribeManager.deployed();

  // console.log(`BribeManager deployed to: ${bribeManager.address}`);

  // await rewardHandler.setBribeManager(bribeManager.address);

  // const BribeManager = await ethers.getContractFactory('BribeManager');
  // const bribeManager = await upgrades.upgradeProxy(
  //   '0xb1B1695FeA2E3a8B2aAE3A0d2a59Ea3F5e4A7508',
  //   BribeManager
  // );
  // await bribeManager.deployed();
  // console.log(`BribeManager upgrade complete`);

  const MerkleOrchard = await ethers.getContractFactory('MerkleOrchard');
  const rewardHandler = await upgrades.upgradeProxy(
    '0x27eDCe99d5aF44318358497fD5Af5C8e312F1721',
    MerkleOrchard
  );
  await rewardHandler.deployed();
  console.log(`MerkelOrchardupgrade upgrade complete`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
