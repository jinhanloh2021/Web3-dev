import { deployments, ethers, getNamedAccounts, network } from 'hardhat';
import { FundMe, MockV3Aggregator } from '../../typechain-types';
import { assert, expect } from 'chai';
import { developmentChains } from '../../helper-hardhat-config';
import { BigNumber } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('FundMe', () => {
      let fundMe: FundMe; // somehow typechain doesn't work here
      let deployer: string;
      let mockV3Aggregator: MockV3Aggregator;
      const sendValue = BigNumber.from((1e18).toString());

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
          const res_priceFeed_Address = await fundMe.getPriceFeed();
          const expected_priceFeed_Address = mockV3Aggregator.address;
          assert.equal(res_priceFeed_Address, expected_priceFeed_Address);
        });
      });

      describe('fund', async () => {
        it('Fails if not enough ETH sent', async () => {
          await expect(fundMe.fund()).to.be.revertedWithCustomError(
            fundMe,
            'FundMe__NotEnoughFunds'
          ); // expects fund() to revert if not enough eth
        });
        it('Updates the amount funded data structure', async () => {
          await fundMe.fund({ value: sendValue });
          const res = await fundMe.getAddressToAmountFunded(deployer);
          assert.equal(
            res.toString(),
            BigNumber.from((1e18).toString()).toString()
          );
        });
        it('Adds funders to array of funders', async () => {
          await fundMe.fund({ value: sendValue });
          const resFunder = await fundMe.getFunder(0);
          assert.equal(resFunder, deployer);
        });
      });

      describe('withdraw', async () => {
        beforeEach(async () => {
          await fundMe.fund({ value: sendValue }); // fund contract first
        });

        it('Withdraw ETH from a single funder', async () => {
          // Arrange
          const startFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          // Act
          const transactionRes = await fundMe.withdraw();
          const { gasUsed, effectiveGasPrice } = await transactionRes.wait(1); // waiting gets trans receipt
          const endFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endDeployerBalance = await fundMe.provider.getBalance(deployer);
          // Assert
          assert.equal(
            endFundMeBalance.toString(),
            BigNumber.from(0).toString()
          );
          assert.equal(
            startFundMeBalance.add(startDeployerBalance).toString(),
            endDeployerBalance.add(gasUsed.mul(effectiveGasPrice)).toString()
          );
        });

        it('Allows us to withdraw with multiple funders', async () => {
          // Arrange
          const accounts: SignerWithAddress[] = await ethers.getSigners();
          for (let i = 1; i < 6; i++) {
            // fundMe connected to deploy, need to reconnect with other accounts
            await fundMe.connect(accounts[i]).fund({
              value: sendValue,
            });
          }
          const startFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          // Act
          const transactionRes = await fundMe.withdraw();
          const transactionReceipt = await transactionRes.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt; // waiting gets trans receipt

          // Assert
          const endFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endDeployerBalance = await fundMe.provider.getBalance(deployer);
          assert.equal(
            endFundMeBalance.toString(),
            BigNumber.from(0).toString()
          );
          assert.equal(
            startFundMeBalance.add(startDeployerBalance).toString(),
            endDeployerBalance.add(gasUsed.mul(effectiveGasPrice)).toString()
          );
          await expect(fundMe.getFunder(BigNumber.from(0))).to.be.reverted;
          for (let i = 1; i < 6; i++) {
            assert.equal(
              (
                await fundMe.getAddressToAmountFunded(accounts[i].address)
              ).toString(),
              BigNumber.from(0).toString()
            );
          }
        });

        it('Only allows owner to withdraw funds', async () => {
          const accounts: SignerWithAddress[] = await ethers.getSigners();
          const attacker = accounts[1]; // non deployer, should not be able to withdraw
          await expect(
            fundMe.connect(attacker).withdraw()
          ).to.be.revertedWithCustomError(fundMe, 'FundMe__NotOwner');
        });

        /*************************************************************** */
        /************************* CHEAPER WITHDRAW **********************/
        /*************************************************************** */
        it('Withdraw ETH from a single funder', async () => {
          // Arrange
          const startFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          // Act
          const transactionRes = await fundMe.cheaperWithdraw();
          const { gasUsed, effectiveGasPrice } = await transactionRes.wait(1); // waiting gets trans receipt
          const endFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endDeployerBalance = await fundMe.provider.getBalance(deployer);
          // Assert
          assert.equal(
            endFundMeBalance.toString(),
            BigNumber.from(0).toString()
          );
          assert.equal(
            startFundMeBalance.add(startDeployerBalance).toString(),
            endDeployerBalance.add(gasUsed.mul(effectiveGasPrice)).toString()
          );
        });

        it('Allows us to withdraw with multiple funders', async () => {
          // Arrange
          const accounts: SignerWithAddress[] = await ethers.getSigners();
          for (let i = 1; i < 6; i++) {
            // fundMe connected to deploy, need to reconnect with other accounts
            await fundMe.connect(accounts[i]).fund({
              value: sendValue,
            });
          }
          const startFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          // Act
          const transactionRes = await fundMe.cheaperWithdraw();
          const transactionReceipt = await transactionRes.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt; // waiting gets trans receipt

          // Assert
          const endFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endDeployerBalance = await fundMe.provider.getBalance(deployer);
          assert.equal(
            endFundMeBalance.toString(),
            BigNumber.from(0).toString()
          );
          assert.equal(
            startFundMeBalance.add(startDeployerBalance).toString(),
            endDeployerBalance.add(gasUsed.mul(effectiveGasPrice)).toString()
          );
          await expect(fundMe.getFunder(BigNumber.from(0))).to.be.reverted;
          for (let i = 1; i < 6; i++) {
            assert.equal(
              (
                await fundMe.getAddressToAmountFunded(accounts[i].address)
              ).toString(),
              BigNumber.from(0).toString()
            );
          }
        });

        it('Only allows owner to withdraw funds', async () => {
          const accounts: SignerWithAddress[] = await ethers.getSigners();
          const attacker = accounts[1]; // non deployer, should not be able to withdraw
          await expect(
            fundMe.connect(attacker).cheaperWithdraw()
          ).to.be.revertedWithCustomError(fundMe, 'FundMe__NotOwner');
        });
      });

      describe('receive', async () => {
        it('should fund contract when receiving ETH', async () => {
          const startBalance = await ethers.provider.getBalance(fundMe.address);
          const deployerSigner = ethers.provider.getSigner(deployer);
          await deployerSigner.sendTransaction({
            to: fundMe.address,
            value: sendValue,
          });
          const endBalance = await ethers.provider.getBalance(fundMe.address);
          const expectedEndBalance = startBalance.add(sendValue);
          assert.equal(endBalance.toString(), expectedEndBalance.toString());
        });
      });
    });
