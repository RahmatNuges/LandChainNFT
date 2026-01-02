// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract LandCertificate is ERC721, ERC721Enumerable, Ownable, EIP712 {
    using Counters for Counters.Counter;
    using ECDSA for bytes32;
    
    Counters.Counter private _tokenIds;

    // EIP-712 Type Hashes
    bytes32 private constant MINT_REQUEST_TYPEHASH = keccak256("MintRequest(address to,string tokenURI)");
    bytes32 private constant SPLIT_REQUEST_TYPEHASH = keccak256("SplitRequest(uint256 parentId,bytes32 recipientsHash,bytes32 tokenURIsHash)");

    // Mapping untuk menyimpan metadata URI setiap token
    mapping(uint256 => string) private _tokenURIs;

    // Mapping dari tokenId anak ke tokenId induk (jika hasil pemecahan)
    mapping(uint256 => uint256) public parentOf;
    
    // Mapping dari tokenId induk ke array tokenId anak
    mapping(uint256 => uint256[]) public childrenOf;
    
    // Menandai tokenId yang sudah dinonaktifkan (misal: sudah dipecah)
    mapping(uint256 => bool) public isInactive;

    // Multi-institusi: daftar address institusi yang diizinkan
    mapping(address => bool) public isInstitution;

    // Modifier untuk membatasi akses hanya institusi
    modifier onlyInstitution() {
        require(isInstitution[msg.sender], "Only institution can call this");
        _;
    }

    // Fungsi untuk owner menambah institusi
    function addInstitution(address addr) public onlyOwner {
        isInstitution[addr] = true;
    }

    // Fungsi untuk owner menghapus institusi
    function removeInstitution(address addr) public onlyOwner {
        isInstitution[addr] = false;
    }

    // Events
    event CertificateMinted(uint256 indexed tokenId, address indexed to, string tokenURI);
    event CertificateSplit(uint256 indexed parentId, uint256[] childIds);

    constructor() ERC721("LandCertificate", "LAND") EIP712("LandCertificate", "1") {
        // Opsional: owner otomatis jadi institusi pertama
        isInstitution[msg.sender] = true;
    }

    // Mint sertifikat tanah baru dengan EIP-712 signature verification
    function mintCertificate(address to, string memory tokenURI, bytes memory signature) public onlyInstitution returns (uint256) {
        // Verify signature
        bytes32 structHash = keccak256(abi.encode(
            MINT_REQUEST_TYPEHASH,
            to,
            keccak256(bytes(tokenURI))
        ));
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        require(signer == to, "Invalid signature: signer must be the recipient");

        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        
        _safeMint(to, newItemId);
        _setTokenURI(newItemId, tokenURI);
        
        emit CertificateMinted(newItemId, to, tokenURI);
        return newItemId;
    }

    // Pecah sertifikat induk menjadi beberapa anak dengan EIP-712 signature verification
    function splitCertificate(
        uint256 parentId, 
        address[] memory recipients, 
        string[] memory tokenURIs,
        bytes memory signature
    ) public onlyInstitution returns (uint256[] memory) {
        require(_isApprovedOrOwner(_msgSender(), parentId), "Not owner nor approved");
        require(!isInactive[parentId], "Parent already inactive");
        require(recipients.length == tokenURIs.length, "Array length mismatch");
        require(recipients.length > 1, "Must split into at least 2");

        // Verify signature
        address owner = ownerOf(parentId);
        bytes32 recipientsHash = keccak256(abi.encode(recipients));
        bytes32 tokenURIsHash = keccak256(abi.encode(tokenURIs));
        
        bytes32 structHash = keccak256(abi.encode(
            SPLIT_REQUEST_TYPEHASH,
            parentId,
            recipientsHash,
            tokenURIsHash
        ));
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        require(signer == owner, "Invalid signature: signer must be the owner");

        // Nonaktifkan token induk
        isInactive[parentId] = true;

        uint256[] memory childIds = new uint256[](recipients.length);
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _tokenIds.increment();
            uint256 childId = _tokenIds.current();
            
            _safeMint(recipients[i], childId);
            _setTokenURI(childId, tokenURIs[i]);
            
            parentOf[childId] = parentId;
            childrenOf[parentId].push(childId);
            childIds[i] = childId;
        }
        
        emit CertificateSplit(parentId, childIds);
        return childIds;
    }

    // Cek apakah tokenId adalah anak dari parent tertentu
    function isChildOf(uint256 childId, uint256 parentId) public view returns (bool) {
        return parentOf[childId] == parentId;
    }

    // Get all children of a parent token
    function getChildren(uint256 parentId) public view returns (uint256[] memory) {
        return childrenOf[parentId];
    }

    // Get total number of children for a parent token
    function getChildrenCount(uint256 parentId) public view returns (uint256) {
        return childrenOf[parentId].length;
    }

    // Internal function untuk set token URI
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal {
        require(_exists(tokenId), "ERC721: URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }

    // Override tokenURI function
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721: URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }

    // Override _beforeTokenTransfer untuk mencegah transfer token yang inactive
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        // Jika bukan minting (from != address(0)) dan bukan burning (to != address(0))
        // maka cek apakah token inactive
        if (from != address(0) && to != address(0)) {
        require(!isInactive[tokenId], "Token is inactive");
        }
        
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    // Override _burn function
    function _burn(uint256 tokenId) internal override {
        super._burn(tokenId);
        
        // Clear metadata
        if (bytes(_tokenURIs[tokenId]).length != 0) {
            delete _tokenURIs[tokenId];
        }
    }

    // Override supportsInterface
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Utility function untuk cek apakah token masih aktif
    function isActive(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId) && !isInactive[tokenId];
    }

    // Get current token ID counter
    function getCurrentTokenId() public view returns (uint256) {
        return _tokenIds.current();
    }

    // Get domain separator for frontend
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
} 