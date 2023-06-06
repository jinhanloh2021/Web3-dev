export const networkConfig: Record<
  number,
  { name: string; priceFeedAddress: string }
> = {
  11155111: {
    name: 'sepolia',
    priceFeedAddress: '0x694AA1769357215DE4FAC081bf1f309aDC325306', // hardcoded pricefeed address
  },
  31337: {
    name: 'localhost', // hardhat also has same chainId as localhost
    priceFeedAddress: '', // get from if on dev chain
  },
};

export const developmentChains = ['hardhat', 'localhost'];

export const DECIMALS = 8;
export const INITIAL_ANSWER = 2e11;
