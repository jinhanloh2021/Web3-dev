import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { assert, expect } from 'chai';
import { BigNumber } from 'ethers';
import { deployments, ethers, getNamedAccounts, network } from 'hardhat';
import { developmentChains, networkConfig } from '../../helper-hardhat-config';
import { Raffle, VRFCoordinatorV2Mock } from '../../typechain-types';

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('Raffle Unit Tests', () => {
      let raffle: Raffle,
        vrfCoordinatorV2Mock: VRFCoordinatorV2Mock,
        deployer: string,
        raffleEntranceFee: BigNumber,
        interval: BigNumber;

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(['mocks', 'raffle']); // Deploys all smartContracts
        raffle = await ethers.getContract('Raffle', deployer);
        vrfCoordinatorV2Mock = await ethers.getContract(
          'VRFCoordinatorV2Mock',
          deployer
        );
        raffleEntranceFee = await raffle.getEntranceFee();
        interval = await raffle.getInterval();
      });

      describe('constructor', () => {
        it('Initialises raffle state correctly', async () => {
          const raffleState = await raffle.getRaffleState();
          assert.equal(raffleState.toString(), '0');
        });

        it('Initialise interval correctly', async () => {
          const interval = await raffle.getInterval();
          assert.equal(
            interval.toString(),
            networkConfig[network.config.chainId ?? 0].interval.toString()
          );
        });
      });

      describe('enterRaffle', () => {
        it("Reverts if sender doesn't pay enough", async () => {
          await expect(raffle.enterRaffle()).to.be.revertedWithCustomError(
            raffle,
            'Raffle__NotEnoughEthEntered'
          );
        });

        it('Records players when they enter', async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          const playerFromContract = await raffle.getPlayer(BigNumber.from(0));
          assert.equal(playerFromContract, deployer);
        });

        it('Emits event on enter', async () => {
          await expect(
            raffle.enterRaffle({ value: raffleEntranceFee })
          ).to.emit(raffle, 'RaffleEnter');
        });

        it('Does not allow entrance when raffle is calculating', async () => {
          // Enter raffle, and wait for lottery to reach payout time
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send('evm_increaseTime', [
            // simulate time passing
            interval.toNumber() + 1,
          ]);
          await network.provider.send('evm_mine', []); // mine a block

          // Mock chainlink keeper, and call function
          await raffle.performUpkeep([]); // now in calculating state
          await expect(
            raffle.enterRaffle({ value: raffleEntranceFee })
          ).to.be.revertedWithCustomError(raffle, 'Raffle__NotOpen');
        });
      });

      describe('checkUpkeep', () => {
        it('Returns false if contract has no ETH', async () => {
          await network.provider.send('evm_increaseTime', [
            interval.toNumber() + 1,
          ]);
          await network.provider.send('evm_mine', []);
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep('0x');
          assert(!upkeepNeeded);
        });

        it('Returns false if raffle is not open', async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send('evm_increaseTime', [
            interval.toNumber() + 1,
          ]);
          await network.provider.send('evm_mine', []);
          await raffle.performUpkeep([]);
          const raffleState = await raffle.getRaffleState();
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep('0x');
          assert.equal(raffleState.toString(), '1');
          assert.equal(upkeepNeeded, false);
        });

        it('Returns false if enough time has not passed', async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send('evm_mine', []);
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep('0x');
          assert(!upkeepNeeded);
        });

        it('Returns true if enough time passed, has players, enough eth, and is open', async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send('evm_increaseTime', [
            interval.toNumber() - 1,
          ]);
          await network.provider.send('evm_mine', []);
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep('0x');
          assert(upkeepNeeded);
        });
      });

      describe('performUpkeep', () => {
        it('Can only run if checkUpkeep returns true', async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send('evm_increaseTime', [
            interval.toNumber() + 1,
          ]);
          await network.provider.send('evm_mine', []);
          const tx = await raffle.performUpkeep('0x');
          assert(tx);
        });

        it('Reverts when checkUpkeep returns false', async () => {
          await expect(raffle.performUpkeep('0x'))
            .to.be.revertedWithCustomError(raffle, `Raffle__UpkeepNotNeeded`)
            .withArgs(0, 0, 0); // can check arguments in error, same as events
        });

        it('Updates raffle state, emits event, calls VRF', async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send('evm_increaseTime', [
            interval.toNumber() + 1,
          ]);
          await network.provider.send('evm_mine', []);

          const txResponse = await raffle.performUpkeep('0x');
          const txReceipt = await txResponse.wait(1);
          const requestId =
            txReceipt.events && txReceipt.events[1].args?.requestId;
          const raffleState = await raffle.getRaffleState();
          assert(requestId.toNumber() > 0);
          assert(raffleState == 1);
        });
      });

      describe('fulfillRandomWords', () => {
        beforeEach(async () => {
          // Contract in a state where upkeep can be performed
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send('evm_increaseTime', [
            interval.toNumber() + 1,
          ]);
          await network.provider.send('evm_mine', []);
        });
        it('Can only be called after performUpkeep', async () => {
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)
          ).to.be.revertedWith('nonexistent request');
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)
          ).to.be.revertedWith('nonexistent request');
        });

        // Should not do this. Too big.
        it('Picks winner, resets lottery, sends money', async () => {
          const extraParticipants = 3; // deploy at index 0
          const accounts: SignerWithAddress[] = await ethers.getSigners();
          for (let i = 1; i < 1 + extraParticipants; i++) {
            const participantAcc = raffle.connect(accounts[i]);
            await participantAcc.enterRaffle({
              value: raffleEntranceFee,
            });
          }
          const startingTimeStamp = await raffle.getLatestTimeStamp();

          // performUpkeep - Mock being Chainlink Keepers
          // fulfillRandomWords - Mock being Chainlink VRF

          await new Promise<void>(async (resolve, reject) => {
            // Adds listener for WinnerPicked event to be emitted
            raffle.once('WinnerPicked', async () => {
              try {
                const recentWinner = await raffle.getRecentWinner();
                const winnerEndBalance = await accounts[1].getBalance();
                const raffleState = await raffle.getRaffleState();
                const endingTimeStamp = await raffle.getLatestTimeStamp();
                const numPlayers = await raffle.getNumPlayers();
                assert.equal(numPlayers.toString(), '0');
                assert.equal(raffleState.toString(), '0');
                assert(endingTimeStamp.gt(startingTimeStamp));

                assert.equal(
                  winnerEndBalance.toString(),
                  winnerStartBalance
                    .add(
                      raffleEntranceFee
                        .mul(extraParticipants)
                        .add(raffleEntranceFee)
                    )
                    .toString()
                );
              } catch (e) {
                reject(e);
              }
              resolve();
            });
            const winnerStartBalance = await accounts[1].getBalance();
            const txResponse = await raffle.performUpkeep('0x'); // mock keeper
            const txReceipt = await txResponse.wait(1);
            await vrfCoordinatorV2Mock.fulfillRandomWords(
              // mock VRF
              (txReceipt.events && txReceipt.events[1].args?.requestId) ?? 123,
              raffle.address
            );
          });
        });
      });
    });
