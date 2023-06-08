import { network } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { developmentChains } from '../helper-hardhat-config';

const DeployMocks = async ({
  getNamedAccounts,
  deployments,
}: HardhatRuntimeEnvironment) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId ?? 0;

  if (developmentChains.includes(network.name)) {
    log('Local network detected. Deploying mocks...');
    // deploy mock vrf coordinator
  }
};

export default DeployMocks;
