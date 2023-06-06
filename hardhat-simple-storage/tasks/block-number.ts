import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

export default task(
  'block-number',
  'Prints the current block number'
).setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
  const blockNumber = await hre.ethers.provider.getBlockNumber();
  console.log(`Block number: ${blockNumber}`);
});
