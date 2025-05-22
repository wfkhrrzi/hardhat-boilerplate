async function runMainnetDeployment() {
	/// mainnet deployment script
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
runMainnetDeployment().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
