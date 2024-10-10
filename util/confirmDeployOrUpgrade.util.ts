import { confirm } from "@inquirer/prompts";
import { network } from "hardhat";
import { CustomLogger } from "./logger";
import { HelperUtil } from "./helper.util";

export default async function ConfirmDeployOrUpgrade(scriptName?: string) {
	const logger = new CustomLogger();

	// validation
	if (HelperUtil.isDeployedToChain()) {
		const resp = await confirm({
			message: `Are you confirm to execute [${
				scriptName || "deployment/upgrade"
			}] in [${network.name}]`,
		});

		if (!resp) {
			logger.error(
				`Cancelled execution of ${
					scriptName || "deployment/upgrade"
				} in [${network.name}]`
			);

			process.exit(1);
		}
	}
}
