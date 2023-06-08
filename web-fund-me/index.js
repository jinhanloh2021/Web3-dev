import { BigNumber, ethers } from './ethers-5.6-esm.min.js';
import { abi, fundMeAddress } from './constants.js';

const connectButton = document.getElementById('connectButton');
const fundButton = document.getElementById('fundButton');
const balanceButton = document.getElementById('balanceButton');
const withdrawButton = document.getElementById('withdrawButton');
connectButton.onclick = connect;
fundButton.onclick = fund;
balanceButton.onclick = getBalance;
withdrawButton.onclick = withdrawFunds;

console.log(ethers);

async function connect() {
  if (typeof window.ethereum !== 'undefined') {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    connectButton.innerHTML = 'Connected';
    connectButton.disabled = true;
  } else {
    connectButton.innerHTML = 'Please install metamask';
    connectButton.disabled = true;
  }
}

/**
 * @tutorial To send a transaction, we need:
 * @provider A Provider (in ethers) is a class which provides an abstraction for a connection to the Ethereum Network. It provides read-only access to the Blockchain and its status.
 * @signer A Signer is a class which (usually) in some way directly or indirectly has access to a private key, which can sign messages and transactions to authorize the network to charge your account ether to perform operations.
 * @contract A Contract is an abstraction which represents a connection to a specific contract on the Ethereum Network, so that applications can use it like a normal JavaScript object. Has ABI and address.
 */

// fund
async function fund() {
  // const ethAmount = BigNumber.from((1e10).toString()).mul(
  //   BigNumber.from(parseFloat(document.getElementById('ethAmount').value) * 1e8)
  // );
  console.log(document.getElementById('ethAmount').value);
  console.log(typeof document.getElementById('ethAmount').value);
  const ethAmount = ethers.utils.parseUnits(
    document.getElementById('ethAmount').value,
    18
  );
  console.log(`Funding with ${ethAmount.toString()}`);
  if (typeof window.ethereum !== 'undefined') {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(fundMeAddress, abi, signer);
    try {
      const transRes = await contract.fund({ value: ethAmount });
      await listenForTransactionMine(transRes, provider);
      console.log('Transaction Done');
    } catch (err) {
      console.log(err);
    }
  } else {
    console.log('Metamask is not installed');
  }
}

function listenForTransactionMine(transRes, provider) {
  console.log(`Mining ${transRes.hash}...`);
  return new Promise((resolve, reject) => {
    provider.once(transRes.hash, (transReceipt) => {
      console.log(`Completed with ${transReceipt.confirmations} confirmations`);
      resolve(); // promise is returned when resolve (or reject) is called
    });
  });
}

async function getBalance() {
  if (typeof window.ethereum != 'undefined') {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const balance = await provider.getBalance(fundMeAddress);
    console.log(ethers.utils.formatEther(balance));
  }
}

// withdraw
async function withdrawFunds() {
  if (typeof window.ethereum != 'undefined') {
    console.log('Withdrawing');
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(fundMeAddress, abi, signer);

    try {
      const transRes = await contract.withdraw();
      await listenForTransactionMine(transRes, provider);
    } catch (err) {
      console.log(err);
    }
  }
}
