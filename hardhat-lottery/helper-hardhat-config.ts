import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';

export const networkConfig: Record<
  number,
  {
    name: string;
    VRFCoordinatorV2: string;
    blockConfirmations: number;
    entranceFee: BigNumber;
    gasLane: string;
    subscriptionId: string;
    callbackGasLimit: string;
    interval: string;
  }
> = {
  11155111: {
    name: 'sepolia',
    VRFCoordinatorV2: '0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625', // From Chainlink website
    blockConfirmations: 6,
    entranceFee: ethers.utils.parseEther('0.01'),
    gasLane:
      '0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c',
    subscriptionId: '2708',
    callbackGasLimit: '500000',
    interval: '30',
  },
  31337: {
    name: 'localhost', // hardhat also has same chainId as localhost
    VRFCoordinatorV2: '', // get from if on dev chain
    blockConfirmations: 1,
    entranceFee: ethers.utils.parseEther('0.01'),
    gasLane:
      '0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c',
    subscriptionId: '2708',
    callbackGasLimit: '500000',
    interval: '30',
  },
  0: {
    name: 'fallback',
    VRFCoordinatorV2: '',
    blockConfirmations: 1,
    entranceFee: ethers.utils.parseEther('0.01'),
    gasLane:
      '0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c',
    subscriptionId: '2708',
    callbackGasLimit: '500000',
    interval: '30',
  },
};

export const developmentChains = ['hardhat', 'localhost'];
