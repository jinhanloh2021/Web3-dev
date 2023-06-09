import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { assert, expect } from 'chai';
import { BigNumber } from 'ethers';
import { deployments, ethers, getNamedAccounts, network } from 'hardhat';
import { developmentChains, networkConfig } from '../../helper-hardhat-config';
import { Raffle, VRFCoordinatorV2Mock } from '../../typechain-types';

developmentChains.includes(network.name)
  ? describe.skip
  : describe('Raffle Staging Tests', () => {
      let raffle: Raffle, deployer: string, raffleEntranceFee: BigNumber;
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        raffle = await ethers.getContract('Raffle', deployer);
        raffleEntranceFee = await raffle.getEntranceFee();
      });

      describe('fulfillRandomWords', () => {
        it('works with live Chainlink keepers and Chainlink VRF', async () => {
          // enter the raffle
          const startingTimeStamp = await raffle.getLatestTimeStamp();
          const accounts: SignerWithAddress[] = await ethers.getSigners();

          await new Promise<void>(async (resolve, reject) => {
            raffle.once('WinnerPicked', async () => {
              console.log('Winner picked event caught');
              try {
                const recentWinner = await raffle.getRecentWinner();
                const raffleState = await raffle.getRaffleState();
                const winnerEndBalance = await accounts[0].getBalance();
                const endingTimeStamp = await raffle.getLatestTimeStamp();

                await expect(raffle.getPlayer(0)).to.be.reverted;
                assert.equal(recentWinner.toString(), deployer);
                assert.equal(raffleState, 0);
                assert.equal(
                  winnerEndBalance.toString(),
                  winnerStartBalance.add(raffleEntranceFee).toString()
                );
                assert(endingTimeStamp > startingTimeStamp);
                resolve();
              } catch (e) {
                console.log(e);
                reject(e);
              }
            });
            await raffle.enterRaffle({ value: raffleEntranceFee });
            const winnerStartBalance = await accounts[0].getBalance();
          });
        });
      });
    });
