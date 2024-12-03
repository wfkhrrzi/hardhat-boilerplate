import { getImplementationAddress } from "@openzeppelin/upgrades-core";
import { Contract } from "ethers";
import { ethers, network, run, upgrades } from "hardhat";
import {
	ArtifactsMap,
	EthereumProvider,
	HttpNetworkConfig,
} from "hardhat/types";
import Path from "path";
import { ILogObj, Logger } from "tslog";
import { Address, Hex, zeroAddress } from "viem";
import { HelperUtil } from "../../util/helper.util";
import { Config } from "../config/config";
import { DeployContractUtil } from "./DeployContractUtil";
import { CustomLogger } from "../../util/logger";

type ContractName<StringT extends string> = StringT extends keyof ArtifactsMap
	? StringT
	: never;

export interface OZProxyConfigFileFormat {
	contracts: { [key: string]: Address };
	[key: `v${number}`]: {
		[key: string]: Address;
	};
}

export default class DeployContract {
	private config: Config<OZProxyConfigFileFormat>;
	private logger: CustomLogger<ILogObj>;

	constructor(configPath?: string) {
		this.config = new Config(
			Path.resolve(
				configPath ||
					`deployment/${network.name}.oz-proxy.deployment.json`
			)
		);

		this.logger = new CustomLogger({
			minLevel: network.name == "hardhat" ? 6 : 0,
			name: "DeployContract",
		});
	}

	private async deployNormalContract(
		contractName: string,
		params: any[] | undefined = []
	) {
		try {
			const contract = await DeployContractUtil.deployNormalContract(
				contractName,
				params
			);

			return contract;
		} catch (error) {
			this.logger.fatal(error);
			process.exit(1);
		}
	}

	private async deployProxyContract(
		contractName: string,
		params: any[] | undefined = undefined,
		initializer_name = "initialize"
	) {
		try {
			const contractFactory = await ethers.getContractFactory(
				contractName
			);

			// deploy
			const contract = await upgrades.deployProxy(
				contractFactory,
				params,
				{
					initializer: initializer_name,
				}
			);

			// wait for deployment
			try {
				await HelperUtil.waitTxConfirmation(
					contract.deploymentTransaction()?.hash as Hex
				);
			} catch (error) {
				await contract.waitForDeployment();
			}

			return contract;
		} catch (error) {
			this.logger.fatal(error);
			process.exit(1);
		}
	}

	async upgrade<CN extends string>(
		contractName: ContractName<CN>,
		params: any[] | undefined = undefined,
		initializer_name = "initialize"
	) {
		try {
			// throw if there's no proxy contract
			const config = this.config.readConfig();
			if (
				config == undefined ||
				config.contracts == undefined ||
				config.contracts[contractName] == undefined
			) {
				throw new Error(
					`Cannot upgrade non existent proxy contract [${contractName}]`
				);
			}

			// set up options
			let options:
				| {
						fn: string;
						args?: unknown[] | undefined;
				  }
				| undefined;

			if (
				initializer_name != undefined &&
				initializer_name != "initialize"
			) {
				options = {
					fn: initializer_name,
				};
			}

			if (params != undefined) {
				if (options) {
					options = { ...options, args: params };
				} else {
					this.logger.error("args != undefined BUT fn == undefined");
					process.exit(1);
				}
			}

			// upgrade contract
			const proxyContract = await upgrades.upgradeProxy(
				config["contracts"][contractName],
				await ethers.getContractFactory(contractName),
				options ? { call: options } : undefined
			);

			// wait for deployment
			try {
				await HelperUtil.waitTxConfirmation(
					proxyContract.deploymentTransaction()?.hash as Hex
				);
			} catch (error) {
				await proxyContract.waitForDeployment();
			}

			// save implementation contract
			const implContractAddress = await this.saveImplementationContract(
				contractName
			);

			// verify implementation contract
			if (HelperUtil.isDeployedToChain()) {
				const resp = this.verifyContract(implContractAddress);

				if (await resp) {
					this.logger.success(
						`Implementation contract [${implContractAddress}] is successfully verified`
					);
				} else {
					this.logger.error(
						`Implementation contract [${implContractAddress}] failed`
					);
				}
			}

			return proxyContract;
		} catch (error) {
			this.logger.fatal(error);
			process.exit(1);
		}
	}

