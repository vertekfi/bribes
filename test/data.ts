export const GAUGE_CONTROLLER = '0x99bFf5953843A211792BF3715b1b3b4CBeE34CE6';
export const VAULT = '0x719488F4E859953967eFE963c6Bed059BaAab60c';

export const TOKENS = [
  '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', // BUSD
  '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
];

export const GAUGES = [
  '0xE7A9d3F14A19E6CF1C482aB0e8c7aE40b40a61c0', // ASHARE-BUSD
  '0x2dA4D175C614Fd758ecB90c5338458467dE869E4', // AMES-BUSD
];

export const THREE_AMIGOS_GAUGE = '0x9DAb43a1D850eC820C88a19561C1fD87dEC09193';
// Root for the test user data below
export const MERKLE_ROOT = '0x2937edf03ba61de00fab745bfde225c79d67ede892f7e981f01f7a45d4ed01ac';

// From real user results data from testing result based on:
// epoch 20230216-20230222
// BUSD token,
// bribe amount of 100
// Three Amigos gauge
export const USER_DATA = [
  {
    user: '0xEbE3e42e2aDD2a7D4d5FB2B35793ABf389393855',
    gauge: '0x9DAb43a1D850eC820C88a19561C1fD87dEC09193',
    token: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    userGaugeRelativeWeight: 0.00018024869436,
    userRelativeAmount: 0.018024869436000002,
    values: {
      proof: [
        '0xf72085dcfcfba1dfd43968658c9b915472036dd6f80c61c43a1b716cb32b6b3b',
        '0xa5e2928996b851453785d7ad20c9615b999eafd598735c58a35aafe37f8d2f42',
        '0xc79386246a7e698fe38eb780ff69adb27a61c7e8d3b825916e1755e949d5bbaa',
      ],
      value: ['0xEbE3e42e2aDD2a7D4d5FB2B35793ABf389393855', '18024869436000002'],
    },
  },
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
  {
    user: '0x8089186e8B3f7d79B8AEaB6D6d120C4214D464e8',
    gauge: '0x9DAb43a1D850eC820C88a19561C1fD87dEC09193',
    token: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    userGaugeRelativeWeight: 0.004018152854,
    userRelativeAmount: 0.4018152854,
    values: {
      proof: [
        '0xf84b36bf6ff35f7daf517b169e77e92201f1f833e1c313a6ed2fbf50326447dc',
        '0xa5e2928996b851453785d7ad20c9615b999eafd598735c58a35aafe37f8d2f42',
        '0xc79386246a7e698fe38eb780ff69adb27a61c7e8d3b825916e1755e949d5bbaa',
      ],
      value: ['0x8089186e8B3f7d79B8AEaB6D6d120C4214D464e8', '401815285400000000'],
    },
  },
  {
    user: '0x7a96a49418A101f63731AE1af8e1995bE7B13F38',
    gauge: '0x9DAb43a1D850eC820C88a19561C1fD87dEC09193',
    token: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    userGaugeRelativeWeight: 0.00030724209266,
    userRelativeAmount: 0.030724209266000002,
    values: {
      proof: [
        '0x79283d76ecd3bc7474d59d41caa17e42b0f1ad4ef4ff577a87abbcee7cc0fe87',
        '0x3fd29ef97233a3e82cf3dd54f2fc1e2c3337ba3120ae492cee97536d17f05346',
        '0x888675bd3a1a715751c6624c4f73a8201175967524e15c894a80a09ca4ae2613',
        '0x99fdfdb3fd64a579f4efa5647b2f8a01f9b04ce7327bed7f65cfd1b2aebbdc34',
      ],
      value: ['0x7a96a49418A101f63731AE1af8e1995bE7B13F38', '30724209266000002'],
    },
  },
  {
    user: '0x679641F9450609D2Ca03B2C468AC8631f87d8Ee6',
    gauge: '0x9DAb43a1D850eC820C88a19561C1fD87dEC09193',
    token: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    userGaugeRelativeWeight: 0.00034054538457,
    userRelativeAmount: 0.034054538457,
    values: {
      proof: [
        '0x6801c88d0478c2bd15010c025fd05c007530fa90a6db8e7ffd352c7c3a3d1fdc',
        '0x1b2f4fb875447a96dedff240b68eb0c09ca4bde8926c3b449bf5ede9ed384924',
        '0xf46eac2150a6c19f9ef19dbe2b27632c2a3537993497abeb05733614fb8c400f',
        '0x99fdfdb3fd64a579f4efa5647b2f8a01f9b04ce7327bed7f65cfd1b2aebbdc34',
      ],
      value: ['0x679641F9450609D2Ca03B2C468AC8631f87d8Ee6', '34054538457000000'],
    },
  },
  {
    user: '0x3e8c91472fC50A8528e448FF501AF9bf8C00Cceb',
    gauge: '0x9DAb43a1D850eC820C88a19561C1fD87dEC09193',
    token: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    userGaugeRelativeWeight: 0.02349548683838,
    userRelativeAmount: 2.349548683838,
    values: {
      proof: [
        '0xcc8bce1cd364ae517ba13a955b1557cf94915d3c5aaec720c8bf46af2cba816d',
        '0xb8aba4833c6d15eead71589ec478172ebcd0f63d3c6fa822ef3478b488e0fd72',
        '0x888675bd3a1a715751c6624c4f73a8201175967524e15c894a80a09ca4ae2613',
        '0x99fdfdb3fd64a579f4efa5647b2f8a01f9b04ce7327bed7f65cfd1b2aebbdc34',
      ],
      value: ['0x3e8c91472fC50A8528e448FF501AF9bf8C00Cceb', '2349548683838000000'],
    },
  },
  {
    user: '0x111fbf7b389e024d09F35fb091D7D4479b321B0A',
    gauge: '0x9DAb43a1D850eC820C88a19561C1fD87dEC09193',
    token: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    userGaugeRelativeWeight: 0.04554017896221,
    userRelativeAmount: 4.554017896221,
    values: {
      proof: [
        '0xd4184ce71e3d7324e571805be1151fb973d39203e2f9bc2b34cc7faf2eadf8e9',
        '0x75d1f53a432c33e952e7771bcecba6146f0ce55f4993a719cca53e141143f24c',
        '0xc79386246a7e698fe38eb780ff69adb27a61c7e8d3b825916e1755e949d5bbaa',
      ],
      value: ['0x111fbf7b389e024d09F35fb091D7D4479b321B0A', '4554017896221000000'],
    },
  },
  {
    user: '0xf7fa6A0642E2593F7BDd7b2E0A2673600d53BBE9',
    gauge: '0x9DAb43a1D850eC820C88a19561C1fD87dEC09193',
    token: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    userGaugeRelativeWeight: 0.0219421829385,
    userRelativeAmount: 2.19421829385,
    values: {
      proof: [
        '0x0d9c3d76dcd090723a8466bb472dc1c2d2663554c54325c3c9b4fd3996bc0f19',
        '0x6fbb5844e7754d9c1d7c48d20f20a2f026e76d72947374f8aa2cab3d552ee5e1',
        '0xf46eac2150a6c19f9ef19dbe2b27632c2a3537993497abeb05733614fb8c400f',
        '0x99fdfdb3fd64a579f4efa5647b2f8a01f9b04ce7327bed7f65cfd1b2aebbdc34',
      ],
      value: ['0xf7fa6A0642E2593F7BDd7b2E0A2673600d53BBE9', '2194218293850000000'],
    },
  },
  {
    user: '0x453227d4be3D8aB37F38E71a266ACF7A71d76173',
    gauge: '0x9DAb43a1D850eC820C88a19561C1fD87dEC09193',
    token: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    userGaugeRelativeWeight: 0.0149059276595,
    userRelativeAmount: 1.49059276595,
    values: {
      proof: [
        '0x7192c03e57d05357e3459d339bf9d5c73954828dcaed7c2746b5af610cb67e53',
        '0x3fd29ef97233a3e82cf3dd54f2fc1e2c3337ba3120ae492cee97536d17f05346',
        '0x888675bd3a1a715751c6624c4f73a8201175967524e15c894a80a09ca4ae2613',
        '0x99fdfdb3fd64a579f4efa5647b2f8a01f9b04ce7327bed7f65cfd1b2aebbdc34',
      ],
      value: ['0x453227d4be3D8aB37F38E71a266ACF7A71d76173', '1490592765950000000'],
    },
  },
  {
    user: '0xB7BbEa1200426defa0b7b76E3D23CF3DFDfBF21A',
    gauge: '0x9DAb43a1D850eC820C88a19561C1fD87dEC09193',
    token: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    userGaugeRelativeWeight: 0.00699434696605,
    userRelativeAmount: 0.699434696605,
    values: {
      proof: [
        '0xed7e47212b3dccfbdb3779e514a31bb1f6e49b8d1ceaffe7d2c7317f7019d011',
        '0x75d1f53a432c33e952e7771bcecba6146f0ce55f4993a719cca53e141143f24c',
        '0xc79386246a7e698fe38eb780ff69adb27a61c7e8d3b825916e1755e949d5bbaa',
      ],
      value: ['0xB7BbEa1200426defa0b7b76E3D23CF3DFDfBF21A', '699434696605000000'],
    },
  },
  {
    user: '0x771D1A7D23D30F9030bC607a559Ce3e7496D8422',
    gauge: '0x9DAb43a1D850eC820C88a19561C1fD87dEC09193',
    token: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    userGaugeRelativeWeight: 0.79095441430032,
    userRelativeAmount: 79.095441430032,
    values: {
      proof: [
        '0x4a78a06de71c0db6c25897c50c469c055e7066efd3fc66b518a0d2d3d2b74a98',
        '0x6fbb5844e7754d9c1d7c48d20f20a2f026e76d72947374f8aa2cab3d552ee5e1',
        '0xf46eac2150a6c19f9ef19dbe2b27632c2a3537993497abeb05733614fb8c400f',
        '0x99fdfdb3fd64a579f4efa5647b2f8a01f9b04ce7327bed7f65cfd1b2aebbdc34',
      ],
      value: ['0x771D1A7D23D30F9030bC607a559Ce3e7496D8422', '79095441430032000000'],
    },
  },
];
