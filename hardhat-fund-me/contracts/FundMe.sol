// SPDX-License-Identifier: MIT
// Pragma
pragma solidity ^0.8.0;

// Imports
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

// Error codes
error FundMe__NotOwner();

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
  mapping(address => uint256) public addressToAmountFunded;
  address[] public s_funders;
  address public owner;
  AggregatorV3Interface public priceFeed;

  modifier onlyOwner() {
    // require(msg.sender == owner);
    if(msg.sender != owner) revert FundMe__NotOwner();
    _;
  }
  /**
   * Functions order:
   * constructor
   * receive
   * fallback
   * external
   * public
   * internal
   * private
   * view/pure
   */

  constructor(address _priceFeed) {
    priceFeed = AggregatorV3Interface(_priceFeed);
    owner = msg.sender;
  }

  receive() external payable{
    fund();
  }

  fallback() external payable{
    fund();
  }

  /**
   * @notice This function funds this contract
   * @dev This implements price feeds as our library
   */
  function fund() public payable {
    uint256 minimumUSD = 50 * 10**18;
    require(
      msg.value.getConversionRate(priceFeed) >= minimumUSD,
      "You need to spend more ETH!"
    );
    // require(PriceConverter.getConversionRate(msg.value) >= minimumUSD, "You need to spend more ETH!");
    addressToAmountFunded[msg.sender] += msg.value;
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
      addressToAmountFunded[funder] = 0;
    }
    s_funders = new address[](0);
  }

  function cheaperWithdraw() public payable onlyOwner {
    payable(msg.sender).transfer(address(this).balance);
    address[] memory funders = s_funders;
    // mappings can't be in memory, sorry!
    for (uint256 funderIndex = 0; funderIndex < funders.length; funderIndex++) {
      address funder = funders[funderIndex];
      addressToAmountFunded[funder] = 0;
    }
    s_funders = new address[](0);
  }
}