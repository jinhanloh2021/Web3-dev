import { ethers, run, network } from 'hardhat';
import { SimpleStorage } from '../typechain-types';

async function main() {
  // Hardhat provides wallet, private key, network url. Don't have to manually create.

  const SimpleStorageFactory = await ethers.getContractFactory('SimpleStorage');
  console.log('Deploying contract...');
  const simpleStorage: SimpleStorage = await SimpleStorageFactory.deploy();
  await simpleStorage.deployed();
  console.log(
    `Deployed contract at address ${simpleStorage.address} on ${
      network.config.chainId === 11155111 ? 'Sepolia' : 'Hardhat'
    } network`
  );

  // console.log(network.config); // Hardhat chainId 31337, no point verifying on etherscan
  if (network.config.chainId === 11155111 && process.env.ETHERSCAN_API_KEY) {
    console.log('Waiting for 6 block confirmations before verification...');
    await simpleStorage.deployTransaction.wait(6);
    await verify(simpleStorage.address, []);
  }
}

async function verify(contractAddress: string, args: any[]) {
  console.log('Verifying contract...');
  try {
    await run('verify:verify', {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (e: any) {
    if (e.message.toLowerCase().includes('already verified')) {
      console.log('Already verified');
    } else {
      console.log(e);
    }
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
