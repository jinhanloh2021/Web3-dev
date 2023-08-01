import { GovernorContract, TimeLock, Box } from '../../typechain-types';
import { deployments, ethers } from 'hardhat';
import { assert, expect } from 'chai';
import {
  BOX_FUNC,
  PROPOSAL_DESCRIPTION,
  NEW_STORE_VALUE,
  VOTING_DELAY,
  VOTING_PERIOD,
  MIN_DELAY,
} from '../../helper-hardhat-config';
import { moveBlocks } from '../../utils/move-blocks';
import { moveTime } from '../../utils/move-time';

describe('Governor Flow', async () => {
  let governor: GovernorContract;
  let timeLock: TimeLock;
  let box: Box;

  const voteWay = 1; // for
  const reason = 'I just feel like it';

  /** Deploy all contracts and get them */
  beforeEach(async () => {
    await deployments.fixture(['all']);
    governor = await ethers.getContract('GovernorContract');
    timeLock = await ethers.getContract('TimeLock');
    box = await ethers.getContract('Box');
  });

  it('Can only be changed through governance', async () => {
    await expect(box.store(55)).to.be.revertedWith(
      'Ownable: caller is not the owner'
    );
  });

  it('Proposes, votes, waits, queues, and then executes', async () => {
    // propose
    const encodedFunctionCall = box.interface.encodeFunctionData(BOX_FUNC, [
      NEW_STORE_VALUE,
    ]);
    console.log(`Proposing...`);
    const proposeTx = await governor.propose(
      [box.address],
      [0],
      [encodedFunctionCall],
      PROPOSAL_DESCRIPTION
    );
    const proposeReceipt = await proposeTx.wait(1);
    await moveBlocks(VOTING_DELAY + 1);

    const proposalId = proposeReceipt.events![0].args!.proposalId;
    // the Proposal State is an enum data type, defined in the IGovernor contract.
    // 0:Pending, 1:Active, 2:Canceled, 3:Defeated, 4:Succeeded, 5:Queued, 6:Expired, 7:Executed
    let proposalState = await governor.state(proposalId);
    console.log(`Current Proposal State: ${proposalState}`);
    assert.equal(proposalState.toString(), '1');

    // Vote
    console.log(`Voting...`);
    const voteTx = await governor.castVoteWithReason(
      proposalId,
      voteWay,
      reason
    );
    await voteTx.wait(1);
    await moveBlocks(VOTING_PERIOD + 1);

    proposalState = await governor.state(proposalId);
    assert.equal(proposalState.toString(), '4');
    console.log(`Current Proposal State: ${proposalState}`);

    // Queue
    console.log(`Queueing...`);
    // const descriptionHash = ethers.utils.id(PROPOSAL_DESCRIPTION);
    const descriptionHash = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(PROPOSAL_DESCRIPTION)
    );
    const queueTx = await governor.queue(
      [box.address],
      [0],
      [encodedFunctionCall],
      descriptionHash
    );
    await queueTx.wait(1);
    await moveTime(MIN_DELAY + 1);
    await moveBlocks(1);

    proposalState = await governor.state(proposalId);
    console.log(`Current Proposal State: ${proposalState}`);
    assert.equal(proposalState.toString(), '5');

    // Execute
    console.log('Executing...');
    const executeTx = await governor.execute(
      [box.address],
      [0],
      [encodedFunctionCall],
      descriptionHash
    );
    await executeTx.wait(1);
    await moveBlocks(1);
    proposalState = await governor.state(proposalId);
    assert.equal(proposalState.toString(), '7');
    console.log((await box.retrieve()).toString());
  });
});
