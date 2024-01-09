import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-viem";
import * as dotenv from "dotenv";

dotenv.config();
const { PRIVATE_KEY, API_KEY, BSCSCAN_API_KEY, ETHERSCAN_API_KEY } = process.env;

const config: HardhatUserConfig = {
	solidity: {
		version: "0.8.20",
		settings: {
			outputSelection: {
				"*": {
					"*": ["storageLayout"],
				},
			},
			optimizer: {
				enabled: true,
			},
		},
	},

	defaultNetwork: "hardhat",

	networks: {
		sepolia: {
			// url: `https://eth-sepolia.g.alchemy.com/v2/${API_KEY}`,
			url: `https://rpc2.sepolia.org`,
			accounts: [`0x${PRIVATE_KEY}`],
		},
		bsc_testnet: {
			url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
			chainId: 97,
			gasPrice: 5000000000,
			accounts: [`0x${PRIVATE_KEY}`],
		},
		hardhat: {
			forking: {
				url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
				enabled: false,
			},
			allowUnlimitedContractSize: true,
		},
	},

	etherscan: {
		apiKey: BSCSCAN_API_KEY,
		// apiKey: ETHERSCAN_API_KEY,
	},

	mocha: {
		timeout: 100000000
	  },
};

export default config;
