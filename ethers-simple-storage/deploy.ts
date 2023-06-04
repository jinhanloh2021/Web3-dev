import { ethers } from 'ethers';
import fs from 'fs-extra';
import 'dotenv/config';

const main = async () => {
  console.log('running main');

  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL); // connection to a blockchain
  const encryptedJson = fs.readFileSync('./.encryptedKey.json', 'utf8'); // must run encrypted key to get this

  // Need abi, binary and wallet to set up contract factory
  let wallet: ethers.Wallet = ethers.Wallet.fromEncryptedJsonSync(
    encryptedJson,
    process.env.PRIVATE_KEY_PASSWORD! // manually from CLI
  );
  wallet = wallet.connect(provider);

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
  console.log('Storing 3 as new favourite number...');
  const transRes = await contract.store('3');
  await transRes.wait(1);
  const updatedFavouriteNumber: ethers.BigNumber = await contract.retrieve();
  console.log(`New Fav number: ${updatedFavouriteNumber.toString()}`);
};

// Run: PRIVATE_KEY=*** PRIVATE_KEY_PASSWORD=*** ts-node encryptKey.ts
// Run: PRIVATE_KEY_PASSWORD=*** ts-node deploy.ts
main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
