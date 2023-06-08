// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

// Enter the lottery (paying some amount)
// Pick a random winner (verifiably random)
// Winner to be selected every X minutes -> completely automated
// Chainlink Oracle -> VRF, Automated Execution with Chainlink Keepers


error Raffle__NotEnoughEthEntered();

contract Raffle {
    /** State variables */
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;

    /** Events */
    event RaffleEnter(address indexed player);

    constructor(uint256 _entranceFee) {
        i_entranceFee = _entranceFee;
    }

    function enterRaffle() public payable{
        if (msg.value < i_entranceFee) {
            revert Raffle__NotEnoughEthEntered();
        }
        s_players.push(payable(msg.sender));
        // Emit an event when we update a dynamic array or mapping
        emit RaffleEnter(msg.sender);
    }

    // function pickRandomWinner() {}

    function getEntranceFee() public view returns(uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }
}