import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/dist/types';
import { ethers } from 'hardhat';
import { ADDRESS_ZERO } from '../helper-hardhat-config';
import { Governor, TimeLock } from '../typechain-types';

const setupContracts: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { getNamedAccounts, deployments } = hre;
  const { log } = deployments;
  const { deployer } = await getNamedAccounts();
  const timeLock: TimeLock = await ethers.getContract('TimeLock', deployer);
  const governor: Governor = await ethers.getContract(
    'GovernorContract',
    deployer
  );
  log('Setting up roles...');
  const proposerRole = await timeLock.PROPOSER_ROLE();
  const executorRole = await timeLock.EXECUTOR_ROLE();
  const adminRole = await timeLock.TIMELOCK_ADMIN_ROLE();

  const proposerTx = await timeLock.grantRole(proposerRole, governor.address); // only governor can propose
  await proposerTx.wait(1);
  const executorTx = await timeLock.grantRole(executorRole, ADDRESS_ZERO); // Everyone can execute
  await executorTx.wait(1);
  const revokeTx = await timeLock.revokeRole(adminRole, deployer); // No TimeLock admin
  await revokeTx.wait(1);
};

export default setupContracts;
setupContracts.tags = ['all', 'setup'];
