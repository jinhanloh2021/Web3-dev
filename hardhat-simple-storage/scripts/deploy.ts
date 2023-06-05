import { ethers } from 'hardhat';
import { SimpleStorage } from '../typechain-types';

async function main() {
  // Hardhat provides wallet, private key, network url. Don't have to manually create.

  const SimpleStorageFactory = await ethers.getContractFactory('SimpleStorage');
  console.log('Deploying contract...');
  const simpleStorage: SimpleStorage = await SimpleStorageFactory.deploy();
  await simpleStorage.deployed();
  console.log(`Deployed contract to: ${simpleStorage.address}`);
}

async function verify(contractAddress: string, args: any) {}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
