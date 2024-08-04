import { viem } from "hardhat";
import DeployContract from "./DeployContract";
import { Abi } from "viem";
import { Config } from "../config/config";
import { HelperUtil } from "../../util/helper.util";

const { PUBLIC_KEY, BACKEND_WALLET } = process.env;

/**
 * Util function to deploy test contracts to testnet configured in {@link Config} & `DEPLOY_NETWORK` in {@link .env}
 * @param deployToChain Pass `true` to deploy test contracts to testnet
 *
 * @example
 * // to deploy contract
 * const Lock = await viem.getContractAt(
 * 	"Lock",
 * 	(await (
 * 		await func_deploy("Lock")
 * 	).getAddress()) as `0x${string}`
 *	);
 */
export async function deployContracts() {
	// === setup
	const config = new Config();
	const ContractDeployment = new DeployContract(config);

	// === init

	const deployToChain = HelperUtil.isDeployedToChain();

	// === deploy

	let func_deploy:
		| typeof DeployContract.deployLocal
		| typeof ContractDeployment.deployToChain;
	if (deployToChain) {
		func_deploy = ContractDeployment.deployToChain.bind(ContractDeployment);
	} else {
		func_deploy = DeployContract.deployLocal.bind(DeployContract);
	}

	// deploy REdacted contracts
	const Lock = await viem.getContractAt(
		"Lock",
		(await (await func_deploy("Lock")).getAddress()) as `0x${string}`
	);

	return { Lock };
}
