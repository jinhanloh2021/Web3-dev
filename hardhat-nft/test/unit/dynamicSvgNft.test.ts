import { deployments, ethers, getNamedAccounts, network } from 'hardhat';
import { developmentChains } from '../../helper-hardhat-config';
import { assert } from 'chai';
import { BigNumber } from 'ethers';
import { DynamicSvgNft, MockV3Aggregator } from '../../typechain-types';

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('dynamicSvgNft tests', () => {
      let dynamicSvgNft: DynamicSvgNft,
        deployer: string,
        mockV3Aggregator: MockV3Aggregator;

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(['dynamicsvg', 'mocks']);
        dynamicSvgNft = await ethers.getContract('DynamicSvgNft', deployer);
        mockV3Aggregator = await ethers.getContract(
          'MockV3Aggregator',
          deployer
        );
      });

      describe('constructor', () => {
        it('initialises dynamic svg state correctly', async () => {
          assert.equal(
            (await dynamicSvgNft.getTokenCounter()).toString(),
            BigNumber.from(0).toString()
          );
          assert.equal(
            (await dynamicSvgNft.getHighValueFromTokenId(0)).toString(),
            BigNumber.from(0).toString()
          );
        });
      });
    });
