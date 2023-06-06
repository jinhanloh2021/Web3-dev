import { network } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { developmentChains, networkConfig } from '../helper-hardhat-config';
import { DeployFunction } from 'hardhat-deploy/dist/types';

const deployFundMe: DeployFunction = async ({
  getNamedAccounts,
  deployments,
}: HardhatRuntimeEnvironment) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId ?? 0;

  // const ethUsdPriceFeedAddress = networkConfig[chainId].priceFeedAddress;
  let ethUsdPriceFeedAddress;
  if (developmentChains.includes(network.name)) {
    const ethUsdAggregator = await deployments.get('MockV3Aggregator');
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId].priceFeedAddress;
  }

  // if on localhost or hardhat, then mock pricefeed

  const fundMe = await deploy('FundMe', {
    from: deployer,
    args: [ethUsdPriceFeedAddress], // put price feed address
    log: true,
  });
  log('----------------------------------------------------');
};

deployFundMe.tags = ['all', 'fundMe'];
export default deployFundMe;
