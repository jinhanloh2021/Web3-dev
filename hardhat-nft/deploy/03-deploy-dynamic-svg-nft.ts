import { HardhatRuntimeEnvironment } from 'hardhat/types';
import 'dotenv/config';
import { ethers, network } from 'hardhat';
import verify from '../utils/verify';
import { DeployFunction, DeployResult } from 'hardhat-deploy/dist/types';
import {
  VERIFICATION_BLOCK_CONFIRMATIONS,
  developmentChains,
  networkConfig,
} from '../helper-hardhat-config';
import fs from 'fs';

const deployDynamicSvgNft: DeployFunction = async ({
  getNamedAccounts,
  deployments,
}: HardhatRuntimeEnvironment) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId: number = network.config.chainId ?? 0;

  let ethUsdPriceFeedAddress: string,
    waitConfirmations: number = VERIFICATION_BLOCK_CONFIRMATIONS;

  if (developmentChains.includes(network.name)) {
    waitConfirmations = 1;
    const EthUsdAggregator = await ethers.getContract('MockV3Aggregator');
    ethUsdPriceFeedAddress = EthUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed ?? '0x0';
  }

  const lowSVG = fs.readFileSync('./images/dynamicNft/frown.svg', {
    encoding: 'utf-8',
  });
  const highSVG = fs.readFileSync('./images/dynamicNft/happy.svg', {
    encoding: 'utf-8',
  });

  const args: string[] = [ethUsdPriceFeedAddress, lowSVG, highSVG];
  const dynamicSvgNft: DeployResult = await deploy('DynamicSvgNft', {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: waitConfirmations,
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log('Verifying contract...');
    await verify(dynamicSvgNft.address, args);
    log(`Contract ${dynamicSvgNft.address} verified`);
    log('-'.repeat(54));
  }
};

deployDynamicSvgNft.tags = ['all', 'dynamicsvg', 'main'];
export default deployDynamicSvgNft;
