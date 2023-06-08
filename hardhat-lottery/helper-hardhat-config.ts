export const networkConfig: Record<
  number,
  { name: string; VRFCoordinatorV2: string; blockConfirmations: number }
> = {
  11155111: {
    name: 'sepolia',
    VRFCoordinatorV2: '0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625', // hardcoded pricefeed address
    blockConfirmations: 6,
  },
  31337: {
    name: 'localhost', // hardhat also has same chainId as localhost
    VRFCoordinatorV2: '', // get from if on dev chain
    blockConfirmations: 1,
  },
  0: {
    name: 'fallback',
    VRFCoordinatorV2: '',
    blockConfirmations: 1,
  },
};

export const developmentChains = ['hardhat', 'localhost'];
