import { ethers, getNamedAccounts, network } from 'hardhat';
import { FundMe } from '../../typechain-types';
import { assert } from 'chai';
import { developmentChains } from '../../helper-hardhat-config';
import { BigNumber } from 'ethers';

developmentChains.includes(network.name)
  ? describe.skip // skip if on hardhat or localhost
  : describe('FundMe', () => {
      let fundMe: FundMe;
      let deployer: string;
      const sendValue = BigNumber.from((1e18).toString());
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        fundMe = await ethers.getContract('FundMe', deployer);
      });
      it('Allows people to fund and withdraw', async () => {
        await fundMe.fund({ value: sendValue });
        await fundMe.withdraw();
        const endBalance = await fundMe.provider.getBalance(fundMe.address);
        assert.equal(endBalance.toString(), BigNumber.from(0).toString());
      });
    });
