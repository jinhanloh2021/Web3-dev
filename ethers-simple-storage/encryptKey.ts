import { ethers } from 'ethers';
import fs from 'fs-extra';
import 'dotenv/config';

const main = async () => {
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!);
  const encryptedKey = await wallet.encrypt(process.env.PRIVATE_KEY_PASSWORD!);
  console.log(encryptedKey);
  fs.writeFileSync('./.encryptedKey.json', encryptedKey);
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
