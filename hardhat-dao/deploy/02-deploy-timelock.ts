import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/dist/types';
import { MIN_DELAY } from '../helper-hardhat-config';

const deployTimelock: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { getNamedAccounts, deployments } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  log('Deploying timelock...');
  const timeLock = await deploy('TimeLock', {
    from: deployer,
    args: [MIN_DELAY, [], [], deployer],
    log: true,
    waitConfirmations: 1,
  });
};

export default deployTimelock;
deployTimelock.tags = ['all', 'timelock'];
