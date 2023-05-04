const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

describe("Staking", function () {
  async function stakingFixture() {
    [owner, user1, user2] = await ethers.getSigners();

    const UsdtToken = await ethers.getContractFactory("USDTTokenForStaking");
    let usdtToken = await UsdtToken.connect(owner).deploy();
    await usdtToken.deployed();

    const MyToken = await ethers.getContractFactory("AlanTokenForStaking");
    let myToken = await MyToken.connect(owner).deploy();
    await myToken.deployed();

    const Staking = await ethers.getContractFactory("Staking");
    let stakingContract = await Staking.connect(owner).deploy(
      usdtToken.address,
      myToken.address
    );
    await stakingContract.deployed();

    await usdtToken.connect(owner).mint(user1.address, 1000);
    await usdtToken.connect(owner).mint(user2.address, 2000);
    

    await myToken.connect(owner).mint(user1.address, 1000);
    await myToken.connect(owner).mint(user2.address, 2000);
    await myToken.connect(owner).approve(stakingContract.address, 10000)
    return {usdtToken, myToken, stakingContract, owner, user1, user2}
  }

  it("should buy tokens correctly", async function () {
    const {usdtToken, stakingContract, myToken, user1, user2} = await loadFixture(stakingFixture);
    await usdtToken.connect(user1).approve(stakingContract.address, 100);
    await stakingContract.connect(user1).buyToken(100);

    expect(await usdtToken.balanceOf(user1.address)).to.equal(900);
    expect(await myToken.balanceOf(stakingContract.address)).to.equal(10);

    await usdtToken.connect(user2).approve(stakingContract.address, 200);
    await stakingContract.connect(user2).buyToken(200);

    expect(await usdtToken.balanceOf(user2.address)).to.equal(1800);
    expect(await myToken.balanceOf(stakingContract.address)).to.equal(30);
  });

  it("should stake tokens correctly", async function () {
    const { myToken, stakingContract, user1, user2} = await loadFixture(stakingFixture);

    await myToken.connect(user1).approve(stakingContract.address, 100);
    await stakingContract.connect(user1).stake(100);

    expect(await myToken.balanceOf(stakingContract.address)).to.equal(100);
    expect(await myToken.balanceOf(user1.address)).to.equal(900);
    expect(await stakingContract.stakedAmount(user1.address)).to.equal(100);

    await myToken.connect(user2).approve(stakingContract.address, 200);
    await stakingContract.connect(user2).stake(200);

    expect(await myToken.balanceOf(stakingContract.address)).to.equal(300);
    expect(await myToken.balanceOf(user2.address)).to.equal(1800);
    expect(await stakingContract.stakedAmount(user2.address)).to.equal(200);
  });

  it("should withdraw tokens correctly", async function () {
    const { myToken, stakingContract, user1} = await loadFixture(stakingFixture);

    await myToken.connect(user1).approve(stakingContract.address, 100);
    await stakingContract.connect(user1).stake(100);

    expect(await myToken.balanceOf(stakingContract.address)).to.equal(100);
    expect(await myToken.balanceOf(user1.address)).to.equal(900);

    await stakingContract.connect(user1).withdraw();
    expect(await myToken.balanceOf(user1.address)).to.equal(1000);
    expect(await myToken.balanceOf(stakingContract.address)).to.equal(0);
  });

  it("should claim rewards", async function() {
    const { myToken, usdtToken, stakingContract, user1} = await loadFixture(stakingFixture);
    await usdtToken.connect(user1).approve(stakingContract.address, 100);
    await stakingContract.connect(user1).buyToken(100);

    const reward = await stakingContract.connect(user1).calculateReward(user1.address);
    await stakingContract.connect(user1).claim();
    expect(await myToken.balanceOf(user1.address)).to.equal(100 + reward);
  });
});
