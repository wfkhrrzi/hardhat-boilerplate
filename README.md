# Installation & Setup

1.  Clone the repo.

    ```sh
    $ git clone https://github.com/wfkhrrzi/contract-template-v1.git
    ```

2.  Install required dependencies.

    ```sh
    $ npm install
    ```

3.  Create `.env` from the `.env.example` template.

    ```sh
     $ cp .env.example .env
    ```

4.  Populate the `.env` file with the preferred configuration.

    ```sh
    PUBLIC_KEY=<INSERT YOUR WALET PUBLIC KEY>
    PRIVATE_KEY=<INSERT YOUR WALET PRIVATE KEY>
    ```

5.  Test the contracts.

    ```sh
    $ npx hardhat test
    ```

# Deployment

1.  Finalize the deployment [script](scripts/deployContract/deployScript.ts) & [configuration](.env).

    ```sh
    # .env

    DEPLOY_NETWORK=bsc_testnet # modify the chain used for deployment here
    ```

    ```ts
    export async function deployContracts(deployToChain = false) {
    	const ABIs: Abi[] = [];
    	const config = new Config();
    	const ContractDeployment = new DeployContract(config);

    	let func_deploy:
    		| typeof DeployContract.deployLocal
    		| typeof ContractDeployment.deployToChain;
    	if (deployToChain) {
    		func_deploy =
    			ContractDeployment.deployToChain.bind(ContractDeployment);
    	} else {
    		func_deploy = DeployContract.deployLocal.bind(DeployContract);
    	}

    	// modify contract deployment script here. Refer to sample deployment script in the file
    }
    ```

2.  Deploy the contract

    ```sh
    $ npm run deploy
    ```
