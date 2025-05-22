export type CommonOptionsArg = {
	expectFailure?: boolean;
	errorMessage?: string
};

// set the Permit type parameters
export const PermitType = {
	Permit: [
		{
			name: "owner",
			type: "address",
		},
		{
			name: "spender",
			type: "address",
		},
		{
			name: "value",
			type: "uint256",
		},
		{
			name: "nonce",
			type: "uint256",
		},
		{
			name: "deadline",
			type: "uint256",
		},
	],
} as const;
