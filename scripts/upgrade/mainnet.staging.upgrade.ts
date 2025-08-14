import { network } from "hardhat";
import ConfirmDeployOrUpgrade from "../../util/confirmDeployOrUpgrade.util";
import DeployContract from "../../util/deployContract/DeployContract";

async function runMainnetUpgrade() {
	// confirm upgrade
	await ConfirmDeployOrUpgrade("Mainnet Staging OZ Upgrade");

	// setup
	const OZDeployer = new DeployContract(
		`deployment/${network.name}.staging.oz-proxy.deployment.json`
	);

	/**
	 * Upgrade contract
	 */
	await OZDeployer.upgrade("RewardVesting");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
runMainnetUpgrade().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
