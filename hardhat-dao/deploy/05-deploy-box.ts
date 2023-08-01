import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/dist/types';
import { ethers } from 'hardhat';
import { Box, TimeLock } from '../typechain-types';

const deployBox: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { getNamedAccounts, deployments, network } = hre;
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  log('Deploying box...');
  const box = await deploy('Box', {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });

  const boxContract: Box = await ethers.getContract('Box');
  const timeLock: TimeLock = await ethers.getContract('TimeLock');
  const transferOwnerTx = await boxContract.transferOwnership(timeLock.address);
  await transferOwnerTx.wait(1);
  log('Done');
};

export default deployBox;
deployBox.tags = ['all', 'box'];
