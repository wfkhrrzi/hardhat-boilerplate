import { sepolia, bscTestnet, Chain, hardhat } from "viem/chains";

/**
 * add viem built-in chains into the array
 */
const testnetChains: number[] = (
	[
		sepolia,
		bscTestnet,
		hardhat,
		// add more chains below
	] as Chain[]
).map((chain) => chain.id);

export default [
	...testnetChains,
	// add unsupported chains into this array directly
] as const satisfies number[];
