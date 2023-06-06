/**
 * When command "yarn hardhat deploy" is run, by default it is run on the hardhat network which is
 * a development network. Hardhat-deploy package will choose run the deploy scripts in alphabetical
 * order, so 00-deploy-mocks run first, and it checks if network is dev before deploying mocks.
 */

import { network } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
  DECIMALS,
  INITIAL_ANSWER,
  developmentChains,
} from '../helper-hardhat-config';
import { DeployFunction } from 'hardhat-deploy/dist/types';

const deployMocks: DeployFunction = async ({
  getNamedAccounts,
  deployments,
}: HardhatRuntimeEnvironment) => {
  const { deploy, log } = deployments;
  const { deployer /*, user */ } = await getNamedAccounts(); // named accounts in hardhat.config

  log('------------------00-deploy-mocks.ts------------------');
  if (developmentChains.includes(network.name)) {
    // in dev
    log('Local network detected. Deploying mocks...');
    await deploy('MockV3Aggregator', {
      contract: 'MockV3Aggregator',
      from: deployer,
      log: true,
      args: [DECIMALS, INITIAL_ANSWER],
    });
    log('Mocks deployed');
    log('------------------------------------------------------');
  } else {
    log('Testnet or Mainnet detected, skipping mocks...');
  }
};
deployMocks.tags = ['all', 'mocks'];
export default deployMocks;
