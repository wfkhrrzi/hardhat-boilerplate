import { GetContractReturnType } from "@nomicfoundation/hardhat-viem/types";
import { Contract, ContractFactory } from "ethers";
import { DataHexString } from "ethers/lib.commonjs/utils/data";
import { ethers, network, run, viem } from "hardhat";
import { ArtifactsMap } from "hardhat/types";
import path from "path";
import { ILogObj } from "tslog";
import {
	Address,
	getContract,
	Hex,
	toFunctionSelector,
	zeroAddress,
} from "viem";
import { HelperUtil } from "../../util/helper.util";
import { CustomLogger } from "../../util/logger";
import { Config } from "../config/config";
import { DeployContractUtil } from "./DeployContractUtil";
import { formatInTimeZone } from "date-fns-tz";
import DiamondWritableAbi from "../../util/abi/DiamondWritable.abi";

export enum FacetCutAction {
	ADD,
	REPLACE,
	REMOVE,
}

type ContractName<StringT extends string> = StringT extends keyof ArtifactsMap
	? StringT
	: never;

export type DiamondProxyConfigFileFormat = {
	[key: string]: {
		address: Address;
		txHash: Hex;
		cuts: {
			facetName: string;
			facetAddress: Address;
			selectors: Hex[];
			action: keyof typeof FacetCutAction;
			timestamp: string;
			isDiamondCutSuccess: "false" | "true" | "pending";
		}[];
	};
};
export class DeployDiamond<
	ConfigFileFormat extends DiamondProxyConfigFileFormat
