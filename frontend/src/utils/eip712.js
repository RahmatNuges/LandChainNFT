import { ethers } from 'ethers';

/**
 * Get EIP-712 domain configuration
 * @param {bigint} chainId - Chain ID
 * @param {string} contractAddress - Contract address
 * @returns {Object} EIP-712 domain object
 */
export function getDomain(chainId, contractAddress) {
  return {
    name: 'LandCertificate',
    version: '1',
    chainId: chainId,
    verifyingContract: contractAddress
  };
}

/**
 * Sign Mint Request using EIP-712
 * @param {ethers.BrowserProvider} provider - Ethers provider
 * @param {string} signerAddress - Address of the signer (must be the recipient 'to')
 * @param {string} to - Recipient address
 * @param {string} tokenURI - Token URI (IPFS CID)
 * @param {bigint} chainId - Chain ID
 * @param {string} contractAddress - Contract address
 * @returns {Promise<string>} Signature bytes
 */
export async function signMintRequest(provider, signerAddress, to, tokenURI, chainId, contractAddress) {
  const domain = getDomain(chainId, contractAddress);
  
  const types = {
    MintRequest: [
      { name: 'to', type: 'address' },
      { name: 'tokenURI', type: 'string' }
    ]
  };

  const value = {
    to: ethers.getAddress(to), // Ensure checksummed address
    tokenURI: tokenURI
  };

  try {
    // Get signer
    const signer = await provider.getSigner(signerAddress);
    
    // Sign typed data
    const signature = await signer.signTypedData(domain, types, value);
    
    return signature;
  } catch (error) {
    console.error('Error signing mint request:', error);
    throw error;
  }
}

/**
 * Sign Split Request using EIP-712
 * @param {ethers.BrowserProvider} provider - Ethers provider
 * @param {string} signerAddress - Address of the signer (must be the owner of parentId)
 * @param {string} parentId - Parent token ID
 * @param {string[]} recipients - Array of recipient addresses
 * @param {string[]} tokenURIs - Array of token URIs (IPFS CIDs)
 * @param {bigint} chainId - Chain ID
 * @param {string} contractAddress - Contract address
 * @returns {Promise<string>} Signature bytes
 */
export async function signSplitRequest(provider, signerAddress, parentId, recipients, tokenURIs, chainId, contractAddress) {
  const domain = getDomain(chainId, contractAddress);
  
  // Calculate hashes as per contract implementation (using ethers v6 API)
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const recipientsHash = ethers.keccak256(abiCoder.encode(['address[]'], [recipients]));
  const tokenURIsHash = ethers.keccak256(abiCoder.encode(['string[]'], [tokenURIs]));
  
  const types = {
    SplitRequest: [
      { name: 'parentId', type: 'uint256' },
      { name: 'recipientsHash', type: 'bytes32' },
      { name: 'tokenURIsHash', type: 'bytes32' }
    ]
  };

  const value = {
    parentId: ethers.toBigInt(parentId),
    recipientsHash: recipientsHash,
    tokenURIsHash: tokenURIsHash
  };

  try {
    // Get signer - need to request account access for the signerAddress
    // Note: In practice, the signerAddress should be the currently connected account
    const signer = await provider.getSigner(signerAddress);
    
    // Sign typed data
    const signature = await signer.signTypedData(domain, types, value);
    
    return signature;
  } catch (error) {
    console.error('Error signing split request:', error);
    throw error;
  }
}

