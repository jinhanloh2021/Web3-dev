import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/dist/types';
import { ethers } from 'hardhat';
import { ADDRESS_ZERO } from '../helper-hardhat-config';

const setupContracts: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { getNamedAccounts, deployments, network } = hre;
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  (await deployments.get('TimeLock')).address;
  const timeLock = await ethers.getContractAt(
    'TimeLock',
    (
      await deployments.get('TimeLock')
    ).address
  );
  const governor = await ethers.getContractAt(
    'GovernorContract',
    (
      await deployments.get('GovernorContract')
    ).address
  );
  log('Setting up roles...');
  const proposerRole = await timeLock.PROPOSER_ROLE();
  const executorRole = await timeLock.EXECUTOR_ROLE();
  const adminRole = await timeLock.TIMELOCK_ADMIN_ROLE();

  await timeLock.grantRole(proposerRole, await governor.getAddress());
  await timeLock.grantRole(executorRole, ADDRESS_ZERO);
  await timeLock.revokeRole(adminRole, deployer);
};

export default setupContracts;