	async deploy<CN extends string>(
		contractName: ContractName<CN>,
		params: any[] | undefined = undefined,
		initializer_name = "initialize"
	): Promise<Contract> {
		let config = this.config.readConfig();
		if (config == undefined) {
			config = {
				contracts: {},
			};
		}

		// init contract
		let contract: Contract;

		// verify that there is no record of the contract
		if (config.contracts[contractName] != undefined) {
			contract = await ethers.getContractAt(
				contractName,
				config.contracts[contractName]
			);

			this.logger.warn(
				`Proxy contract for [${contractName}] is already deployed at [${await contract.getAddress()}]`
			);

			return contract;
		}

		Object.keys(config)
			.filter((key) => key != "contracts")
			.map((key) => {
				if (config[key as `v${number}`][contractName] != undefined) {
					this.logger.error(
						`Proxy contract [${contractName}] has implementation contract recorded in [${key}]. Delete all versions to redeloy the contract`
					);
					process.exit(1);
				}
			});

		// deploy contract
		if (await this.isUpgradeable(contractName))
			contract = await this.deployProxyContract(
				contractName,
				params,
				initializer_name
			);
		else
			contract = (await this.deployNormalContract(
				contractName,
				params
			)) as Contract;

		let implContractAddress: Address = zeroAddress;

		if (network.name != "hardhat") {
			// save proxy or normal contract
			config.contracts[contractName] =
				(await contract.getAddress()) as Address;
			this.config.writeConfig(config);

			// save implementation contract address
			if (await this.isUpgradeable(contractName)) {
				implContractAddress = await this.saveImplementationContract(
					contractName
				);

				this.logger.success(
					`Implementation contract for [${contractName}] is successfully deployed at [${implContractAddress}]`
				);
			}
		}

		// verify contract
		if (HelperUtil.isDeployedToChain()) {
			if (implContractAddress != zeroAddress) {
				// verify the implementation contract
				const resp = this.verifyContract(implContractAddress);

				if (await resp) {
					this.logger.success(
						`Implementation contract [${implContractAddress}] is successfully verified`
					);
				} else {
					this.logger.error(
						`Implementation contract [${implContractAddress}] failed`
					);
				}
			}

			// verify the proxy contract
			const resp = this.verifyContract(
				config.contracts[contractName] as Address
			);

			if (await resp) {
				this.logger.success(
					`Implementation contract [${config.contracts[contractName]}] is successfully verified`
				);
			} else {
				this.logger.error(
					`Implementation contract [${config.contracts[contractName]}] failed`
				);
			}
		}

		this.logger.success(
			`${
				(await this.isUpgradeable(contractName))
					? "Proxy contract"
					: "Contract"
			} [${contractName}] is successfully deployed at [${
				config.contracts[contractName]
			}]`
		);

		return contract;
	}

	private async isUpgradeable(contractName: string) {
		const contractFactory = await ethers.getContractFactory(contractName);

		const resp = contractFactory.interface.hasEvent("Initialized");

		return resp;
	}

	private async verifyContract(contractAddress: Address): Promise<boolean> {
		try {
			await run("verify:verify", {
				address: contractAddress,
			});

			return true;
		} catch (error) {
			this.logger.fatal((error as Error).message.split("\n"));

			return false;
		}
	}

	private async saveImplementationContract<CN extends string>(
		contractName: ContractName<CN>
	): Promise<Address> {
		try {
			// fetch config
			const config = this.config.readConfig()!;

			// get implementation contract
			const implContractAddress = (await getImplementationAddress(
				ethers.getDefaultProvider(
					(network.config as HttpNetworkConfig).url
				) as unknown as EthereumProvider,
				config.contracts[contractName]
			)) as Address;

			// get new version for implementation contract
			const latestVersion = Object.keys(config)
				.filter(
					(version) =>
						version.startsWith("v") &&
						config[version as `v${number}`][contractName] !=
							undefined
				)
				.map((version) => Number(version.slice(1)))
				.sort()
				.at(-1);
			const newVersion =
				latestVersion == undefined ? 1 : latestVersion + 1;

			// save implementation contract
			// create a first entry for the latest version if not existed yet
			if (!config[`v${newVersion}`]) {
				config[`v${newVersion}`] = {};
			}
			config[`v${newVersion}`][contractName] = implContractAddress;

			this.config.writeConfig(config);

			return implContractAddress;
		} catch (err) {
			this.logger.fatal(err);
			process.exit(1);
		}
	}
}
