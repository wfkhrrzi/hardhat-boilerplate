import { network, viem } from "hardhat";
import { Hex } from "viem";
import { expect } from "chai";
import list_testnet_chains from "./list-testnet-chains";

export class HelperUtil {
	static isDeployedToChain(): boolean {
		return !["hardhat"].includes(network.name);
	}

	/**
	 * @dev check if current network is a testnet
	 * @todo add the currently used chain's `id` in {@link } if not exist
	 */
	static isDeployedToTestnet(): boolean {
		if (network.config.chainId == undefined) {
			throw new Error("Cannot read chain id");
		}

		return (list_testnet_chains as number[]).includes(
			network.config.chainId
		);
	}

	static async waitTxConfirmation(txHash: Hex) {
		return (await viem.getPublicClient()).waitForTransactionReceipt({
			hash: txHash,
			confirmations: ["hardhat"].includes(network.name) ? undefined : 6,
		});
	}

	// === utils

	/**
	 * check if tx is fulfilled or rejected
	 * @param txHash hash to check
	 * @param expectFailure fail or success
	 * @returns true if expectFailure = success, false if expectFailure = false
	 */
	static async expectFulfilledOrRejected(
		txHash: Promise<Hex>,
		expectFailure = false
	): Promise<boolean> {
		if (expectFailure) {
			await expect(txHash).rejected;
			return false;
		}

		// expect tx fulfilled
		await expect(txHash).fulfilled;

		// wait tx confirmation (for on-chain purposes)
		await this.waitTxConfirmation(await txHash);

		return true;
	}
}
