import { Contract } from "ethers";
import { ethers, run } from "hardhat";
import { Address, Hex } from "viem";
import { HelperUtil } from "../../util/helper.util";

export class DeployContractUtil {
	static async deployNormalContract(
		contractName: string,
		params: any[] | undefined = []
	) {
		const contractFactory = await ethers.getContractFactory(contractName);

		const contract = await contractFactory.deploy(...params);

		try {
			await HelperUtil.waitTxConfirmation(
				contract.deploymentTransaction()?.hash as Hex
			);
		} catch (error) {
			await contract.waitForDeployment();
		}

		return contract as Contract;
	}
}
