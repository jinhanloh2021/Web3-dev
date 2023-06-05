import { ethers, network } from 'hardhat';
import { SimpleStorage, SimpleStorage__factory } from '../typechain-types';
import { assert, expect } from 'chai';
import { BigNumber } from 'ethers';
describe('SimpleStorage', () => {
  // environment setup
  // Create contractFactory and deploy contract
  let contractFactory: SimpleStorage__factory, simpleStorage: SimpleStorage;
  beforeEach(async () => {
    contractFactory = await ethers.getContractFactory('SimpleStorage');
    simpleStorage = await contractFactory.deploy();
  });

  // Test
  it('Favourite number should initialise to 0', async () => {
    const currentValue = await simpleStorage.retrieve();
    const expectedValue = '0';
    assert.equal(currentValue.toString(), expectedValue);
    // expect(currentValue.toString()).to.equal(expectedValue);
  });

  it('Favourite number should update when call store', async () => {
    const expectedValue = '7';
    const transactionRes = await simpleStorage.store(
      BigNumber.from(expectedValue)
    );
    await transactionRes.wait(1);

    const currentValue = await simpleStorage.retrieve();
    assert.equal(currentValue.toString(), expectedValue);
  });
});
