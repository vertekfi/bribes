export const GAUGE_CONTROLLER = '0x99bFf5953843A211792BF3715b1b3b4CBeE34CE6';
export const VAULT = '0x719488F4E859953967eFE963c6Bed059BaAab60c';

export const BUSD = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56';
export const WBNB = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';

export const TOKENS = [BUSD, WBNB];

export const GAUGES = [
  '0xE7A9d3F14A19E6CF1C482aB0e8c7aE40b40a61c0', // ASHARE-BUSD
  '0x2dA4D175C614Fd758ecB90c5338458467dE869E4', // AMES-BUSD
];

export const THREE_AMIGOS_GAUGE = '0x9DAb43a1D850eC820C88a19561C1fD87dEC09193';

// Root for the off chain generated user data below
export const MERKLE_ROOT = '0x2937edf03ba61de00fab745bfde225c79d67ede892f7e981f01f7a45d4ed01ac';

// From real user results data from testing result based on:
// epoch 20230216-20230222
// BUSD token,
// bribe amount of 100
// Three Amigos gauge
export const USER_DATA = [
  {
    user: '0xc911fAAa3e4755A5aA451f394295062E0Ae623d1',
    gauge: '0x9DAb43a1D850eC820C88a19561C1fD87dEC09193',
    token: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    userGaugeRelativeWeight: 0.03945748783896,
    userRelativeAmount: 3.9457487838959997,
    values: {
      proof: [
        '0x6e20b571bef3f3793918ff3af87b4740a13a9545d8fe990cc0c7c41c12b40226',
        '0x1b2f4fb875447a96dedff240b68eb0c09ca4bde8926c3b449bf5ede9ed384924',
        '0xf46eac2150a6c19f9ef19dbe2b27632c2a3537993497abeb05733614fb8c400f',
        '0x99fdfdb3fd64a579f4efa5647b2f8a01f9b04ce7327bed7f65cfd1b2aebbdc34',
      ],
      value: ['0xc911fAAa3e4755A5aA451f394295062E0Ae623d1', '3945748783895999700'],
    },
  },
  {
    user: '0x8b8535c33783752FfbDB461865FdcA1f26F74E4A',
    gauge: '0x9DAb43a1D850eC820C88a19561C1fD87dEC09193',
    token: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    userGaugeRelativeWeight: 0.05186378547048,
    userRelativeAmount: 5.186378547048,
    values: {
      proof: [
        '0xca0081e3af34d8c2be459f89800f7f6a54ce13a7125261970f621635298cb60c',
        '0xb8aba4833c6d15eead71589ec478172ebcd0f63d3c6fa822ef3478b488e0fd72',
        '0x888675bd3a1a715751c6624c4f73a8201175967524e15c894a80a09ca4ae2613',
        '0x99fdfdb3fd64a579f4efa5647b2f8a01f9b04ce7327bed7f65cfd1b2aebbdc34',
      ],
      value: ['0x8b8535c33783752FfbDB461865FdcA1f26F74E4A', '5186378547048000000'],
    },
  },
];
