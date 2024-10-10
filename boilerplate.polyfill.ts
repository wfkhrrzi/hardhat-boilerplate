declare global {
	interface Number {
		toBigInt(): bigint;
	}

	interface String {
		toBigInt(): bigint;
	}

	interface BigInt {
		toNumber(): number;
	}
}

Number.prototype.toBigInt = function () {
	return BigInt(this.toString());
};

String.prototype.toBigInt = function () {
	return BigInt(this.toString());
};

BigInt.prototype.toNumber = function () {
	return Number(this.toString());
};

export {};
