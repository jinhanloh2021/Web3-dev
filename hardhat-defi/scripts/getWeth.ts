import { ethers, getNamedAccounts } from 'hardhat';
import { IWeth } from '../typechain-types';
import { BigNumber } from 'ethers';

const AMOUNT: BigNumber = ethers.utils.parseEther('0.02');

const getWeth = async () => {
  const { deployer } = await getNamedAccounts();
  // call deposit function on weth contract
  // need abi and contract address 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
  const iWeth: IWeth = await ethers.getContractAt(
    'IWeth',
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    deployer
  );
  const tx = await iWeth.deposit({ value: AMOUNT });
  await tx.wait(1);
  const wethBalance = await iWeth.balanceOf(deployer);
  console.log(`WETH Balance: ${wethBalance.toString()}`);
};

export default getWeth;
