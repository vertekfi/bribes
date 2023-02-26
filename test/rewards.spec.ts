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

// const protocolId = "Funny dummy money";

describe('Merkle Rewards', () => {
  describe('Adding Rewards', () => {
    it('adds an epoch reward for a gauge', async () => {
      const { bribeManager } = await loadFixture(bribeFixture);
    });
  });

  describe('Claiming Rewards', () => {
    it('', async () => {});
  });
});