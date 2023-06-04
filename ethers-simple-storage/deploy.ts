import { ethers } from 'ethers';
import fs from 'fs-extra';

const main = async () => {
  console.log('running main');

  const provider = new ethers.providers.JsonRpcProvider( // connection to a blockchain
    'http://172.28.80.1:7545'
  );

  // Need abi, binary and wallet to set up contract factory
  const wallet = new ethers.Wallet(
    '0xa04a0ffaf287ee5d591b1f7a41c10470c4b7872ba884f980288425edfe2d43e7', // private key
    provider
  );

  // console.log('Standard way to deploy');
  const abi = fs.readFileSync('SimpleStorage_sol_SimpleStorage.abi', 'utf8');
  const binary = fs.readFileSync('SimpleStorage_sol_SimpleStorage.bin', 'utf8');
  const contractFactory = new ethers.ContractFactory(abi, binary, wallet);

  const contract: ethers.Contract = await contractFactory.deploy(); // deploying a contract is sending a transaction
  await contract.deployTransaction.wait(1); // wait for 1 block confirmation to get transaction receipt

  // console.log('Manual deploying with only transaction data');
  // const tx: ethers.providers.TransactionRequest = {
  //   nonce: await wallet.getTransactionCount(),
  //   gasPrice: ethers.BigNumber.from(1e10),
  //   gasLimit: ethers.BigNumber.from(1e6),
  //   to: '0x0000000000000000000000000000000000000000', // to is null during contract deployment
  //   value: ethers.BigNumber.from(0),
  //   data: '',
  //   chainId: 1337,
  // };
  // const sentTxRes = await wallet.sendTransaction(tx); // signing done when sending
  // await sentTxRes.wait(1);
  // console.log(sentTxRes);

  const currentFavouriteNumber: ethers.BigNumber = await contract.retrieve();
  console.log(`Favourite Number: ${currentFavouriteNumber.toString()}`);
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
