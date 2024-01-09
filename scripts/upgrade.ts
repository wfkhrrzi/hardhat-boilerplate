import { viem } from "hardhat";
import TreasureChestUtility from "../lib/TreasureChestUtility";
import { deployTestContracts } from "../test/deploy.test";
import DeployContract from "./contract/DeployContract";
import { Config } from "./config/Config";
import { getContract } from "viem";

async function main() {
	const DeployContractObject = new DeployContract();

	/**
	 * Upgrade REdacted Staking
	 */
	// await DeployContractObject.deployTestnet("REdactedStaking", undefined, 3)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
