import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@openzeppelin/hardhat-upgrades";
import "@openzeppelin/upgrades-core";
import "hardhat-chai-matchers-viem";
import "hardhat-gas-reporter";
import * as dotenv from "dotenv";
import { DiamondAndOZProxyResolver } from "./util/DiamondAndOZProxyResolver";

dotenv.config();
const {
	PRIVATE_KEY,
	BSCSCAN_API_KEY,
	ETHERSCAN_API_KEY,
	BLAST_SEPOLIA_API_KEY,
	MAINNET_PRIVATE_KEY,
} = process.env;

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
				runs: 200,
			},
		},
	},

	defaultNetwork: "hardhat",

	networks: {
		mainnet: {
			url: `https://eth-mainnet.g.alchemy.com/v2/j91vsmMePa-kINhlJ4f93rCoyNjC4wCB`,
			gasPrice: 4000000000,
			accounts: [`0x${MAINNET_PRIVATE_KEY}`],
		},
		sepolia: {
			// url: `https://eth-sepolia.g.alchemy.com/v2/${API_KEY}`,
			url: `https://rpc2.sepolia.org`,
			accounts: [`0x${PRIVATE_KEY}`],
		},
		bsc_mainnet: {
			url: "https://bsc-dataseed.binance.org/",
			chainId: 56,
			accounts: [`0x${MAINNET_PRIVATE_KEY}`],
		},
		bsc_testnet: {
			url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
			chainId: 97,
			gasPrice: 5000000000,
			accounts: [`0x${PRIVATE_KEY}`],
		},
		hardhat: {
			forking: {
				blockNumber: 42626975,
				url: `https://bsc-mainnet.nodereal.io/v1/${process.env["NODEREAL_API_KEY"]}`,
				enabled:
					process.env["ENABLE_FORKING"] != undefined &&
					process.env["ENABLE_FORKING"].toLowerCase() == "true"
						? true
						: false,
			},
			allowUnlimitedContractSize: true,
			accounts: {
				count: 50,
			},
		},
		localhost: {
			chainId: 31337,
		},
	},

	etherscan: {
		apiKey: {
			sepolia: ETHERSCAN_API_KEY!,
			bscTestnet: BSCSCAN_API_KEY!,
			blast_sepolia: BLAST_SEPOLIA_API_KEY!,
			shibuya: "shibuya",
		},
		customChains: [
			{
				network: "blast_sepolia",
				chainId: 168587773,
				urls: {
					apiURL: `https://api-sepolia.blastscan.io/api`,
					browserURL: "https://sepolia.blastscan.io",
				},
			},
			{
				network: "shibuya",
				chainId: 81,
				urls: {
					apiURL: "https://shibuya.blockscout.com/api",
					browserURL: "https://shibuya.blockscout.com",
				},
			},
		],
	},

	mocha: {
		timeout: 100000000,
	},

	gasReporter: {
		enabled:
			process.env["REPORT_GAS"] != undefined &&
			process.env["REPORT_GAS"].toLowerCase() == "true"
				? true
				: false,
		L1: "ethereum",
		coinmarketcap: process.env["COINMARKETCAP_API_KEY"],
		// proxyResolver: new DiamondAndOZProxyResolver(),
		gasPrice: 5,
	},
};

export default config;
