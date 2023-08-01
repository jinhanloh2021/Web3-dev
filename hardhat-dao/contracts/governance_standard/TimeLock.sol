// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import '@openzeppelin/contracts/governance/TimelockController.sol';

/**
 * Need to wait for new vote to be executed
 */

contract TimeLock is TimelockController {
  /**
   *
   * @param minDelay How long to wait before executing
   * @param proposers List of addresses that can propose
   * @param executors List of addresses that can execute
   */
  constructor(
    uint256 minDelay,
    address[] memory proposers, // Set in 04-setup // Proposer should only be GovernorContract
    address[] memory executors, // Anybody can execute
    address admin
  ) TimelockController(minDelay, proposers, executors, admin) {}
}
