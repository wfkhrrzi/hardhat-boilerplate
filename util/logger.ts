import chalk from "chalk";
import { ISettingsParam, BaseLogger, ILogObjMeta } from "tslog";

export const comment = (s: any) => chalk.hex("#6A9955")(s);

export class CustomLogger<LogObj> extends BaseLogger<LogObj> {
	constructor(settings?: ISettingsParam<LogObj>, logObj?: LogObj) {
		super(
			{
				prettyLogStyles: {
					logLevelName: {
						"*": ["bold", "black", "bgWhiteBright", "dim"],
						SILLY: ["bold", "white"],
						TRACE: ["bold", "whiteBright"],
						DEBUG: ["bold", "purpleBright"],
						SUCCESS: ["bold", "green"],
						INFO: ["bold", "blue"],
						WARN: ["bold", "yellow"],
						ERROR: ["bold", "red"],
						FATAL: ["bold", "redBright"],
					},
					dateIsoStr: "white",
					filePathWithLine: "yellow",
					name: ["white", "bold"],
					nameWithDelimiterPrefix: ["white", "bold"],
					nameWithDelimiterSuffix: ["white", "bold"],
					errorName: ["bold", "bgRedBright", "whiteBright"],
					fileName: ["yellow"],
				},
				prettyLogTimeZone: "local",
				...settings,
			},
			logObj,
			5
		);
	}

	/**
	 * Logs a _SUCCESS_ message.
	 * @param args  - Multiple log attributes that should be logged.
	 * @return LogObject with meta property, when log level is >= minLevel
	 */
	public success(...args: unknown[]): (LogObj & ILogObjMeta) | undefined {
		return super.log(4, "SUCCESS", ...args);
	}

	debug(...args: unknown[]) {
		return super.log(2, "DEBUG", ...args);
	}

	info(...args: unknown[]) {
		return super.log(3, "INFO", ...args);
	}

	warn(...args: unknown[]) {
		return super.log(5, "WARN", ...args);
	}

	error(...args: unknown[]) {
		return super.log(6, "ERROR", ...args);
	}

	fatal(...args: unknown[]) {
		return super.log(7, "FATAL", ...args);
	}
}
