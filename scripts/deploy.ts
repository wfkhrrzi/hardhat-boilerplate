import { deployTestContracts } from "../test/deploy.test";

async function main() {
	await deployTestContracts(true);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
