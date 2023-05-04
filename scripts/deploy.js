const { ethers } = require("hardhat");

async function main() {

  const [owner] = await ethers.getSigners();
  console.log("Owner address ", owner.address);

  const AlanTokenForStaking = await ethers.getContractFactory('AlanTokenForStaking');
  const alanTokenForStaking = await AlanTokenForStaking.deploy();
  await alanTokenForStaking.deployed();
  console.log("Contract AlanTokenForStaking address ", alanTokenForStaking.address);

  const USDTTokenForStaking = await ethers.getContractFactory('USDTTokenForStaking');
  const uSDTTokenForStaking = await USDTTokenForStaking.deploy();
  await uSDTTokenForStaking.deployed();
  console.log("Contract USDTTokenForStaking address ", uSDTTokenForStaking.address);

  const Staking = await ethers.getContractFactory('Staking');
  const staking = await Staking.deploy(uSDTTokenForStaking.address, alanTokenForStaking.address);
  await staking.deployed();
  console.log("Contract staking address ", staking.address);

  await hre.run("verify:verify", {
    address: alanTokenForStaking.address,
    constructorArguments: [],
  });

  await hre.run("verify:verify", {
    address: uSDTTokenForStaking.address,
    constructorArguments: [],
  });

  await hre.run("verify:verify", {
    address: staking.address,
    constructorArguments: [uSDTTokenForStaking.address, alanTokenForStaking.address],
  });

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });