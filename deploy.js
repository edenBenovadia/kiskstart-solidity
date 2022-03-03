const HDWalletProvider = require('@truffle/hdwallet-provider');
const Web3 = require('web3');

const compiledFactory = require('./build/CampaignFactory.json');
const { evm, abi } = compiledFactory;

const provider = new HDWalletProvider(
  'soup assault cross van beyond assist practice barely thing cloth trap rug',
  'https://rinkeby.infura.io/v3/15c1d32581894b88a92d8d9e519e476c'
);

const web3 = new Web3(provider);

const deploy = async () => {
  const accounts = await web3.eth.getAccounts();

  console.log('Attempting to deploy from account', accounts[0]);
  
  const gasLimit = await new web3.eth.Contract(abi)
    .deploy({ data: evm.bytecode.object })
    .estimateGas({ from: accounts[0] });
  
  const result = await new web3.eth.Contract(abi)
    .deploy({ data: evm.bytecode.object })
    .send({ gas: gasLimit, from: accounts[0] });

  console.log(JSON.stringify(abi));
  console.log('Contract deployed to', result.options.address);
  provider.engine.stop();
};
deploy();