> {
	private config: Config<ConfigFileFormat>;
	private logger: CustomLogger<ILogObj>;

	constructor() {
		this.config = new Config(
			path.resolve(
				`deployment/${network.name}.diamond-proxy.deployment.json`
			)
		);
		this.logger = new CustomLogger({
			minLevel: network.name == "hardhat" ? 6 : 0,
		});
	}

	async deployAndUpgradeDiamond<
		CN extends string,
		FCN extends string
	>(options: {
		diamond: {
			contractName: ContractName<CN>;
			params: any[];
		};
		lstFacet: (
			| ContractName<FCN>
			| { facetName: ContractName<FCN>; facetAddress: Address }
		)[];
	}) {
		try {
			let config =
				network.name != "hardhat"
					? this.config.readConfig()
					: undefined;
			if (config == undefined) {
				config = {} as ConfigFileFormat;
			}

			// return existing contract
			if (config && config[options.diamond.contractName]) {
				this.logger.warn(
					`Diamond proxy is already deployed to the ${network.name}. To redeploy, remove the config file`
				);

				return getContract({
					abi: DiamondWritableAbi,
					address: config[options.diamond.contractName].address,
					client: {
						public: await viem.getPublicClient(),
						wallet: (await viem.getWalletClients())[0],
					},
				});
			}

			// deploy diamond
			const txResponse = await DeployContractUtil.deployNormalContract(
				options.diamond.contractName
			);
			const diamondContract = getContract({
				abi: DiamondWritableAbi,
				address: (await txResponse.getAddress()) as Address,
				client: {
					public: await viem.getPublicClient(),
					wallet: (await viem.getWalletClients())[0],
				},
			});

			// save diamond proxy contract address
			if (network.name != "hardhat") {
				config[options.diamond.contractName] = {
					...config[options.diamond.contractName],
					address: diamondContract.address,
					txHash: txResponse.deploymentTransaction()?.hash,
					cuts: [],
				};
				this.config.writeConfig(config);
			}

			this.logger.success(
				`Diamond proxy contract [${options.diamond.contractName}] is successfully deployed at [${diamondContract.address}]`
			);

			// deploy facets and record cuts
			await this.deployFacets_upgradeDiamond_verifyContract(
				options.diamond.contractName,
				diamondContract,
				options.lstFacet.map((facet) => {
					if (typeof facet == "object") {
						return {
							facetName: facet.facetName,
							facetAddress: facet.facetAddress,
						};
					} else {
						return {
							facetName: facet,
						};
					}
				}),
				{
					target: diamondContract.address,
					functionData: txResponse.interface.encodeFunctionData(
						"initialize",
						options.diamond.params
					),
				}
			);

			// return diamond proxy contract
			return diamondContract;
		} catch (error) {
			this.logger.fatal(error);
			process.exit(1);
		}
	}

	async upgradeDiamond<CN extends string, FCN extends string>(
		diamondContractName: ContractName<CN>,
		lstCut: {
			facetName: ContractName<FCN>;
			facetAddress?: Address;
			selectors: Hex[];
			action: FacetCutAction;
		}[],
		diamondContractAddress?: Address
	) {
		let config =
			network.name != "hardhat" ? this.config.readConfig() : undefined;

		// throw if diamond is not existed
		if (network.name == "hardhat" && diamondContractAddress == undefined) {
			this.logErrorAndExit(
				`Must define diamond proxy address [${diamondContractName}]`
			);
		}

		if (
			(!config || !config[diamondContractName]) &&
			network.name != "hardhat"
		) {
			this.logErrorAndExit(
				`Diamond proxy [${diamondContractName}] is not existed`
			);
		}

		// ensure cut selectors are not empty
		if (lstCut.filter((cut) => cut.selectors.length == 0).length > 0) {
			this.logErrorAndExit(
				"Must have at least a selector to upgrade within facets"
			);
		}

		const diamondContract = getContract({
			abi: DiamondWritableAbi,
			address:
				network.name != "hardhat"
					? config![diamondContractName].address
					: diamondContractAddress!,
			client: {
				public: await viem.getPublicClient(),
				wallet: (await viem.getWalletClients())[0],
			},
		});

		// deploy facet, upgrade diamond and verify contracts
		await this.deployFacets_upgradeDiamond_verifyContract(
			diamondContractName,
			diamondContract,
			lstCut
		);
	}

	private async deployFacets_upgradeDiamond_verifyContract<
		CN extends string,
		FCN extends string
	>(
		diamondContractName: ContractName<CN>,
		diamondContract: GetContractReturnType<typeof DiamondWritableAbi>,
		lstCut: {
			facetName: ContractName<FCN>;
			facetAddress?: Address;
			selectors?: Hex[];
			action?: FacetCutAction;
		}[],
		initializer?: {
			target: Address;
			functionData: DataHexString;
		}
	) {
		let config =
			network.name != "hardhat" ? this.config.readConfig()! : undefined;

		// ensure lstCut is not empty
		if (lstCut.length == 0) {
			this.logErrorAndExit(
				"Must have at least a facet to deploy/upgrade diamond"
			);
		}

		// more validations
		await Promise.all(
			lstCut.map(async (cut) => {
				// ensure selector are filled for foreign facets
				if (cut.selectors && cut.selectors.length == 0) {
					try {
						await ethers.getContractFactory(cut.facetName);
					} catch (error) {
						this.logErrorAndExit(
							`Foreign facet [${cut.facetName}] needs to have predefined selectors`
						);
					}
				}

				// ensure replaced selector is not from same old facet
				if (
					cut.action &&
					cut.action == FacetCutAction.REPLACE &&
					config &&
					config[diamondContractName].cuts.filter(
						(configCut) =>
							cut.facetAddress &&
							cut.facetAddress.toLowerCase() ==
								configCut.facetAddress.toLowerCase()
					).length > 0
				) {
					this.logErrorAndExit(
						`Cannot replace selector from the same facet contract [${cut.facetAddress}]`
					);
				}

				// ensure non zero target address for replace and add cuts
				if (
					cut.action &&
					cut.action < 2 &&
					cut.facetAddress == zeroAddress
				) {
					this.logErrorAndExit(
						`Facet contract [${cut.facetName}] cannot be [${zeroAddress}]`
					);
				}

				// ensure zero target address for replace and add cuts
				if (
					cut.action == FacetCutAction.REMOVE &&
					cut.facetAddress &&
					cut.facetAddress != zeroAddress
				) {
					this.logErrorAndExit(
						`Given facet address [${cut.facetName}] for to-be-removed selectors must be [${zeroAddress}]`
					);
				}
			})
		);

		const cutsParam: {
			target: Address;
			selectors: Hex[];
			action: FacetCutAction;
		}[] = [];

		// deploy facets and record cuts
		for (let i = 0; i < lstCut.length; i++) {
			const cut = lstCut[i];

			try {
				// deploy or fetch existing facet
				let facet: Contract;

				try {
					// get contract
					facet = cut.facetAddress
						? await ethers.getContractAt(
								cut.facetName,
								cut.facetAddress
						  )
						: await DeployContractUtil.deployNormalContract(
								cut.facetName
						  );
				} catch (error) {
					// get contract for foreign facet
					facet = cut.facetAddress
						? await ethers.getContractAt([], cut.facetAddress)
						: await DeployContractUtil.deployNormalContract(
								cut.facetName
						  );
				}

				// record cuts
				cutsParam.push({
					target:
						cut.facetAddress ||
						((await facet.getAddress()) as Address),
					selectors:
						cut.selectors ||
						facet.interface.fragments
							.filter((fragment) => fragment.type == "function")
							.map((fragment) =>
								toFunctionSelector(fragment.format("minimal"))
							),
					action: cut.action || FacetCutAction.ADD,
				});

				if (cut.facetAddress) {
					this.logger.info(
						`Using existing facet contract [${
							cut.facetName
						}] deployed at [${await facet.getAddress()}]`
					);
				} else {
					this.logger.success(
						`Facet contract [${
							cut.facetName
						}] is successfully deployed at [${await facet.getAddress()}]`
					);
				}
			} catch (err) {
				this.logger.error(
					`Facet contract [${cut.facetName}] failed to deploy. Skipping to next cut...`
				);
			}
		}

		// save diamond cuts

		if (network.name != "hardhat" && config) {
			config[diamondContractName] = {
				...config[diamondContractName],
				cuts: [
					...config[diamondContractName].cuts,
					...cutsParam.map(
						(cut, i) =>
							({
								action: FacetCutAction[
									cut.action
								] as keyof typeof FacetCutAction,
								selectors: cut.selectors,
								facetAddress: cut.target,
								facetName: lstCut[i].facetName,
								isDiamondCutSuccess: "pending",
								timestamp: formatInTimeZone(
									new Date(),
									"Asia/Kuala_Lumpur",
									"EEEE, MMMM do yyyy, hh:mm:ss a"
								),
							} satisfies DiamondProxyConfigFileFormat[string]["cuts"][number])
					),
				],
			};
			this.config.writeConfig(config);
		}

		// upgrade diamond
		try {
			await HelperUtil.waitTxConfirmation(
				await diamondContract.write.diamondCut([
					cutsParam,
					initializer ? initializer.target : zeroAddress,
					initializer
						? (initializer.functionData as Hex)
						: ("" as Hex),
				])
			);

			this.logger.success(
				`Successfully added diamond cuts to proxy contract [${diamondContractName}]`
			);

			// update diamond cut status to true
			if (network.name != "hardhat" && config) {
				config[diamondContractName].cuts = config[
					diamondContractName
				].cuts.map((cut) =>
					cut.isDiamondCutSuccess != "pending"
						? cut
						: { ...cut, isDiamondCutSuccess: "true" }
				);
				this.config.writeConfig(config);
			}
		} catch (error) {
			this.logger.error(
				`Failed to add diamond cuts to proxy contract [${diamondContractName}]`
			);
			this.logger.fatal(error);

			// update diamond cut status to false
			if (network.name != "hardhat" && config) {
				config[diamondContractName].cuts = config[
					diamondContractName
				].cuts.map((cut) =>
					cut.isDiamondCutSuccess != "pending"
						? cut
						: { ...cut, isDiamondCutSuccess: "false" }
				);
				this.config.writeConfig(config);
			}
		}

		// verify contracts on chain
		if (HelperUtil.isDeployedToChain()) {
			this.verifyOnChainContracts(
				initializer // if initializer is defined, new diamond is deployed
					? [
							diamondContract.address,
							...cutsParam.map((cut) => cut.target),
					  ]
					: cutsParam.map((cut) => cut.target)
			);
		}
	}

	private async verifyOnChainContracts(contractAddresses: Address[]) {
		for (let i = 0; i < contractAddresses.length; i++) {
			const address = contractAddresses[i];

			try {
				await run("verify:verify", {
					address,
				});

				this.logger.success(
					`Contract [${address}] is successfully verified`
				);
			} catch (error) {
				this.logger.fatal((error as Error).message.split("\n")[0]);
			}
		}
	}

	private logErrorAndExit(message: string) {
		if (network.name == "hardhat") {
			throw new Error(message);
		} else {
			this.logger.error(message);

			process.exit(1);
		}
	}
}
