// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./PlayerNFT.sol";

contract GameContract is Initializable, OwnableUpgradeable, ERC721HolderUpgradeable, ReentrancyGuardUpgradeable {

  /// @dev game duration time after 2nd player join
  uint256 public gameDuration;

  /// @dev game data structure
  struct Game {
    address firstPlayer;
    uint256 firstTokenId;
    address secondPlayer;
    uint256 secondTokenId;
    address creator;
    uint256 finishAt;
  }

  /// @dev game array
  mapping(uint256 => Game) games;

  /// @dev last game index
  uint256 public lastGameId;

  /// @dev nft contract
  PlayerNFT private playerNFTContract;

  event GameCreated(uint256 indexed gameId, address indexed creator, uint256 createdAt);
  event PlayerJoined(uint256 indexed gameId, address indexed player, uint256 indexed tokenId, uint256 playerIndex);
  event GameFinished(uint256 indexed gameId, address indexed winner, uint256 indexed tokenId, uint256 finishedAt);

  function initialize(
    PlayerNFT _nftContractAddress
  ) public initializer {
    __Ownable_init();
    __ERC721Holder_init();


    gameDuration = 3600 * 1000;   // 1 hour
    lastGameId = 0;
    playerNFTContract = _nftContractAddress;
  }

  /**
   * @dev create new game by any user
   */
  function createGame() external {
    Game storage newGame = games[lastGameId + 1];
    newGame.creator = msg.sender;
    lastGameId++;

    emit GameCreated(lastGameId, msg.sender, block.timestamp);
  }

  /**
   * @dev join game with tokenId
   * @param _gameId game index
   * @param _tokenId token Id of NFT to put on game
   */
  function joinGame(uint256 _gameId, uint256 _tokenId) external nonReentrant {
    require(msg.sender != address(0), "Player cannot be ZERO address");
    require(playerNFTContract.ownerOf(_tokenId) == msg.sender, "Msg sender must be owner of NFT token id");

    require(_gameId <= lastGameId, "There is no such game with this id");
    Game storage game = games[_gameId];

    if (game.finishAt > 0) {
      require(block.timestamp <= game.finishAt, "This game was finished");
    }
    require(game.firstPlayer == address(0) || game.secondPlayer == address(0), "Game already has been filled");

    if (game.firstPlayer == address(0)) {
      playerNFTContract.safeTransferFrom(msg.sender, address(this), _tokenId);
      game.firstPlayer = msg.sender;
      game.firstTokenId = _tokenId;
      
      emit PlayerJoined(_gameId, msg.sender, _tokenId, 1);
    } else if (game.secondPlayer == address(0)) {
      playerNFTContract.safeTransferFrom(msg.sender, address(this), _tokenId);
      game.secondPlayer = msg.sender;
      game.secondTokenId = _tokenId;
      game.finishAt = block.timestamp + gameDuration;

      emit PlayerJoined(_gameId, msg.sender, _tokenId, 2);
    }
  }

  /**
   * @dev finish game by creator
   * @param _gameId game index
   */
  function finishGame(uint256 _gameId) external {
    require(msg.sender != address(0), "Player cannot be ZERO address");
    require(_gameId <= lastGameId, "There is no such game with this id");

    Game storage game = games[_gameId];
    require(game.creator == msg.sender, "Game creator can only finish game");
    require(block.timestamp > game.finishAt, "Game can finish after game duration");

    uint256 level1 = playerNFTContract.getLevelByTokenId(game.firstTokenId);
    uint256 level2 = playerNFTContract.getLevelByTokenId(game.secondTokenId);

    address winner = game.firstPlayer;
    uint256 tokenId = game.firstTokenId;
    if (level1 > level2) {
      playerNFTContract.upgradeNFT(game.firstTokenId);
    } else if (level2 > level1) {
      playerNFTContract.upgradeNFT(game.secondTokenId);
      winner = game.secondPlayer;
      tokenId = game.secondTokenId;
    } else {
      uint256 random = randomGeneration();
      if (random == 0) {
        playerNFTContract.upgradeNFT(game.firstTokenId);
      } else {
        playerNFTContract.upgradeNFT(game.secondTokenId);
        winner = game.secondPlayer;
        tokenId = game.secondTokenId;
      }
    }

    playerNFTContract.safeTransferFrom(address(this), game.firstPlayer, game.firstTokenId);
    playerNFTContract.safeTransferFrom(address(this), game.secondPlayer, game.secondTokenId);

    emit GameFinished(_gameId, winner, tokenId, block.timestamp);
  }

  /// return game detail info
  function gameDetailById(uint256 _gameId) public view returns (address, uint256, address, uint256, address, uint256) {
    Game storage game = games[_gameId];
    return (game.firstPlayer, game.firstTokenId, game.secondPlayer, game.secondTokenId, game.creator, game.finishAt);
  }

  /// generate random number between 0 and 1
  function randomGeneration() internal view returns (uint8) {
    return uint8(block.number % 2);
  }
}