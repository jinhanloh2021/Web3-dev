import { ethers, network } from 'hardhat';
import {
  BOX_FUNC,
  MIN_DELAY,
  NEW_STORE_VALUE,
  PROPOSAL_DESCRIPTION,
  developmentChains,
} from '../helper-hardhat-config';
import { moveTime } from '../utils/move-time';
import { moveBlocks } from '../utils/move-blocks';
import { Box, GovernorContract } from '../typechain-types';
import { BigNumber } from 'ethers';

export async function queueAndExecute() {
  const args: [BigNumber] = [BigNumber.from(NEW_STORE_VALUE)];
  const functionToCall = BOX_FUNC;
  const box: Box = await ethers.getContract('Box');
  const encodedFunctionCall = box.interface.encodeFunctionData(
    functionToCall,
    args
  );
  const descriptionHash = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(PROPOSAL_DESCRIPTION)
  );
  const governor: GovernorContract = await ethers.getContract(
    'GovernorContract'
  );
  console.log('Queueing...');
  const queueTx = await governor.queue(
    [box.address],
    [0],
    [encodedFunctionCall],
    descriptionHash
  );
  await queueTx.wait(1);

  if (developmentChains.includes(network.name)) {
    await moveTime(MIN_DELAY + 1);
    await moveBlocks(1);
  }

  console.log('Executing...');
  const executeTx = await governor.execute(
    [box.address],
    [0],
    [encodedFunctionCall],
    descriptionHash
  );
  await executeTx.wait(1);
  const boxNewValue = await box.retrieve();
  console.log(`New box value: ${boxNewValue.toString()}`);
}

queueAndExecute()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
