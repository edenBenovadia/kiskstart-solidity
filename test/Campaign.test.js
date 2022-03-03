const assert = require('assert');
const expect = require('expect');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());
const _ = require('lodash');

const toWei = web3.utils.toWei;

const compiledFactory = require('../build/CampaignFactory.json');
const compiledCampaign = require('../build/Campaign.json');

let accounts;
let factory;
let campaignAddress;
let campaign;
let gasPrice;

const setGasPrice = async () => {
    gasPrice =  await new web3.eth.Contract(compiledFactory.abi)
    .deploy({ data: compiledFactory.evm.bytecode.object })
    .estimateGas({ from: accounts[0] });
};

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    if(!gasPrice) {
        await setGasPrice();
    }

    factory =  await new web3.eth.Contract(compiledFactory.abi)
    .deploy({ data: compiledFactory.evm.bytecode.object })
    .send({ from: accounts[0], gas: gasPrice });

    await factory.methods
    .createCampaign(toWei('0.01', 'ether'))          
    .send({ from: accounts[0], gas: gasPrice });

    [campaignAddress] = await factory.methods.getCampaigns().call({ from: accounts[0] });
    campaign = await new web3.eth.Contract(compiledCampaign.abi, campaignAddress);
})

describe('Kickstart Contracts', () => {
    describe('Factory.sol', () => {
        it('should init contract', async () => {
            expect(factory).toBeDefined();
        });

        it('should init campaign contract', async () => {
            expect(campaign).toBeDefined();
        });
    })

    describe('Campaign.sol', () => {
        beforeEach(async () => {});

        it('caller should be manager', async () => {
            const managerAddress = await campaign.methods.manager().call({from : accounts[0]});
            expect(managerAddress).toBe(accounts[0]);
        });

        it('ensure contribute works', async () => {
            await campaign.methods.contribute()
            .send({
                from : accounts[1],
                value: toWei('0.02', 'ether')
            });

            const donatorsCount = +(await campaign.methods.donatorsCount().call({from : accounts[0]}));
            const isDonator = await campaign.methods.donators(accounts[1]).call({from : accounts[0]});

            expect(isDonator).toBeTruthy();
            expect(donatorsCount).toBe(1);
        });

        it('requires minimum contribution', async () => {
            let error = undefined;
            try {
                await campaign.methods.contribute()
                .send({
                    from : accounts[1],
                    value: toWei('0.01', 'ether')
                });
            } catch (e) {
                error = e;
            }

            expect(error).toBeDefined();
        });

        it('allows manager to make payment request', async () => {
            await campaign.methods
            .createRequest('100' /*wei*/, 'payment to engineer', accounts[2])
            .send({from: accounts[0], gas: gasPrice});

            const request = await campaign.methods.requests(0).call({from: accounts[0]});
            expect(request).toBeDefined();
            expect(request.description).toBe('payment to engineer');
            expect(request.recipient).toBe(accounts[2]);
            expect(+request.value).toBe(100);
        });

        it('approve request works', async () => {
            await campaign.methods
            .createRequest(toWei('5', 'ether') /*wei*/, 'payment to engineer', accounts[2])
            .send({from: accounts[0], gas: gasPrice});

            await campaign.methods
            .contribute()
            .send({
                from : accounts[1],
                value: toWei('5', 'ether')
            });
            
            await campaign.methods
            .approveRequest(0)
            .send({ 
                from : accounts[1],
                gas: gasPrice,
            });
                        
            const hasApproved = await campaign.methods.approvers(0, accounts[1]).call({from: accounts[0]});
            expect(hasApproved).toBeTruthy();
            
            await campaign.methods
            .finalizeRequest(0)
            .send({ 
                from : accounts[0],
                gas: gasPrice 
            });
            
            let balance = await web3.eth.getBalance(accounts[2]);
            balance = web3.utils.fromWei(balance, 'ether');
            balance = parseFloat(balance);

            expect(balance).toBeGreaterThan(104)
        });
    })
});
