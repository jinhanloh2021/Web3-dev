import { deployments, ethers, getNamedAccounts, network } from 'hardhat';
import { FundMe, MockV3Aggregator } from '../../typechain-types';
import { assert } from 'chai';
import { developmentChains } from '../../helper-hardhat-config';

describe('FundMe', () => {
  let fundMe: FundMe; // somehow typechain doesn't work here
  let deployer: string;
  let mockV3Aggregator: MockV3Aggregator;

  beforeEach(async () => {
    // deploy our FundMe contract using Hardhat-deploy
    if (!developmentChains.includes(network.name)) {
      throw 'You need to be on a development chain to run tests';
    }
    deployer = (await getNamedAccounts()).deployer;
    await deployments.fixture(['all']); // deploys all contracts and saves deployments for all test
    fundMe = await ethers.getContract('FundMe');
    mockV3Aggregator = await ethers.getContract('MockV3Aggregator');
  });
  describe('constructor', () => {
    it('Sets aggregator addresses correctly', async () => {
      const res_priceFeed_Address = await fundMe.priceFeed();
      const expected_priceFeed_Address = mockV3Aggregator.address;
      assert.equal(res_priceFeed_Address, expected_priceFeed_Address);
    });
  });
});
