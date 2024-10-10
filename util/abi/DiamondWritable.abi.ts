export default [
	{
		inputs: [],
		name: "DiamondWritable__InvalidInitializationParameters",
		type: "error",
	},
	{
		inputs: [],
		name: "DiamondWritable__RemoveTargetNotZeroAddress",
		type: "error",
	},
	{
		inputs: [],
		name: "DiamondWritable__ReplaceTargetIsIdentical",
		type: "error",
	},
	{
		inputs: [],
		name: "DiamondWritable__SelectorAlreadyAdded",
		type: "error",
	},
	{
		inputs: [],
		name: "DiamondWritable__SelectorIsImmutable",
		type: "error",
	},
	{
		inputs: [],
		name: "DiamondWritable__SelectorNotFound",
		type: "error",
	},
	{
		inputs: [],
		name: "DiamondWritable__SelectorNotSpecified",
		type: "error",
	},
	{
		inputs: [],
		name: "DiamondWritable__TargetHasNoCode",
		type: "error",
	},
	{
		inputs: [],
		name: "Ownable__NotOwner",
		type: "error",
	},
	{
		inputs: [],
		name: "Ownable__NotTransitiveOwner",
		type: "error",
	},
	{
		anonymous: false,
		inputs: [
			{
				components: [
					{
						internalType: "address",
						name: "target",
						type: "address",
					},
					{
						internalType:
							"enum IERC2535DiamondCutInternal.FacetCutAction",
						name: "action",
						type: "uint8",
					},
					{
						internalType: "bytes4[]",
						name: "selectors",
						type: "bytes4[]",
					},
				],
				indexed: false,
				internalType: "struct IERC2535DiamondCutInternal.FacetCut[]",
				name: "facetCuts",
				type: "tuple[]",
			},
			{
				indexed: false,
				internalType: "address",
				name: "target",
				type: "address",
			},
			{
				indexed: false,
				internalType: "bytes",
				name: "data",
				type: "bytes",
			},
		],
		name: "DiamondCut",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "previousOwner",
				type: "address",
			},
			{
				indexed: true,
				internalType: "address",
				name: "newOwner",
				type: "address",
			},
		],
		name: "OwnershipTransferred",
		type: "event",
	},
	{
		inputs: [
			{
				components: [
					{
						internalType: "address",
						name: "target",
						type: "address",
					},
					{
						internalType:
							"enum IERC2535DiamondCutInternal.FacetCutAction",
						name: "action",
						type: "uint8",
					},
					{
						internalType: "bytes4[]",
						name: "selectors",
						type: "bytes4[]",
					},
				],
				internalType: "struct IERC2535DiamondCutInternal.FacetCut[]",
				name: "facetCuts",
				type: "tuple[]",
			},
			{
				internalType: "address",
				name: "target",
				type: "address",
			},
			{
				internalType: "bytes",
				name: "data",
				type: "bytes",
			},
		],
		name: "diamondCut",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
] as const;
