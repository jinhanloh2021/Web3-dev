const main = async () => {
    //protocol treats everything as ERC20. Need to wrap ETH to Wrapped ETH WETH.
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
