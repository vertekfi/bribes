import * as dotenv from 'dotenv';
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@openzeppelin/hardhat-upgrades';

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.12',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      forking: {
        url: process.env.BSC_RPC || '',
        blockNumber: 26057094,
      },
    },
    goerli: {
      url: process.env.GOERLI_RPC || '',
      accounts: process.env.DEV_KEY !== undefined ? [process.env.DEV_KEY] : [],
    },
    bsc: {
      url: process.env.BSC_RPC || '',
      accounts: process.env.DEV_KEY !== undefined ? [process.env.DEV_KEY] : [],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
