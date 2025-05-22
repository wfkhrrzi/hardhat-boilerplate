async function runTestnetDeployment() {
	/// testnet deployment script
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
runTestnetDeployment().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
