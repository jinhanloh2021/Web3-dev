import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/dist/types';
import { ethers } from 'hardhat';
import { ADDRESS_ZERO } from '../helper-hardhat-config';
import { Governor, TimeLock } from '../typechain-types';

const setupContracts: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { getNamedAccounts, deployments, network } = hre;
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const timeLock: TimeLock = await ethers.getContract('TimeLock');
  const governor: Governor = await ethers.getContract('GovernorContract');
  log('Setting up roles...');
  const proposerRole = await timeLock.PROPOSER_ROLE();
  const executorRole = await timeLock.EXECUTOR_ROLE();
  const adminRole = await timeLock.TIMELOCK_ADMIN_ROLE();

  await timeLock.grantRole(proposerRole, governor.address);
  await timeLock.grantRole(executorRole, ADDRESS_ZERO);
  await timeLock.revokeRole(adminRole, deployer);
};

export default setupContracts;
