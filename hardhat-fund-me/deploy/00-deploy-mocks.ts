import { network } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
  DECIMALS,
  INITIAL_ANSWER,
  developmentChains,
  networkConfig,
} from '../helper-hardhat-config';
import { DeployFunction } from 'hardhat-deploy/dist/types';

const deployMocks: DeployFunction = async ({
  getNamedAccounts,
  deployments,
}: HardhatRuntimeEnvironment) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId ?? 0;

  if (developmentChains.includes(networkConfig[chainId].name)) {
    log('Local network detected. Deploying mocks...');
    await deploy('MockV3Aggregator', {
      contract: 'MockV3Aggregator',
      from: deployer,
      log: true,
      args: [DECIMALS, INITIAL_ANSWER],
    });
    log('Mocks deployed');
    log('---------------------------------------------------');
  }
};
deployMocks.tags = ['all', 'mocks'];
export default deployMocks;
