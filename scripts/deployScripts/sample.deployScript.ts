import { viem } from "hardhat";
import ConfirmDeployOrUpgrade from "../../util/confirmDeployOrUpgrade.util";
import DeployContract from "../deployContract/DeployContract";
import { time } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

/**
 * Util function to deploy contracts
 */
export async function deployContracts() {
	// confirm deployment
	await ConfirmDeployOrUpgrade("Testnet Game Deployment");

	// setup
	const OZDeployer = new DeployContract();

	// deploy contract
	const Lock = await viem.getContractAt(
		"Lock",
		(await (
			await OZDeployer.deploy("Lock", [
				(await time.latest()) + time.duration.days(10),
			])
		).getAddress()) as `0x${string}`
	);

	return { Lock };
}
