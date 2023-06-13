import pinataSDK from '@pinata/sdk';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';

const pinata = new pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_API_SECRET
);

export type iMetadata = {
  name: string;
  description: string;
  image: string;
  attributes?: [
    {
      trait_types: string;
      value: number;
    }
  ];
};
export const storeImages = async (imagesFilePath: string) => {
  // ./images/randomNft -> absolute file path
  const fullImagesPath = path.resolve(imagesFilePath);
  const files = fs.readdirSync(fullImagesPath);
  let responses = [];
  console.log(`Uploading images to IPFS...`);
  for (const fileIndex in files) {
    const readableStreamForFile = fs.createReadStream(
      `${fullImagesPath}/${files[fileIndex]}`
    );
    const options = {
      pinataMetadata: {
        name: files[fileIndex],
      },
    };
    try {
      // Pinata stuff
      const res = await pinata.pinFileToIPFS(readableStreamForFile, options);
      responses.push(res);
      console.log(`File: ${files[fileIndex]} uploaded...`);
    } catch (e) {
      console.error(e);
    }
  }
  return { responses, files };
};

export const storeTokenUriMetadata = async (metadata: iMetadata) => {
  try {
    const res = await pinata.pinJSONToIPFS(metadata);
    return res;
  } catch (e) {
    console.error(e);
  }
  return null;
};
