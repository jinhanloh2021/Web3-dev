import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { developmentChains, networkConfig } from '../helper-hardhat-config';
import { ethers, network } from 'hardhat';
import { VRFCoordinatorV2Mock } from '../typechain-types';
import { DeployFunction, DeployResult } from 'hardhat-deploy/dist/types';
import verify from '../utils/verify';
import { BigNumber } from 'ethers';

const VRF_SUBSCRIPTION_FUND_AMOUNT = ethers.utils.parseEther('2');

const deployRaffle: DeployFunction = async ({
  getNamedAccounts,
  deployments,
}: HardhatRuntimeEnvironment) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId: number = network.config.chainId ?? 0;
  let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock | any,
    vrfCoordinatorV2Address: string,
    subscriptionId: BigNumber;

  log('-----------------01-deploy-raffle.ts------------------');
  // on development chain, get address from deployed mock
  if (developmentChains.includes(network.name)) {
    vrfCoordinatorV2Mock = await ethers.getContract('VRFCoordinatorV2Mock');
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;

    const transRes = await vrfCoordinatorV2Mock.createSubscription();
    const transReceipt = await transRes.wait(1);
    if (transReceipt.events) {
      subscriptionId = BigNumber.from(transReceipt.events[0].args?.subId);
    } else {
      subscriptionId = BigNumber.from(123);
    }
    // Fund subscription
    await vrfCoordinatorV2Mock.fundSubscription(
      subscriptionId,
      VRF_SUBSCRIPTION_FUND_AMOUNT
    );
  } else {
    // on testnet/mainnet, get address from const
    vrfCoordinatorV2Address = networkConfig[chainId].VRFCoordinatorV2;
    subscriptionId = BigNumber.from(networkConfig[chainId].subscriptionId);
  }

  const entranceFee = networkConfig[chainId].entranceFee;
  const gasLane = BigNumber.from(networkConfig[chainId].gasLane);
  const callbackGasLimit = BigNumber.from(
    networkConfig[chainId].callbackGasLimit
  );
  const interval = BigNumber.from(networkConfig[chainId].interval);

  const args = [
    vrfCoordinatorV2Address,
    entranceFee,
    gasLane,
    subscriptionId,
    callbackGasLimit,
    interval,
  ];

  const raffle: DeployResult = await deploy('Raffle', {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations:
      networkConfig[network.config.chainId ?? 0].blockConfirmations,
  });

  if (developmentChains.includes(network.name) && vrfCoordinatorV2Mock) {
    // Add Raffle as consumer of VRFCoordinatorV2Mock.sol
    await vrfCoordinatorV2Mock.addConsumer(subscriptionId, raffle.address);
  }

  // Verify contract if on testnet/mainnet
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log('Verifying contract...');
    await verify(raffle.address, args);
    log(`Contract ${raffle.address} verified`);
  }
  log('Raffle smart contract deployed');
  log('-'.repeat(54));
};

deployRaffle.tags = ['all', 'raffle'];
export default deployRaffle;
