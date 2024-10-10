import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Address, Hex, parseAbi, slice } from "viem";

export class DiamondAndOZProxyResolver implements CustomGasReporterResolver {
	ignore(): string[] {
		return [];
	}

	async resolve(
		this: Resolver,
		transaction: JsonRpcTx
	): Promise<string | null> {
		let contractAddress: Address;

		// === Diamond Proxy
		try {
			contractAddress = await (
				await this.hre.viem.getPublicClient()
			).readContract({
				abi: parseAbi([
					"function getImplementationAddress(bytes4 sigHash) external view returns (address implementation)",
				]),
				address: transaction.to! as Address,
				functionName: "getImplementationAddress",
				args: [slice(transaction.input! as Hex, 0, 4)],
			});
			const contractName = await this.resolveViaCache(contractAddress);
			if (contractName) return contractName;
		} catch (err) {}

		// === OZ proxy
		try {
			contractAddress =
				(await this.hre.upgrades.erc1967.getImplementationAddress(
					transaction.to!
				)) as Address;
			const contractName = await this.resolveViaCache(contractAddress);
			if (contractName) return contractName;
		} catch (err) {}

		try {
			const beaconAddress =
				await this.hre.upgrades.erc1967.getBeaconAddress(
					transaction.to!
				);
			contractAddress =
				(await this.hre.upgrades.beacon.getImplementationAddress(
					beaconAddress
				)) as Address;
			const contractName = await this.resolveViaCache(contractAddress);
			if (contractName) return contractName;
		} catch (err) {}

		this.unresolvedCalls++;
		return null;
	}
}

interface CustomGasReporterResolver {
	/**
	 * @property Sync method that returns function signatures to ignore when making `eth_call` queries
	 * to resolve contract identities. This is necessary to prevent the reporter getting stuck in an
	 * infinite loop when the `reportPureAndViewMethods` option is set
	 */
	ignore: () => string[];

	/**
	 * @property Async method that receives a JSON RPC transaction and uses its info to resolve
	 * a destination contract identity. This method gets bound to the plugin's Resolver class which
	 * includes helpers to match addresses to contracts as well as a reference to the HRE
	 */
	resolve: (this: Resolver, transaction: JsonRpcTx) => Promise<string | null>;
}

// Partial: borrowed from ethereumjs/tx to avoid adding package
interface JsonRpcTx {
	input: string;
	data?: string;
	to: string | null;
	from: string;
	gas: string;
	gasPrice: string;
	maxFeePerGas?: string;
	maxPriorityFeePerGas?: string;
	type: string;
	accessList?: any["accessList"];
	chainId?: string;
	hash: string;
	nonce: string;
	value: string;
	v?: string;
	r?: string;
	s?: string;
	// maxFeePerBlobGas?: string // QUANTITY - max data fee for blob transactions
	// blobVersionedHashes?: string[] // DATA - array of 32 byte versioned hashes for blob transactions
}

interface Resolver {
	unresolvedCalls: number;
	data: any;
	hre: HardhatRuntimeEnvironment;
	resolveByProxy: Function;

	/**
	 * Searches all known contracts for the method signature and returns the first
	 * found (if any). Undefined if none
	 * @param  {Object} tx          result of web3.eth_getTransaction
	 * @return {String}             contract name
	 */
	resolveByMethodSignature(tx: JsonRpcTx): string | null;

	/**
	 * Tries to match bytecode deployed at address to deployedBytecode listed
	 * in artifacts. If found, adds this to the code-hash name mapping and
	 * returns name.
	 * @param  {String} address contract address
	 * @return {String}         contract name
	 */
	resolveByDeployedBytecode(address: string | null): Promise<string | null>;

	/**
	 * Helper for CustomResolvers which checks the existing contract address cache before
	 * trying to resolve by deployed bytecode
	 * @param contractAddress
	 * @returns
	 */
	resolveViaCache(
		contractAddress: string
	): Promise<string | null | undefined>;
}
