import { network } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { developmentChains, networkConfig } from '../helper-hardhat-config';
import { DeployFunction, DeployResult, Deployment } from 'hardhat-deploy/dist/types';

const deployFundMe: DeployFunction = async ({
  getNamedAccounts,
  deployments,
}: HardhatRuntimeEnvironment) => {
  const { deploy, log } = deployments;
  const { deployer /*, user */ } = await getNamedAccounts();
  const chainId = network.config.chainId ?? 0;
  log('------------------01-deploy-fundMe.ts------------------');
  let ethUsdPriceFeedAddress: string; // assign address, depends on dev or prod

  // Development, mock pricefeed already deployed, just get address
  if (developmentChains.includes(network.name)) {
    const ethUsdAggregator: Deployment = await deployments.get(
      'MockV3Aggregator'
    );
    ethUsdPriceFeedAddress = ethUsdAggregator.address; // deployed contract address is priceFeedAddress
  } else {
    // production or testnet, don't deploy mock
    ethUsdPriceFeedAddress = networkConfig[chainId].priceFeedAddress;
  }

  const fundMe: DeployResult = await deploy('FundMe', {
    from: deployer,
    args: [ethUsdPriceFeedAddress], // put price feed address
    log: true,
  });
  log('-------------------------------------------------------');
};

deployFundMe.tags = ['all', 'fundMe']; //not javascript feature, hardhat deploy feature
export default deployFundMe;
