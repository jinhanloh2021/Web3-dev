// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';

/** Owned by the DAO (GovernanceContract Account) */
contract Box is Ownable {
  /** State variables */
  uint256 private s_value;

  /**
   * @dev emmited when stored value changes
   */
  event ValueChanged(uint256 newValue);

  /**
   * @param _newValue the new value
   * @notice emits the Value Changed event, only owner can call
   * which is the DAO only can call this function
   */
  function store(uint256 _newValue) public onlyOwner {
    s_value = _newValue;
    emit ValueChanged(_newValue);
  }

  /** View/Pure functions */

  function retrieve() public view returns (uint256) {
    return s_value;
  }
}
