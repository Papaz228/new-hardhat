// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Staking is Ownable{
    IERC20 public usdtToken;
    IERC20 public myToken;
    mapping(address => uint256) public stakedAmount;
    mapping(address => uint256) public lastStakedTime;
    uint256 public rewardRate = 10;
    uint256 public stakingPeriod = 30 days;
    uint256 public tokenPrice = 10;

    modifier notLessThanZero(uint256 value){
        require(value > 0, "Value cannot be 0 or less");
        _;
    }

    constructor(address _usdtToken, address _myToken) {
        usdtToken = IERC20(_usdtToken);
        myToken = IERC20(_myToken);
    }

    function changeTokenAndToken(address _usdtToken, address _myToken) public onlyOwner() {
        usdtToken = IERC20(_usdtToken);
        myToken = IERC20(_myToken);
    }

    function changeRewardRate(uint256 newRewardRate) public onlyOwner() notLessThanZero(newRewardRate){
        rewardRate = newRewardRate;
    }

    function changeStakingPeriod(uint256 newStakingPeriod) public onlyOwner() notLessThanZero(newStakingPeriod){
        stakingPeriod = newStakingPeriod;
    }

    function changeTokenPrice(uint256 newTokenPrice) public onlyOwner() notLessThanZero(newTokenPrice) {
        tokenPrice = newTokenPrice;
    }

    function stake(uint256 amount) public notLessThanZero(amount){
        require(myToken.balanceOf(msg.sender) >= amount, "Not enough tokens to stake");
        if (stakedAmount[msg.sender] == 0) {
            lastStakedTime[msg.sender] = block.timestamp;
        }
        myToken.transferFrom(msg.sender, address(this), amount);
        stakedAmount[msg.sender] += amount;
    }

    function stakeAfterBuy(uint256 amount) internal notLessThanZero(amount){
        if (stakedAmount[msg.sender] == 0) {
            lastStakedTime[msg.sender] = block.timestamp;
        }
        stakedAmount[msg.sender] += amount;
    }

    function buyToken(uint256 usdtAmount) public notLessThanZero(usdtAmount){
        require(usdtToken.balanceOf(msg.sender) >= usdtAmount, "Not enough USDT to buy tokens");
        usdtToken.transferFrom(msg.sender, address(this), usdtAmount);
        uint256 myTokenAmount = usdtAmount / tokenPrice;
        if(myToken.balanceOf(address(this)) < myTokenAmount){
            myToken.transferFrom(owner(), address(this), myTokenAmount);
        }
        stakeAfterBuy(myTokenAmount);
    }

    function claim() public {
        require(stakedAmount[msg.sender] > 0, "No tokens staked");
        uint256 reward = calculateReward(msg.sender);
        if (reward > 0) {
            myToken.transfer(msg.sender, reward);
        }
        lastStakedTime[msg.sender] = block.timestamp;
    }

    function withdraw() public {
        require(stakedAmount[msg.sender] > 0, "No tokens staked");
        uint256 amount = stakedAmount[msg.sender];
        stakedAmount[msg.sender] = 0;
        lastStakedTime[msg.sender] = 0;
        myToken.transfer(msg.sender, amount);
    }

    function calculateReward(address user) public view returns (uint256) {
        require(stakedAmount[user] > 0, "No tokens staked");
        uint256 stakedTime = block.timestamp - lastStakedTime[user];
        uint256 reward = stakedAmount[user] * rewardRate * stakedTime / stakingPeriod / 1e18;
        return reward;
    }

}