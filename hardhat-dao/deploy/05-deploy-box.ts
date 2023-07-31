import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/dist/types';
import { ethers } from 'hardhat';

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

  const boxContract = await ethers.getContractAt('Box', box.address);
  const timeLock = await ethers.getContractAt('TimeLock', deployer);
  const transferOwnerTx = await boxContract.transferOwnership(
    await timeLock.getAddress()
  );
  log('Done');
};

export default deployBox;
