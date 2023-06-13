import { HardhatRuntimeEnvironment } from 'hardhat/types';
import 'dotenv/config';
import { network } from 'hardhat';
import verify from '../utils/verify';
import {
  VERIFICATION_BLOCK_CONFIRMATIONS,
  developmentChains,
} from '../helper-hardhat-config';

const deployBasicNft = async ({
  getNamedAccounts,
  deployments,
}: HardhatRuntimeEnvironment) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const waitBlockConfirmations = developmentChains.includes(network.name)
    ? 1
    : VERIFICATION_BLOCK_CONFIRMATIONS;
  const args: any[] = [];

  log('-'.repeat(54));
  const basicNft = await deploy('BasicNft', {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: waitBlockConfirmations,
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log(`Verifying contract ${basicNft.address} on ${network.name}...`);
    await verify(basicNft.address, []);
    log(`Contract verified`);
    log('-'.repeat(54));
  } else {
    log(`${network.name} network detected. Verification not needed.`);
    log('-'.repeat(54));
  }
};

export default deployBasicNft;
deployBasicNft.tags = ['all', 'BasicNft', 'main']; // have to add tags to be called by Fixture([])
