// SPDX-License-Identifier: MIT
// Pragma
pragma solidity ^0.8.0;

// Imports
import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';
import './PriceConverter.sol';

// Error codes
error FundMe__NotOwner();
error FundMe__NotEnoughFunds();
error FundMe__WithdrawError();

/**
 * @title A contract for crows funding
 * @author Jin Han
 * @notice This contract is to demo a sample funding contract
 * @dev This implements price feeds as our library
 */
contract FundMe {
  // Type declarations
  using PriceConverter for uint256;

  // State variables
  mapping(address => uint256) private s_addressToAmountFunded;
  address[] private s_funders;
  address private immutable i_owner;
  AggregatorV3Interface private s_priceFeed;
  uint256 public constant MINIMUM_USD = 5e19;

  modifier onlyOwner() {
    // require(msg.sender == owner);
    if (msg.sender != i_owner) revert FundMe__NotOwner();
    _;
  }

  constructor(address _priceFeed) {
    s_priceFeed = AggregatorV3Interface(_priceFeed);
    i_owner = msg.sender;
  }

  receive() external payable {
    fund();
  }

  fallback() external payable {
    fund();
  }

  /**
   * @notice This function funds this contract
   * @dev This implements price feeds as our library
   */
  function fund() public payable {
    if (msg.value.getConversionRate(s_priceFeed) < MINIMUM_USD) {
      revert FundMe__NotEnoughFunds();
    } // reverts cost less gas than require
    s_addressToAmountFunded[msg.sender] += msg.value;
    s_funders.push(msg.sender);
  }

  function withdraw() public payable onlyOwner {
    payable(msg.sender).transfer(address(this).balance);
    for (
      uint256 funderIndex = 0;
      funderIndex < s_funders.length;
      funderIndex++
    ) {
      address funder = s_funders[funderIndex];
      s_addressToAmountFunded[funder] = 0;
    }
    s_funders = new address[](0);
  }

  function cheaperWithdraw() public payable onlyOwner {
    address[] memory funders = s_funders; //save storage var into memory
    for (uint256 funderIndex = 0; funderIndex < funders.length; funderIndex++) {
      address funder = funders[funderIndex];
      s_addressToAmountFunded[funder] = 0;
    }
    s_funders = new address[](0);
    (bool success, ) = i_owner.call{value: address(this).balance}('');
    if (!success) {
      revert FundMe__WithdrawError();
    }
  }

  function getOwner() public view returns (address) {
    return i_owner;
  }

  function getFunder(uint256 _index) public view returns (address) {
    return s_funders[_index];
  }

  function getAddressToAmountFunded(
    address funder
  ) public view returns (uint256) {
    return s_addressToAmountFunded[funder];
  }

  function getPriceFeed() public view returns (AggregatorV3Interface) {
    return s_priceFeed;
  }
}
