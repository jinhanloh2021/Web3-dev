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

  it('Person added to people array without mutation', async () => {
    const transactionRes = await simpleStorage.addPerson(
      'Jin Han',
      BigNumber.from(42)
    );
    await transactionRes.wait(1);

    const expectedPerson: [BigNumber, string] & {
      favoriteNumber: BigNumber;
      name: string;
    } = [BigNumber.from(42), 'Jin Han'] as [BigNumber, string] & {
      favoriteNumber: BigNumber;
      name: string;
    };
    expectedPerson.favoriteNumber = BigNumber.from(42);
    expectedPerson.name = 'Jin Han';

    const addedPerson = await simpleStorage.people(BigNumber.from(0));

    assert.equal(addedPerson[0].toString(), expectedPerson[0].toString());
    assert.equal(addedPerson[1], expectedPerson[1]);
    assert.equal(
      addedPerson.favoriteNumber.toString(),
      expectedPerson.favoriteNumber.toString()
    );
    assert.equal(addedPerson.name, expectedPerson.name);
  });
});
