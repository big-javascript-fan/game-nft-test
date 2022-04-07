// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./NFTAccessControl.sol";

contract PlayerNFT is Initializable, ERC721EnumerableUpgradeable, NFTAccessControl {

  /// @dev last minted tokenId;
  uint256 public lastTokenId;

  /// @dev nft level per tokenId
  mapping(uint256 => uint256) private levels;

  function initialize(
    string memory _name,
    string memory _symbol
  ) public initializer {
    __ERC721_init(_name, _symbol);
    __ERC721Enumerable_init();
    __NFTAccessControl_init();

    lastTokenId = 0;
  }

  /**
   * @dev mint NFT by owner
   * @param _to address to be minted
   */
  function mint(address _to) external onlyRole(DEFAULT_ADMIN_ROLE) {
    uint256 tokenId = lastTokenId + 1;
    _mint(_to, tokenId);
    levels[tokenId] = 1;
    lastTokenId++;
  }

  /**
   * @dev upgrade nft level
   * @param _tokenId token id to be upgraded
   */
  function upgradeNFT(uint256 _tokenId) external onlyRole(SMART_CONTRACT_ROLE) {
    levels[_tokenId]++;
  }

  /**
   * @dev get nft level by tokenId
   * @param _tokenId token id of nft
   */
  function getLevelByTokenId(uint256 _tokenId) public view returns(uint256) {
    return levels[_tokenId];
  }

  /**
   * @dev See {IERC165-supportsInterface}.
   */
  function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721EnumerableUpgradeable, AccessControlUpgradeable) returns (bool) {
      return interfaceId == type(IERC721EnumerableUpgradeable).interfaceId || super.supportsInterface(interfaceId);
  }
}