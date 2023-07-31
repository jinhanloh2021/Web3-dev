import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/dist/types';
import {
  QUORUM_PERCENTAGE,
  VOTING_DELAY,
  VOTING_PERIOD,
} from '../helper-hardhat-config';

const deployGovernorContract: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { getNamedAccounts, deployments, network } = hre;
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const governanceToken = await get('GovernanceToken');
  const timeLock = await get('TimeLock');
  log('Deploying governor contract');
  const governerContract = await deploy('GovernorContract', {
    from: deployer,
    args: [
      governanceToken.address,
      timeLock.address,
      VOTING_DELAY,
      VOTING_PERIOD,
      QUORUM_PERCENTAGE,
    ],
    log: true,
    waitConfirmations: 1,
  });
};

export default deployGovernorContract;
