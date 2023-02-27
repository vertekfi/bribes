import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { parseEther } from 'ethers/lib/utils';
import { TOKENS, GAUGES } from './data';
import { bribeFixture } from './fixtures/bribe.fixture';

export const bribeAmount = parseEther('100');

export async function addBribe(
  token = TOKENS[0],
  amount = bribeAmount,
  gauge = GAUGES[0],
  epochStartTime?: number
) {
  const { bribeManager, gaugeController } = await loadFixture(bribeFixture);

  // Give valid args and then verify
  await bribeManager.addBribe(token, amount, gauge);
  const epochTime = epochStartTime || (await gaugeController.time_total());
  const gaugeBribes: any[] = await bribeManager.getGaugeBribes(gauge, epochTime);

  expect(gaugeBribes.length).to.equal(1);

  return {
    token,
    amount,
    gauge,
    epochTime,
  };
}
