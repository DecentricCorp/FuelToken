const ConfigurableERC20 = artifacts.require("ConfigurableERC20");
const simple = artifacts.require("simple");

module.exports = function(deployer) {
  deployer.deploy(simple)
  deployer.deploy(ConfigurableERC20, "0x102e5f644e6ed79ee2a3c221fe16d8711f028952")
  
};
