import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { assert, expect } from 'chai';
import { BigNumber } from 'ethers';
import { deployments, ethers, getNamedAccounts, network } from 'hardhat';
import { developmentChains, networkConfig } from '../../helper-hardhat-config';
import { Raffle, VRFCoordinatorV2Mock } from '../../typechain-types';

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('Raffle Unit Tests', () => {
      let raffle: Raffle, vrfCoordinatorV2Mock: VRFCoordinatorV2Mock;

      beforeEach(async () => {
        const { deployer } = await getNamedAccounts();
        await deployments.fixture(['all']); // Deploys all smartcontracts
        raffle = await ethers.getContract('Raffle', deployer);
        vrfCoordinatorV2Mock = await ethers.getContract(
          'VRFCoordinatorV2Mock',
          deployer
        );
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
          // await expect(raffle.enterRaffle()).to.be.revertedWithCustomError(
          //   raffle,
          //   'Raffle__NotEnoughEthEntered'
          // );
        });
      });
    });
