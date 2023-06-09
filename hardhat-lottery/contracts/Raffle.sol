// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

// Enter the lottery (paying some amount)
// Pick a random winner (verifiably random)
// Winner to be selected every X minutes -> completely automated
// Chainlink Oracle -> VRF, Automated Execution with Chainlink Keepers

error Raffle__NotEnoughEthEntered();
error Raffle__TransferFailed();
error Raffle__NotOpen();
error Raffle__UpkeepNotNeeded(uint256 currentBalance, uint256 numPlayers, uint256 raffleState);

/**
 * @title A sample raffle contract
 * @author Jin
 * @notice This contract is for creating an untamperable decentralised lottery
 * @dev This implements chainlink VRFv2 and chainlink keepers
 */

contract Raffle is VRFConsumerBaseV2, KeeperCompatibleInterface{ // need VRF and Keeper, hence extend these two contracts
    /** Type declarations */
    enum RaffleState {
        /** Behind the scenes, it is uint256 0 = Open, 1 = Calculating */
        OPEN,
        CALCULATING
    }

    /** State variables */
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint8 private constant REQUEST_CONFIRMATIONS = 3;
    uint8 private constant NUM_WORDS = 1;

    /** Lottery variables */
    address private s_recentWinner;
    RaffleState private s_raffleState;
    uint256 private s_lastTimeStamp;
    uint256 private immutable i_interval;

    /** Events */
    event RaffleEnter(address indexed player);
    event RequestedRaffleWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed winner);

    /** Functions */

    /**
     * @notice Constructor inherits VRFConsumerBaseV2
     * @param _vrfCoordinatorV2 - coordinator, check https://docs.chain.link/docs/vrf-contracts/#configurations
     * @param _entranceFee - fee for participating in the lottery
     * @param _gasLane - the gas lane to use, which specifies the maximum gas price to bump to
     * @param _subscriptionId - the subscription ID that this contract uses for funding requests
     * @param _callbackGasLimit - gas limit for callback in fulfillRandomWords()
     * @param _interval - time interval between each lottery winner
     */
    constructor(address _vrfCoordinatorV2 /** contract */, uint256 _entranceFee, bytes32 _gasLane, uint64 _subscriptionId, uint32 _callbackGasLimit, uint256 _interval) VRFConsumerBaseV2(_vrfCoordinatorV2){
        i_entranceFee = _entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinatorV2);
        i_gasLane = _gasLane;
        i_subscriptionId = _subscriptionId;
        i_callbackGasLimit = _callbackGasLimit;
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_interval = _interval;
    }

    function enterRaffle() public payable{
        if (msg.value < i_entranceFee) {
            revert Raffle__NotEnoughEthEntered();
        }
        if (s_raffleState != RaffleState.OPEN) {
            revert Raffle__NotOpen();
        }
        s_players.push(payable(msg.sender));
        // Emit an event when we update a dynamic array or mapping
        emit RaffleEnter(msg.sender);
    }

    /**
     * @notice checkUpKeep and performUpkeep overrides virtual functions in KeeperCompatibleInterface
     * @dev This is the function that the chainlink keeper nodes call
     * They look for the `upKeepNeeded` to return true
     * The following should be true in order to return true
     * 1. Our time interval should have passed
     * 2. Lottery should have at least 1 player and have some ETH
     * 3. Our subscription is funded with Link
     * 4. Lottery should be in an open state
     */
    function checkUpkeep(bytes memory /** checkdata */) public override returns (bool upkeepNeeded, bytes memory /** perform data */){
        bool isOpen = RaffleState.OPEN == s_raffleState;
        bool timePassed = (block.timestamp - s_lastTimeStamp) > i_interval; // check time interval has passed
        bool hasPlayers = s_players.length > 0;
        bool hasBalance = address(this).balance > 0;

        upkeepNeeded = (isOpen && timePassed && hasPlayers && hasBalance);
        return (upkeepNeeded, "0x0");
    }

    /**
     * @notice Checks if all conditions met, then requests randomness. Also known as requestRandomWords()
     */
    function performUpkeep(bytes calldata /** performData */) external override{
        // Request random number - 2 step process
        // Do something with number
        (bool upkeepNeeded, ) = checkUpkeep("");
        if(!upkeepNeeded) {
            revert Raffle__UpkeepNotNeeded(address(this).balance, s_players.length, uint256(s_raffleState));
        }
        s_raffleState = RaffleState.CALCULATING;
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        emit RequestedRaffleWinner(requestId);
    }

    /**
     * @notice Has access to the random number. Proceeds with selecting winner, paying out and contract state
     * @param randomWords - first element is verifiably random number that was requested
     */
    function fulfillRandomWords(uint256, uint256[] memory randomWords) internal override {
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        s_raffleState = RaffleState.OPEN;
        s_players = new address payable[](0); // reset raffle state
        s_lastTimeStamp = block.timestamp;

        (bool success, ) = recentWinner.call{value: address(this).balance }("");
        if(!success) {
            revert Raffle__TransferFailed();
        }
        emit WinnerPicked(recentWinner);
    }

    /** View/Pure functions */
    function getEntranceFee() public view returns(uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getRaffleState() public view returns (RaffleState) {
        return s_raffleState;
    }

    function getNumWords() public pure returns (uint8) {
        return NUM_WORDS; // reads from bytecode, not storage, so pure function
    }

    function getNumPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getLatestTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getRequestConfirmations() public pure returns (uint8) {
        return REQUEST_CONFIRMATIONS;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }
}