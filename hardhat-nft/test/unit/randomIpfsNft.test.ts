import { deployments, ethers, getNamedAccounts, network } from 'hardhat';
import { developmentChains } from '../../helper-hardhat-config';
import { assert } from 'chai';
import { BasicNft } from '../../typechain-types';
import { BigNumber } from 'ethers';

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('BasicNft tests', () => {
      let basicNft: BasicNft, deployer: string;

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(['BasicNft']); // Fixture checks tags to deploy
        basicNft = await ethers.getContract('BasicNft', deployer);
      });
    });
