import { HardhatRuntimeEnvironment } from 'hardhat/types';
import 'dotenv/config';
import { ethers, network } from 'hardhat';
import verify from '../utils/verify';
import {
  VERIFICATION_BLOCK_CONFIRMATIONS,
  VRF_SUBSCRIPTION_FUND_AMOUNT,
  developmentChains,
  networkConfig,
} from '../helper-hardhat-config';
import { BigNumber } from 'ethers';
import { VRFCoordinatorV2Mock } from '../typechain-types';
import {
  storeImages,
  storeTokenUriMetadata,
  iMetadata,
} from '../utils/uploadToPinata';
import { DeployFunction, DeployResult } from 'hardhat-deploy/dist/types';

const IMAGES_LOCATION = './images/randomNft/';

const deployBasicNft: DeployFunction = async ({
  getNamedAccounts,
  deployments,
}: HardhatRuntimeEnvironment) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId: number = network.config.chainId ?? 0;
  let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock | any,
    vrfCoordinatorV2Address: string,
    subscriptionId: BigNumber,
    dogTokenUris: string[] = [
      'ipfs://QmcwKUpgzsJajzpB641PcjNwhvCfVTyi47kKUaJoU7fU4C',
      'ipfs://QmRPzSPxYXUQChAhU2rfwWdEskUfMteGe1u9EsVY5RFZSs',
      'ipfs://QmNuQjno6Fi5HdA1itzpKTVW7y4izYPZ2n6SjBgYo41nu6',
    ],
    waitConfirmations = VERIFICATION_BLOCK_CONFIRMATIONS;

  log('-----------------02-deploy-randomIpfs.ts------------------');
  // on development chain, get address from deployed mock
  if (developmentChains.includes(network.name)) {
    vrfCoordinatorV2Mock = await ethers.getContract('VRFCoordinatorV2Mock');
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
    waitConfirmations = 1;

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
    vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2 ?? '0x0';
    subscriptionId = BigNumber.from(networkConfig[chainId].subscriptionId);
  }

  if (process.env.UPLOAD_TO_PINATA == 'true') {
    dogTokenUris = await handleTokenUris();
    log('-'.repeat(54));
  }
  const args = [
    vrfCoordinatorV2Address,
    subscriptionId,
    networkConfig[chainId].gasLane,
    networkConfig[chainId].callbackGasLimit,
    dogTokenUris,
    networkConfig[chainId].mintFee,
  ];

  const randomIpfsNft: DeployResult = await deploy('RandomIpfsNft', {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: waitConfirmations,
  });
  log('Raffle smart contract deployed');
  log('-'.repeat(54));

  // Verify contract if on testnet/mainnet
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log('Verifying contract...');
    await verify(randomIpfsNft.address, args);
    log(`Contract ${randomIpfsNft.address} verified`);
    log('-'.repeat(54));
  }
};

const handleTokenUris = async (): Promise<string[]> => {
  let dogTokenUris: string[] = [];
  // Store image in IPFS
  const { responses, files } = await storeImages(IMAGES_LOCATION);
  // Store metadata in IPFS
  console.log('Storing metadata to IPFS...');
  for (const imageUploadResIndex in responses) {
    // Create metadata
    const tokenUriMetadata: iMetadata = {
      name: '',
      description: '',
      image: '',
    };
    tokenUriMetadata.name = files[imageUploadResIndex].replace('.png', '');
    tokenUriMetadata.description = `An adorable ${
      tokenUriMetadata.name ?? 'unknown'
    } pup`;
    tokenUriMetadata.image = `ipfs://${responses[imageUploadResIndex].IpfsHash}`;
    console.log(`Uploading ${tokenUriMetadata.name}`);

    // Upload JSON metadata to pinata
    const metadataUploadRes = await storeTokenUriMetadata(tokenUriMetadata);
    dogTokenUris.push(`ipfs://${metadataUploadRes?.IpfsHash}`);
    console.log(`Metadata ${tokenUriMetadata.name} uploaded...`);
  }
  console.log('Dog token URIs uploaded');
  console.log(dogTokenUris);
  return dogTokenUris;
};

deployBasicNft.tags = ['all', 'randomipfs', 'main'];
export default deployBasicNft;
