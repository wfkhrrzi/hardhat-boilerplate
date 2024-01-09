import { viem } from "hardhat";
import DeployContract from "../scripts/contract/DeployContract";
import { Abi } from "viem";
import { Config } from "../scripts/config/Config";

const { PUBLIC_KEY, BACKEND_WALLET } = process.env;

/**
 * Util function to deploy test contracts to testnet configured in {@link Config} & `DEPLOY_NETWORK` in {@link .env}
 * @param deployTestnet Pass `true` to deploy test contracts to testnet
 * 
 * @example
 * // to deploy contract
 * const REdactedNFTContract = await viem.getContractAt(
 * 	"NFT",
 * 	(await (
 * 		await func_deploy("NFT")
 * 	).getAddress()) as `0x${string}`
 *	);
	ABIs.push(REdactedNFTContract.abi)
 */
export async function deployTestContracts(deployTestnet=false) {
	const ABIs: Abi[] = []
	
	const config = new Config()
	const ContractDeployment = new DeployContract(config)

	let func_deploy: typeof DeployContract.deployLocal | typeof ContractDeployment.deployTestnet;
	if (deployTestnet) {
		func_deploy = ContractDeployment.deployTestnet.bind(ContractDeployment)
	} else {
		func_deploy = DeployContract.deployLocal.bind(DeployContract)
	}

	// deploy REdacted contracts
	const REdactedNFTContract = await viem.getContractAt(
		"NFT",
		(await (
			// await DeployContract.deployNormalContract("NFT")
			await func_deploy("NFT")
		).getAddress()) as `0x${string}`
	);
	ABIs.push(REdactedNFTContract.abi)
	
    const USDTContract = await viem.getContractAt(
		"USDT",
		(await (
			// await DeployContract.deployNormalContract("USDT")
			await func_deploy("USDT")
		).getAddress()) as `0x${string}`
	); 
	ABIs.push(USDTContract.abi)
	
	const REdactedTokenContract = await viem.getContractAt(
		"REdactedToken",
		(await (
			// await DeployContract.deployNormalContract("REdactedToken")
			await func_deploy("REdactedToken")
		).getAddress()) as `0x${string}`
	); 
	ABIs.push(REdactedTokenContract.abi)
	
    const REdactedStakingContract = await viem.getContractAt(
		"REdactedStaking",
		(await (
			// await DeployContract.deployProxyContract("REdactedStaking", [
			await func_deploy("REdactedStaking", [
				REdactedNFTContract.address,USDTContract.address, REdactedTokenContract.address
			])
		).getAddress()) as `0x${string}`
	);
	ABIs.push(REdactedStakingContract.abi)

	// deploy Elemental Mines contracts
	const treasureKeyContract = await viem.getContractAt(
		"TreasureKey",
		(await (
			// await DeployContract.deployProxyContract("TreasureKey", [
			await func_deploy("TreasureKey", [
				PUBLIC_KEY, REdactedStakingContract.address, REdactedNFTContract.address, BACKEND_WALLET,
			])
		).getAddress()) as `0x${string}`
	);
	ABIs.push(treasureKeyContract.abi)

	const rngContract = await viem.getContractAt(
		"LocalRandomNumber",
		(await (
			// await DeployContract.deployNormalContract("LocalRandomNumber")
			await func_deploy("LocalRandomNumber")
		).getAddress()) as `0x${string}`
	);
	ABIs.push(rngContract.abi)

	const treasureChestContract = await viem.getContractAt(
		"TreasureChest",
		(await (
			// await DeployContract.deployProxyContract("TreasureChest", [
			await func_deploy("TreasureChest", [
				PUBLIC_KEY, treasureKeyContract.address, USDTContract.address, rngContract.address, 700, 4000, 10000
			])
		).getAddress()) as `0x${string}`
	);
	ABIs.push(treasureChestContract.abi)

	return { treasureKeyContract, REdactedNFTContract, REdactedStakingContract, treasureChestContract, USDTContract, ABIs : ABIs.reduce((prev, cur)=>[...prev, ...cur])};
}
