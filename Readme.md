  ```Contract: Configurable ERC20
    Metadata
      ✓ has correct name at deploy time
      ✓ has correct symbol at deploy time
      ✓ has correct decimals at deploy time
      ✓ has updated metadata after changing (80ms)
      ✓ only owner is able to update metadata (82ms)
      ✓ owner is not able to update metadata on locked contracts (100ms)
    Transfer
      ✓ Public Transfers emit Transfer event (65ms)
      ✓ Transfers with visibility off emit no event (123ms)
    Stakability
      ✓ Base token is allowed to stake itself
      ✓ Base token can be deposited into contract (193ms)
      ✓ unable to deposit non whitelisted token (166ms)
      ✓ owner is able to whitelist token (140ms)
      ✓ owner is able to remove token from whitelist (187ms)
      ✓ non-owner is able to deposit whitelisted token (290ms)
      ✓ non-owner is unable to whitelist token (142ms)
      ✓ non-owner is unable to remove token from whitelist (167ms)
    ETH
      ✓ Sending ETH throws Received Event (45ms)
      ✓ sending ETH buys expected amount of Base token (67ms)
      ✓ sending 0 ETH fails (60ms)
    Strategies
      ✓ sending ETH distributes expected amount of eth to treasury (48ms)
      ✓ sending ETH distributes expected amount of eth to staker (167ms)
      - Can sell half of eth, receive LP tokens & add liquidity
      - Rewards stakers, based on remaining balancs: the LP tokens held by the base contract
      - Time limit / block number establishes a strategy length

```

Base Token: $Fuel

Earned @: staking pools, promotions and conversions.

Conversions: erc20 tokens can be deposited into contract that turn into $Fuel at a fixed or dynamic conversion rate.

Staking: erc20 tokens that are whitelisted by governance can be staked and instantly reflect a $Fuel balance based on the conversion rate. (1:100, 1:1, etc...)
  
  Earn: earn rewards of a portion of other tokens converted, $Fuel, and LP tokens created by conversions as well. Rewards of $Fuel will reflect in your wallet without the need to harvest.

  Withdraw: withdrawing staked tokens will return unspent and unconverted tokes to user upon withdrawal. $Fuel balance will reduce by staked amount at the defined conversion rate. Rewards, and converted fuel will remain spendable and reflected in your balance. 

  Spend: spending all or a portion of the $Fuel immediately acquired by staking will result in an equivilant portion of your deposit being converted, and otherwise non withdrawable. 

$Fuel once acquired can be deposited into the token contract to be either converted, or added to the purchase pool. $Fuel can be purchased by sending eth to the token contract. The resulting ETH will be partially distributed to participants of the purchase pool, converted into locked $Fuel lp tokens, and the treasury. 
