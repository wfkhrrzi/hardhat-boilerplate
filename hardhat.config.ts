import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@openzeppelin/hardhat-upgrades";
import "@openzeppelin/upgrades-core";
import "hardhat-chai-matchers-viem";
import "hardhat-gas-reporter";
import * as dotenv from "dotenv";
import { DiamondAndOZProxyResolver } from "./util/DiamondAndOZProxyResolver";

export const ZERO_PK =
	"0x0000000000000000000000000000000000000000000000000000000000000000";

dotenv.config();

const {
	TEST_PRIVATE_KEY,
	BSCSCAN_API_KEY,
	ETHERSCAN_API_KEY,
	BLAST_SEPOLIA_API_KEY,
	MAINNET_PRIVATE_KEY,
	DISABLE_VERIFICATION,
	VERIFY_SOURCIFY,
	SOURCIFY_SERVER_URL,
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
			accounts: [MAINNET_PRIVATE_KEY || ZERO_PK],
		},
		sepolia: {
			// url: `https://eth-sepolia.g.alchemy.com/v2/${API_KEY}`,
			url: `https://rpc2.sepolia.org`,
			accounts: [TEST_PRIVATE_KEY || ZERO_PK],
		},
		bsc_mainnet: {
			url: "https://bsc-dataseed.binance.org/",
			chainId: 56,
			accounts: [MAINNET_PRIVATE_KEY || ZERO_PK],
		},
		bsc_testnet: {
			url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
			chainId: 97,
			gasPrice: 5000000000,
			accounts: [TEST_PRIVATE_KEY || ZERO_PK],
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
			url: "http://127.0.0.1:8545",
		},
		hoodi: {
			url: "https://ethereum-hoodi-rpc.publicnode.com",
			chainId: 560048,
			accounts: [TEST_PRIVATE_KEY || ZERO_PK],
		},
	},

	etherscan: {
		apiKey:
			DISABLE_VERIFICATION != undefined &&
			DISABLE_VERIFICATION.toLowerCase() == "true"
				? undefined
				: ETHERSCAN_API_KEY,
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
			{
				network: "hoodi",
				chainId: 560048,
				urls: {
					apiURL: "https://api-hoodi.etherscan.io/api",
					browserURL: "https://hoodi.etherscan.io",
				},
			},
		],
	},

	mocha: {
		timeout: 100000000,
	},

	sourcify: {
		enabled:
			VERIFY_SOURCIFY != undefined &&
			VERIFY_SOURCIFY.toLowerCase() == "true"
				? true
				: false,
		apiUrl: SOURCIFY_SERVER_URL || "invalid",
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
