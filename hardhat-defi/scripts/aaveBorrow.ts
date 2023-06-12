import { ethers, getNamedAccounts } from 'hardhat';
import getWeth, { AMOUNT_TO_SPEND } from '../scripts/getWeth';
import {
  AggregatorV3Interface,
  IERC20,
  ILendingPool,
  ILendingPoolAddressesProvider,
} from '../typechain-types';
import { BigNumber } from 'ethers';
const main = async () => {
  //protocol treats everything as ERC20. Need to wrap ETH to Wrapped ETH WETH.
  await getWeth();
  const { deployer } = await getNamedAccounts();
  // abi, address
  // Lending pool address provider: 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
  // Lending pool
  const lendingPool = await getLendingPool(deployer);
  console.log(`LendingPool addres: ${lendingPool.address}`);

  // Deposit
  const wethTokenAddress: string = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
  //approve
  await approveERC20(
    wethTokenAddress,
    lendingPool.address,
    AMOUNT_TO_SPEND,
    deployer
  );
  console.log(`Depositing ${AMOUNT_TO_SPEND} WETH`);
  await lendingPool.deposit(wethTokenAddress, AMOUNT_TO_SPEND, deployer, 0);
  console.log(`Deposited`);

  //Borrow
  // how much we have borrowed, how much we have in collateral, how much we can borrow
  let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(
    lendingPool,
    deployer
  );

  const daiPrice = await getDAIPrice();
  const amountDaiToBorrow = availableBorrowsETH.div(daiPrice);
  const amountDaiToBorrowWei = ethers.utils.parseEther(
    amountDaiToBorrow.toString()
  );
  console.log(`Amount available for borrow: ${amountDaiToBorrow}`);

  await borrowDAI(
    '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    lendingPool,
    amountDaiToBorrowWei,
    deployer
  );

  await getBorrowUserData(lendingPool, deployer);
  await repay(
    amountDaiToBorrowWei,
    '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    lendingPool,
    deployer
  );
  await getBorrowUserData(lendingPool, deployer);
};

const repay = async (
  amount: BigNumber,
  DAIAddress: string,
  lendingPool: ILendingPool,
  account: string
) => {
  await approveERC20(DAIAddress, lendingPool.address, amount, account);
  const repayTx = await lendingPool.repay(DAIAddress, amount, 1, account);
  await repayTx.wait(1);
  console.log(`Repaid ${amount}`);
};

const borrowDAI = async (
  DAIAddress: string,
  lendingPool: ILendingPool,
  amountDAIToBorrowWei: BigNumber,
  account: string
) => {
  console.log('Borrowing...');
  const borrowTx = await lendingPool.borrow(
    DAIAddress,
    amountDAIToBorrowWei,
    1,
    0,
    account
  );
  await borrowTx.wait(1);
  console.log(`Borrowed amount: ${amountDAIToBorrowWei}`);
};

const getDAIPrice = async (): Promise<BigNumber> => {
  // just reading from this contract. We don't need signer if not sending any transactions
  const DAIETHPriceFeed: AggregatorV3Interface = await ethers.getContractAt(
    'AggregatorV3Interface',
    '0x773616E4d11A78F511299002da57A0a94577F1f4'
  );
  const price = (await DAIETHPriceFeed.latestRoundData())[1];
  console.log(`DAI / ETH price: ${price.toString()}`);
  return price;
};

const getBorrowUserData = async (
  lendingPool: ILendingPool,
  account: string
) => {
  console.log(`Borrowing from lending pool ${lendingPool.address}`);
  const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
    await lendingPool.getUserAccountData(account);
  console.log(
    `Total collateral: ${totalCollateralETH.toString()}\nTotal debt: ${totalDebtETH.toString()}\nTotal available borrows: ${availableBorrowsETH.toString()}`
  );
  return { availableBorrowsETH, totalDebtETH };
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

const approveERC20 = async (
  ERC20Address: string,
  spenderAddress: string,
  amountToSpend: BigNumber,
  account: string
) => {
  const ERC20Token: IERC20 = await ethers.getContractAt(
    'IERC20',
    ERC20Address,
    account
  );
  const tx = await ERC20Token.approve(spenderAddress, amountToSpend);
  await tx.wait(1);
  console.log(`Approved IERC20 ${ERC20Address}`);
};
main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
