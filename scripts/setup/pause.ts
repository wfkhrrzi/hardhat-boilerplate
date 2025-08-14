import { viem } from "hardhat";

async function setMode() {
	////// mode configuration

	const RewardVesting = await viem.getContractAt(
		"RewardVesting",
		"0x121de11fC2D1Ace9DBD5aE92A299701146b76720"
	);

	await RewardVesting.write.pause()
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
setMode().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
