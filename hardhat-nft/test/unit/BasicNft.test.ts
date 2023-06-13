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

      describe('constructor', () => {
        it('tokenCounter initialised to 0', async () => {
          assert.equal(
            (await basicNft.getTokenCounter()).toString(),
            BigNumber.from(0).toString()
          );
        });
        it('name initialised correctly', async () => {
          assert.equal(await basicNft.name(), 'Dogie');
        });
        it('Symbol initialised correctly', async () => {
          assert.equal(await basicNft.symbol(), 'DOG');
        });
      });

      describe('mintNft', () => {
        it('mint increments token counter', async () => {
          const initialCounter = await basicNft.getTokenCounter();
          await basicNft.mintNft();
          const endCounter = await basicNft.getTokenCounter();
          assert.equal(
            endCounter.sub(initialCounter).toString(),
            BigNumber.from(1).toString()
          );
        });
      });
    });
