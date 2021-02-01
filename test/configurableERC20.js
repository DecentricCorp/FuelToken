const ConfigurableERC20 = artifacts.require("ConfigurableERC20")
const simple = artifacts.require("simple")
const truffleAssert = require('truffle-assertions')
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:9545'));
let Token
async function getToken() {
  return await ConfigurableERC20.deployed()
}
async function getSimpleToken() {
  return await simple.deployed()
}

contract('Configurable ERC20', (accounts) => {
  const fromOwner = { from: accounts[0] }
  const fromUser1 = { from: accounts[1] }
  const fromUser2 = { from: accounts[2] }

  beforeEach(async () => {
    Token = await ConfigurableERC20.new(accounts[3], fromOwner);
  });
  
  describe('Metadata', () => {
    
    it('has correct name at deploy time', async () => {
      let name = await Token.name.call()
      assert.equal(name, "$Fuel")
    })

    it('has correct symbol at deploy time', async () => {
      let symbol = await Token.symbol.call()
      assert.equal(symbol, "FUEL")
    })

    it('has correct decimals at deploy time', async () => {
      let decimals = await Token.decimals.call()
      assert.equal(decimals, 18)
    })

    it('has updated metadata after changing', async () => {
      await Token.changeContractDetails('New Name', 'NEW', 8, fromOwner)
      let name = await Token.name.call()
      let symbol = await Token.symbol.call()
      let decimals = await Token.decimals.call()
      assert.equal(name, "New Name")
      assert.equal(symbol, "NEW")
      assert.equal(decimals, 8)
    })

    it('only owner is able to update metadata', async () => {
      await truffleAssert.fails(Token.changeContractDetails('.', '.', 8, fromUser1))
      await truffleAssert.passes(Token.changeContractDetails('.', '.', 8, fromOwner))
    })

    it('owner is not able to update metadata on locked contracts', async () => {
      await Token.lockTemporarily(fromOwner)
      await truffleAssert.fails(Token.changeContractDetails('.', '.', 8, fromOwner))
      await Token.unLock(fromOwner)
    })

  })

  describe('Governance', ()=>{

  })

  describe('Transfer', ()=>{
    it('Public Transfers emit Transfer event', async () => {
      await Token.mint(accounts[0], 10000, fromOwner)
      let result = await Token.transfer(Token.address, 10000, fromOwner)
      truffleAssert.eventEmitted(result, 'Transfer')
    })
    it('Transfers with visibility off emit no event', async () => {
      await Token.mint(accounts[0], 10000, fromOwner)
      await Token.toggleVisibility(fromOwner)
      let result = await Token.transfer(Token.address, 10000, fromOwner)
      truffleAssert.eventNotEmitted(result, 'Transfer')
      await Token.toggleVisibility(fromOwner)
    })
  })

  describe('Stakability', ()=>{
    it('Base token is allowed to stake itself', async ()=>{
      assert.isTrue(await Token.isTokenStakable(Token.address))
    })
    it('Base token can be deposited into contract', async ()=>{
      let amount = web3.utils.toBN('1111000000000000000000')
      assert((await Token.getTotalStaked(Token.address)).toNumber() === 0)
      await Token.mint(accounts[0], amount, fromOwner)
      await Token.approve(Token.address, amount + 1, fromOwner)
      
      assert((await Token.balanceOf(Token.address)).toString() === '0')
      await Token.stake(Token.address, amount, fromOwner)
      assert((await Token.balanceOf(Token.address)).toString() === amount.toString())
      assert((await Token.balanceOf(accounts[0])).toNumber() === 0)
      assert((await Token.stakedBalance(Token.address)).toString() === amount.toString())
      assert((await Token.getTotalStaked(Token.address)).toString() === amount.toString())
    })
    it('unable to deposit non whitelisted token', async ()=>{
      const Simple = await getSimpleToken()
      await Simple.approve(Token.address, 100000, fromOwner)
      await truffleAssert.fails(Token.stake(Simple.address, 10000, fromOwner))
    })
    it('owner is able to whitelist token', async ()=>{
      const Simple = await getSimpleToken()
      await Token.addStakableToken(Simple.address, fromOwner)
      assert.isTrue(await Token.isTokenStakable(Simple.address))
    })
    it('owner is able to remove token from whitelist', async ()=>{
      const Simple = await getSimpleToken()
      await Token.addStakableToken(Simple.address, fromOwner)
      await Token.isTokenStakable(Simple.address)
      await truffleAssert.passes(Token.removeStakableToken(Simple.address, fromOwner))
      assert.isFalse(await Token.isTokenStakable(Simple.address))
    })
    it('non-owner is able to deposit whitelisted token', async ()=>{
      const Simple = await getSimpleToken()
      await Simple.transfer(accounts[1], 100000, fromOwner)
      await Simple.approve(Token.address, 100001, fromUser1)
      Token.addStakableToken(Simple.address, fromOwner)
      await truffleAssert.passes(Token.stake(Simple.address, 100000, fromUser1))
    })
    it('non-owner is unable to whitelist token', async ()=>{
      const Simple = await getSimpleToken()
      await truffleAssert.reverts(Token.addStakableToken(Simple.address, fromUser1))
    })
    it('non-owner is unable to remove token from whitelist', async ()=>{
      const Simple = await getSimpleToken()
      await Token.addStakableToken(Simple.address, fromOwner)
      await truffleAssert.reverts(Token.removeStakableToken(Simple.address, fromUser1))
    })
  })
  describe('ETH', ()=>{
    it('Sending ETH throws Received Event', async ()=>{    
      await Token.sendTransaction({from: accounts[0],value: 1000000000000000000}).then(function(result) {
        truffleAssert.eventEmitted(result, 'Received')        
      })
    })
    it('sending ETH buys expected amount of Base token', async ()=>{
      assert.equal((await Token.balanceOf(accounts[0])).toString(), '0')
      let result = await Token.sendTransaction({from: accounts[0],value: 1000000000000000000})
      assert.equal((await Token.balanceOf(accounts[0])).toString(), '1111000000000000000000')
      // truffleAssert.prettyPrintEmittedEvents(result)
    })
    it('sending 0 ETH fails', async ()=>{
      assert.equal((await Token.balanceOf(accounts[0])).toString(), '0')
      await truffleAssert.reverts(Token.sendTransaction({from: accounts[0],value: 0}))
    })
  })
  describe('Strategies', ()=>{
    it('sending ETH distributes expected amount of eth to treasury', async ()=>{
      let oldTreasuryEthBalance = await web3.eth.getBalance(accounts[3])
      await Token.sendTransaction({from: accounts[0],value: 1000000000000000000})
      let treasuryEthBalance = await web3.eth.getBalance(accounts[3])
      assert.isTrue(Number(treasuryEthBalance) == Number(oldTreasuryEthBalance) + 100000000000000000)
    })
    it('sending ETH distributes expected amount of eth to staker with 100% of pool', async ()=>{
      let amount = web3.utils.toBN('1111000000000000000000')
      await Token.mint(accounts[1], amount, fromOwner)
      await Token.approve(Token.address, amount + 1, fromUser1)
      await Token.stake(Token.address, amount, fromUser1)
      let oldEthBalance = await web3.eth.getBalance(accounts[1])
      await Token.sendTransaction({from: accounts[0],value: 1000000000000000000})
      let ethBalance = await web3.eth.getBalance(accounts[1])
      assert.isTrue(Number(ethBalance) == Number(oldEthBalance) + 900000000000000000)
    })
    it('sending ETH distributes expected amount of eth to both stakers owning 50% of the pool', async ()=>{
      let amount = web3.utils.toBN('1111000000000000000000')
      await Token.mint(accounts[1], amount, fromOwner)
      await Token.mint(accounts[2], amount, fromOwner)
      await Token.approve(Token.address, amount + 1, fromUser1)
      await Token.approve(Token.address, amount + 1, fromUser2)
      await Token.stake(Token.address, amount, fromUser1)
      await Token.stake(Token.address, amount, fromUser2)
      let oldUser1Balance = await web3.eth.getBalance(accounts[1])
      let oldUser2Balance = await web3.eth.getBalance(accounts[2])
      let result = await Token.sendTransaction({from: accounts[0],value: 1000000000000000000})
      let user1Balance = await web3.eth.getBalance(accounts[1])
      let user2Balance = await web3.eth.getBalance(accounts[2])
      assert.isTrue(Number(user1Balance) == Number(oldUser1Balance) + 450000000000000000)
      assert.isTrue(Number(user2Balance) == Number(oldUser2Balance) + 450000000000000000)
      // truffleAssert.prettyPrintEmittedEvents(result)
    })
    it('Can sell half of eth, receive LP tokens & add liquidity')
    it('Rewards stakers, based on remaining balancs: the LP tokens held by the base contract')
    it('Time limit / block number establishes a strategy length')
  })
})
