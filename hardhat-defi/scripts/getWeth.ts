import { getNamedAccounts } from 'hardhat';

const getWeth = async () => {
  const { deployer } = await getNamedAccounts();
  // call deposit function on weth contract
  // need abi and contract address

};

export default getWeth;
