import ConfirmDeployOrUpgrade from "../../util/confirmDeployOrUpgrade.util";
import DeployContract from "../../util/deployContract/DeployContract";

async function runTestnetUpgrade() {
	// confirm upgrade
	await ConfirmDeployOrUpgrade("Mainnet OZ Upgrade");

	// setup
	const OZDeployer = new DeployContract();

	/**
	 * Upgrade contract
	 */
	await OZDeployer.upgrade("AiETH");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
runTestnetUpgrade().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
