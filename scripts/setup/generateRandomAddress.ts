import { Hex } from "viem";
import { generatePrivateKey, privateKeyToAddress } from "viem/accounts";

async function main() {
	// get input
	const num_addresses = Number(process.env["num_addresses"]) || 5;

	// generate address
	const privateKeys: Hex[] = [...Array(num_addresses).keys()].map((_) =>
		generatePrivateKey()
	);

	// log addresses
	privateKeys.map((pk, i) => {
		console.log(
			`PK #${i + 1}\nPrivate: ${pk}\nPublic: ${privateKeyToAddress(pk)}\n`
		);
	});
}

main().catch((err) => console.error(err));
