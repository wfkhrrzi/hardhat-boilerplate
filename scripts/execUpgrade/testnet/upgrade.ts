import ConfirmDeployOrUpgrade from "../../../util/confirmDeployOrUpgrade.util";
import DeployContract from "../../deployContract/DeployContract";

async function main() {
	// confirm upgrade
	await ConfirmDeployOrUpgrade("Mainnet OZ Upgrade");

	// setup
	const OZDeployer = new DeployContract();

	/**
	 * Upgrade contract
	 */
	await OZDeployer.upgrade("Lock");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
