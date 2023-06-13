import { run } from 'hardhat';

export default async (contractAddress: string, args: any[]) => {
  try {
    await run('verify:verify', {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (e: any) {
    if (e.message.toLowerCase().includes('already verified')) {
      console.log(`Contract ${contractAddress} already verified`);
    } else {
      console.error(e);
    }
  }
};
