// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import '@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol';
import '@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

error RandomIpfsNft__RangeOutOfBounds();
error RandomIpfsNft__NotEnoughETHSent();
error RandomIpfsNft__WithdrawFailed();

contract RandomIpfsNft is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
  /**
   * @title Generate NFT randomly
   * @author Jin
   * @notice When mint, request VRF from chainlink. When fulfil and get random number, use it to get a random NFT. Different rarity for different NFT. Users have to pay to mint. Owner of contract can withdraw ETH.
   */
  enum Breed {
    PUG,
    SHIBA_INU,
    ST_BERNARD
  }

  // VRF Variables
  VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
  uint64 private immutable i_subscriptionId;
  bytes32 private immutable i_gasLane;
  uint32 private immutable i_callbackGasLimit;
  uint16 private constant REQUEST_CONFIRMATIONS = 3;
  uint32 private constant NUM_WORDS = 1;

  // VRF Helpers
  mapping(uint256 => address) public s_requestIdToSender;

  // NFT Variables
  uint256 public s_tokenCounter;
  uint256 internal constant MAX_CHANCE_VALUE = 100;
  string[] internal s_dogTokenUris;
  uint256 internal i_mintFee;

  // Events
  event NftRequested(uint256 indexed requestId, address requester);
  event NftMinted(Breed dogBreed, address minter);

  constructor(
    address _vrfCoordinator,
    uint64 _subscriptionId,
    bytes32 _gasLane,
    uint32 _callbackGasLimit,
    string[3] memory _dogTokenUris,
    uint256 _mintFee
  ) VRFConsumerBaseV2(_vrfCoordinator) ERC721('RandomIpfsNft', 'RIN') {
    i_vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
    i_subscriptionId = _subscriptionId;
    i_gasLane = _gasLane;
    i_callbackGasLimit = _callbackGasLimit;
    s_dogTokenUris = _dogTokenUris;
    i_mintFee = _mintFee;
  }

  function requestNft() public payable returns (uint256 requestId) {
    if (msg.value < i_mintFee) {
      revert RandomIpfsNft__NotEnoughETHSent();
    }
    requestId = i_vrfCoordinator.requestRandomWords(
      i_gasLane,
      i_subscriptionId,
      REQUEST_CONFIRMATIONS,
      i_callbackGasLimit,
      NUM_WORDS
    );
    s_requestIdToSender[requestId] = msg.sender;
    emit NftRequested(requestId, msg.sender);
  }

  function fulfillRandomWords(
    uint256 requestId,
    uint256[] memory randomWords
  ) internal override {
    address dogOwner = s_requestIdToSender[requestId];
    uint256 newTokenId = s_tokenCounter;

    uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE;
    Breed dogBreed = getBreedFromModdedRng(moddedRng);
    _safeMint(dogOwner, newTokenId);
    _setTokenURI(newTokenId, s_dogTokenUris[uint256(dogBreed)]);
    s_tokenCounter++;
    emit NftMinted(dogBreed, dogOwner);
  }

  function withdraw() public onlyOwner {
    uint256 amount = address(this).balance;
    (bool success, ) = payable(msg.sender).call{value: amount}('');
    if (!success) {
      revert RandomIpfsNft__WithdrawFailed();
    }
  }

  function getBreedFromModdedRng(
    uint256 moddedRng
  ) public pure returns (Breed) {
    uint256[3] memory chanceArray = getChanceArray();
    for (uint256 i = 0; i < chanceArray.length; i++) {
      uint256 lowerBound = i - 1 < 0 ? 0 : chanceArray[i - 1];
      uint256 upperBound = chanceArray[i];
      if (moddedRng >= lowerBound && moddedRng < upperBound) {
        return Breed(i);
      }
    }
    revert RandomIpfsNft__RangeOutOfBounds();
  }

  function getChanceArray() public pure returns (uint256[3] memory) {
    return [10, 30, MAX_CHANCE_VALUE];
  }

  function getMintFee() public view returns (uint256) {
    return i_mintFee;
  }

  function getDogTokenUris(uint256 index) public view returns (string memory) {
    return s_dogTokenUris[index];
  }

  function getTokenCounter() public view returns (uint256) {
    return s_tokenCounter;
  }
}
