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
        await deployments.fixture(['mocks', 'raffle']); // Deploys all smartcontracts
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
          console.log('Hello world');
          console.log(`Subid: ${await raffle.getSubid()}`);
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
    });
