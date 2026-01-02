// Utility untuk menyimpan dan mengambil pending mint/split requests
const STORAGE_KEY_MINT = 'landCertificate_pendingMintRequests';
const STORAGE_KEY_SPLIT = 'landCertificate_pendingSplitRequests';

/**
 * Menyimpan pending mint request
 * @param {Object} request - { to, tokenURI, signature, metadata, timestamp }
 */
export function savePendingMintRequest(request) {
  const requests = getPendingMintRequests();
  requests.push({
    ...request,
    id: Date.now().toString(),
    timestamp: Date.now()
  });
  localStorage.setItem(STORAGE_KEY_MINT, JSON.stringify(requests));
  return requests[requests.length - 1];
}

/**
 * Mengambil semua pending mint requests
 * @returns {Array}
 */
export function getPendingMintRequests() {
  const stored = localStorage.getItem(STORAGE_KEY_MINT);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Menghapus pending mint request
 * @param {string} id
 */
export function removePendingMintRequest(id) {
  const requests = getPendingMintRequests();
  const filtered = requests.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY_MINT, JSON.stringify(filtered));
}

/**
 * Menyimpan pending split request
 * @param {Object} request - { parentId, recipients, tokenURIs, signature, metadata, ownerAddress, timestamp }
 */
export function savePendingSplitRequest(request) {
  const requests = getPendingSplitRequests();
  requests.push({
    ...request,
    id: Date.now().toString(),
    timestamp: Date.now()
  });
  localStorage.setItem(STORAGE_KEY_SPLIT, JSON.stringify(requests));
  return requests[requests.length - 1];
}

/**
 * Mengambil semua pending split requests
 * @returns {Array}
 */
export function getPendingSplitRequests() {
  const stored = localStorage.getItem(STORAGE_KEY_SPLIT);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Menghapus pending split request
 * @param {string} id
 */
export function removePendingSplitRequest(id) {
  const requests = getPendingSplitRequests();
  const filtered = requests.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY_SPLIT, JSON.stringify(filtered));
}

/**
 * Mengambil pending split requests untuk token tertentu
 * @param {string} tokenId
 * @returns {Array}
 */
export function getPendingSplitRequestsForToken(tokenId) {
  const requests = getPendingSplitRequests();
  return requests.filter(r => r.parentId === tokenId.toString());
}
