import * as fs from "node:fs";
import path from "path";
import { ILogObj } from "tslog";
import { CustomLogger } from "../../util/logger";

export class Config<ConfigFileFormat> {
	private configFilePath: string;
	private logger: CustomLogger<ILogObj>;

	constructor(configFilePath: string) {
		this.configFilePath = configFilePath;
		this.logger = new CustomLogger({
			name: "Config",
			minLevel: 4,
		});
		if (!fs.existsSync(path.dirname(this.configFilePath))) {
			this.logger.error("Directory of the given path does not exist");
			process.exit(1);
		}
	}

	// Function to read the config file
	readConfig(): ConfigFileFormat | undefined {
		try {
			const data = fs.readFileSync(`${this.configFilePath}`, "utf8");

			this.logger.info(
				`Config file [${path.basename(
					this.configFilePath
				)}] is successfully read`
			);

			return JSON.parse(data) as ConfigFileFormat;
		} catch (error) {
			if ((error as Error).message.toLowerCase().includes("enoent")) {
				this.logger.warn(
					`Config file [${path.basename(
						this.configFilePath
					)}] might not be found`
				);
				this.logger.info(
					`Creating an empty [${path.basename(
						this.configFilePath
					)}] config file...`
				);

				return undefined;
			} else {
				this.logger.fatal(error);
				process.exit(1);
			}
		}
	}

	// Function to write the config file
	writeConfig(content: ConfigFileFormat): void {
		try {
			fs.writeFileSync(
				`${this.configFilePath}`,
				JSON.stringify(content, null, 4),
				"utf8"
			);

			this.logger.info(
				`Config file [${path.basename(
					this.configFilePath
				)}] is successfully updated`
			);
		} catch (error) {
			this.logger.error(
				`Error writing config file [${path.basename(
					this.configFilePath
				)}]`
			);
			this.logger.fatal(error);
			process.exit(1);
		}
	}
}
