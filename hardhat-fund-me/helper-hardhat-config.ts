export const networkConfig: Record<
  number,
  { name: string; priceFeedAddress: string; blockConfirmations: number }
> = {
  11155111: {
    name: 'sepolia',
    priceFeedAddress: '0x694AA1769357215DE4FAC081bf1f309aDC325306', // hardcoded pricefeed address
    blockConfirmations: 6,
  },
  31337: {
    name: 'localhost', // hardhat also has same chainId as localhost
    priceFeedAddress: '', // get from if on dev chain
    blockConfirmations: 1,
  },
  0: {
    name: 'fallback',
    priceFeedAddress: '',
    blockConfirmations: 1,
  }
};

export const developmentChains = ['hardhat', 'localhost'];

export const DECIMALS = 8;
export const INITIAL_ANSWER = 2e11;
