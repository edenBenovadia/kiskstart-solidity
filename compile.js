const path = require('path');
const fs = require('fs-extra');
const solc = require('solc');
 
const CampaignPath = path.resolve(__dirname, 'contracts', 'Campaign.sol');
const source = fs.readFileSync(CampaignPath, 'utf8');

const buildPath = path.resolve(__dirname, 'build');
fs.removeSync(buildPath);
 
const input = {
  language: 'Solidity',
  sources: {
    'Campaign': {
      content: source,
    },
    'CampaignFactory': {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['*'],
      },
    },
  },
};

const output = JSON.parse(
  solc.compile(
    JSON.stringify(input)
  )
).contracts;

fs.ensureDirSync(buildPath);
for (let contract in output) {
  fs.outputJSONSync(
    path.resolve(buildPath, contract + '.json'),
    output[contract][contract],
  );
}
