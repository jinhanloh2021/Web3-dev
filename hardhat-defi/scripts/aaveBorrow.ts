import { ethers, getNamedAccounts } from 'hardhat';
import getWeth from '../scripts/getWeth';
import {
  ILendingPool,
  ILendingPoolAddressesProvider,
} from '../typechain-types';
const main = async () => {
  //protocol treats everything as ERC20. Need to wrap ETH to Wrapped ETH WETH.
  await getWeth();
  const { deployer } = await getNamedAccounts();
  // abi, address
  // Lending pool address provider: 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
  // Lending pool
  const lendingPool = await getLendingPool(deployer);
  console.log(`LendingPool addres: ${lendingPool}`);

  // Deposit
};

const getLendingPool = async (account: string): Promise<ILendingPool> => {
  const lendingPoolAddressProvider: ILendingPoolAddressesProvider =
    await ethers.getContractAt(
      'ILendingPoolAddressesProvider',
      '0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5',
      account
    );
  const lendingPoolAddress = await lendingPoolAddressProvider.getLendingPool();
  const lendingPool: ILendingPool = await ethers.getContractAt(
    'ILendingPool',
    lendingPoolAddress,
    account
  );
  return lendingPool;
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
