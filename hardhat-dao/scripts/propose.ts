import { ethers, network } from 'hardhat';
import {
  BOX_FUNC,
  NEW_STORE_VALUE,
  PROPOSAL_DESCRIPTION,
  VOTING_DELAY,
  developmentChains,
  proposalsFile,
} from '../helper-hardhat-config';
import { GovernorContract } from '../typechain-types';
import { moveBlocks } from '../utils/move-blocks';
import * as fs from 'fs';

export async function propose(
  args: any[],
  functionToCall: string,
  proposalDescription: string
) {
  const governor: GovernorContract = await ethers.getContract(
    'GovernorContract'
  );
  const box = await ethers.getContract('Box');
  const encodedFunctionCall = box.interface.encodeFunctionData(
    functionToCall,
    args
  );
  console.log(`Proposing: ${functionToCall} on ${box.address} with ${args}.`);
  console.log(`Proposal description:\n${proposalDescription}`);
  const proposalTx = await governor.propose(
    [box.address],
    [0],
    [encodedFunctionCall],
    proposalDescription
  );
  const proposalReceipt = await proposalTx.wait(1);
  if (developmentChains.includes(network.name)) {
    moveBlocks(VOTING_DELAY + 1);
  }
  const proposalId = proposalReceipt.events![0].args!.proposalId;

  /** Write proposalId to JSON file */
  let proposals = JSON.parse(fs.readFileSync(proposalsFile, 'utf-8'));
  proposals[network.config.chainId!.toString()].push(proposalId.toString());
  fs.writeFileSync(proposalsFile, JSON.stringify(proposals));

  const proposalState = await governor.state(proposalId);
  const proposalSnapShot = await governor.proposalSnapshot(proposalId);
  const proposalDeadline = await governor.proposalDeadline(proposalId);

  // the Proposal State is an enum data type, defined in the IGovernor contract.
  // 0:Pending, 1:Active, 2:Canceled, 3:Defeated, 4:Succeeded, 5:Queued, 6:Expired, 7:Executed
  console.log(`Current Proposal State: ${proposalState}`);
  // What block # the proposal was snapshot
  console.log(`Current Proposal Snapshot: ${proposalSnapShot}`);
  // The block number the proposal voting expires
  console.log(`Current Proposal Deadline: ${proposalDeadline}`);
}

propose([NEW_STORE_VALUE], BOX_FUNC, PROPOSAL_DESCRIPTION)
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
