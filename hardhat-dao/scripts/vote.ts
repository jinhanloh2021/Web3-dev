import { ethers, network } from 'hardhat';
import {
  VOTING_PERIOD,
  developmentChains,
  proposalsFile,
} from '../helper-hardhat-config';
import * as fs from 'fs';
import { Governor } from '../typechain-types';
import { moveBlocks } from '../utils/move-blocks';

const index = 0;

async function main(proposalIndex: number) {
  const proposals = JSON.parse(fs.readFileSync(proposalsFile, 'utf-8'));
  const proposalId = proposals[network.config.chainId!][proposalIndex];
  // 0 = against 1 = for 2 = abstain
  const voteWay = 1;
  const reason = 'I feel like it';
  const governor: Governor = await ethers.getContract('GovernorContract');
  const voteTxResponse = await governor.castVoteWithReason(
    proposalId,
    voteWay,
    reason
  );
  const voteTxReceipt = await voteTxResponse.wait(1);
  if (developmentChains.includes(network.name)) {
    await moveBlocks(VOTING_PERIOD + 1);
  }
  const proposalState = await governor.state(proposalId);
  console.log(`Current Proposal State: ${proposalState}`);
  console.log('Voted ready to go');
}

main(index)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
