import { deployments, ethers, getNamedAccounts, network } from 'hardhat';
import { developmentChains } from '../../helper-hardhat-config';
import { assert, expect } from 'chai';
import { BigNumber } from 'ethers';
import { DynamicSvgNft, MockV3Aggregator } from '../../typechain-types';
import {
  lowTokenUri,
  highTokenUri,
  lowSVGImageUri,
  highSVGImageUri,
} from '../../utils/constants.test';

// Run this to test this specific file: hh test test/unit/dynamicSvgNft.test.ts
!developmentChains.includes(network.name)
  ? describe.skip
  : describe('dynamicSvgNft tests', () => {
      let dynamicSvgNft: DynamicSvgNft,
        deployer: string,
        mockV3Aggregator: MockV3Aggregator;
      const highValue = BigNumber.from((1e18).toString());

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

      describe('svgToImageURI', () => {
        it('Returns correct image URI from svg', async () => {
          // svgToImageURI is a private function called by constructor. Can't test private functions directly.
          assert.equal(await dynamicSvgNft.getLowImageUri(), lowSVGImageUri);
          assert.equal(await dynamicSvgNft.getHighImageUri(), highSVGImageUri);
        });
      });

      describe('mintNft', () => {
        it('Sets high value for tokenId', async () => {
          const tokenId = await dynamicSvgNft.getTokenCounter();
          await dynamicSvgNft.mintNft(highValue);

          assert.equal(
            (await dynamicSvgNft.getHighValueFromTokenId(tokenId)).toString(),
            highValue.toString()
          );
        });

        it('Emits created NFT event when called', async () => {
          const tokenId = await dynamicSvgNft.getTokenCounter();
          await expect(dynamicSvgNft.mintNft(highValue))
            .to.emit(dynamicSvgNft, 'CreatedNFT')
            .withArgs(tokenId, highValue);
        });

        it('Increments token counter when called', async () => {
          const startTokenCounter = await dynamicSvgNft.getTokenCounter();
          await dynamicSvgNft.mintNft(highValue);
          const endTokenCounter = await dynamicSvgNft.getTokenCounter();
          assert.equal(
            startTokenCounter.add(1).toString(),
            endTokenCounter.toString()
          );
        });
      });

      describe('tokenURI', () => {
        beforeEach(async () => {
          // Arrange: person to mint NFT and update tokenCounter and high price
        });

        it('Reverts if tokenId non-existent', async () => {
          const voidTokenId = BigNumber.from(10);
          await expect(dynamicSvgNft.tokenURI(voidTokenId))
            .to.be.revertedWithCustomError(
              dynamicSvgNft,
              'DynamicSvgNft__TokenNotFound'
            )
            .withArgs(voidTokenId);
        });
      });
    });
