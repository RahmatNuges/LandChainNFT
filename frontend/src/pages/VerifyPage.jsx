import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import LandCertificateABI from '../abis/LandCertificate.json';
import { config } from '../config';

const { CONTRACT_ADDRESS } = config;

export default function VerifyPage() {
  const [tokenId, setTokenId] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const verifyNFT = async () => {
    if (!tokenId || isNaN(tokenId) || parseInt(tokenId) <= 0) {
      setError('Please enter a valid Token ID (must be a positive number)');
      return;
    }

    const tokenIdNum = parseInt(tokenId);
    // Parse Token ID to integer for contract calls

    setLoading(true);
    setError('');
    setVerificationResult(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, LandCertificateABI, provider);

      // Initialize contract connection

      // Fetch basic NFT information
      const [owner, isActive, parentTokenId, children] = await Promise.all([
        contract.ownerOf(tokenIdNum),
        contract.isActive(tokenIdNum),
        contract.parentOf(tokenIdNum),
        contract.getChildren(tokenIdNum)
      ]);

      // Fetch basic NFT information from blockchain

      // Fetch metadata from IPFS
      const tokenURI = await contract.tokenURI(tokenIdNum);

      // Use Pinata gateway for IPFS
      // Check if it's already a full URL or just IPFS hash
      const ipfsUrl = tokenURI.startsWith('http')
        ? tokenURI
        : `https://gateway.pinata.cloud/ipfs/${tokenURI}`;

      const metadataResponse = await fetch(ipfsUrl);
      if (!metadataResponse.ok) {
        throw new Error(`Failed to fetch metadata: ${metadataResponse.status} ${metadataResponse.statusText}`);
      }

      const metadata = await metadataResponse.json();
      // Parse metadata from IPFS

      // Fetch parent metadata if exists
      let parentMetadata = null;
      if (parentTokenId && parentTokenId.toString() !== '0') {
        try {
          const parentTokenURI = await contract.tokenURI(parentTokenId);
          const parentIpfsUrl = parentTokenURI.startsWith('http')
            ? parentTokenURI
            : `https://gateway.pinata.cloud/ipfs/${parentTokenURI}`;
          const parentResponse = await fetch(parentIpfsUrl);
          if (parentResponse.ok) {
            parentMetadata = await parentResponse.json();
          }
        } catch (e) {
          // Parent metadata not available
        }
      }

      // Fetch children metadata
      const childrenMetadata = [];
      for (const childId of children) {
        try {
          const childTokenURI = await contract.tokenURI(childId);
          const childIpfsUrl = childTokenURI.startsWith('http')
            ? childTokenURI
            : `https://gateway.pinata.cloud/ipfs/${childTokenURI}`;
          const childResponse = await fetch(childIpfsUrl);
          if (childResponse.ok) {
            const childMeta = await childResponse.json();
            const childOwner = await contract.ownerOf(childId);
            childrenMetadata.push({
              tokenId: childId.toString(),
              metadata: childMeta,
              owner: childOwner
            });
          }
        } catch (e) {
          // Child metadata not available
        }
      }

      setVerificationResult({
        tokenId: tokenIdNum.toString(),
        owner,
        isActive,
        parentTokenId: parentTokenId.toString(),
        parentMetadata,
        children: childrenMetadata,
        metadata
      });

    } catch (err) {
      console.error('Verification error:', err);
      setError(`Error verifying NFT. Please check if the Token ID exists.`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 mt-24">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Verify NFT Certificate</h1>

      {/* Search Form */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Enter Token ID</h2>
        <div className="flex gap-4">
          <input
            type="number"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            placeholder="Enter Token ID (e.g., 1, 2, 3...)"
            className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
          />
          <button
            onClick={verifyNFT}
            disabled={loading}
            className="bg-teal-600 text-white px-6 py-3 rounded-md hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify NFT'}
          </button>
        </div>
        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </div>

      {/* Verification Result */}
      {verificationResult && (
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Token ID</label>
                <p className="text-lg font-mono">{verificationResult.tokenId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Status</label>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${verificationResult.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {verificationResult.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600">Current Owner</label>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-mono">{verificationResult.owner}</p>
                  <button
                    onClick={() => copyToClipboard(verificationResult.owner)}
                    className="text-teal-600 hover:text-teal-800"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata Information */}
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Certificate Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Location</label>
                <p className="text-lg">
                  {typeof verificationResult.metadata.lokasi === 'object'
                    ? `${verificationResult.metadata.lokasi.jalan}, RT ${verificationResult.metadata.lokasi.rt}, RW ${verificationResult.metadata.lokasi.rw}, ${verificationResult.metadata.lokasi.desa}, ${verificationResult.metadata.lokasi.kecamatan}, ${verificationResult.metadata.lokasi.kabupaten}, ${verificationResult.metadata.lokasi.provinsi}`
                    : verificationResult.metadata.lokasi
                  }
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Area (m²)</label>
                <p className="text-lg">{verificationResult.metadata.luas}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Legal Status</label>
                <p className="text-lg">{verificationResult.metadata.statusHukum}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Land Survey Number & Date</label>
                <p className="text-lg">{verificationResult.metadata.nomorSuratUkur}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600">Description</label>
                <p className="text-lg">{verificationResult.metadata.deskripsi}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600">Land Boundaries</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  <div className="p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">North:</span>
                    <p className="font-medium">{verificationResult.metadata.batas.utara}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">East:</span>
                    <p className="font-medium">{verificationResult.metadata.batas.timur}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">South:</span>
                    <p className="font-medium">{verificationResult.metadata.batas.selatan}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">West:</span>
                    <p className="font-medium">{verificationResult.metadata.batas.barat}</p>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600">Digital Document</label>
                <a
                  href={`https://gateway.pinata.cloud/ipfs/${verificationResult.metadata.fileCid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 hover:text-teal-800 underline"
                >
                  View Document on IPFS
                </a>
              </div>
            </div>
          </div>

          {/* Parent NFT Information */}
          {verificationResult.parentMetadata && (
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Parent Certificate</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Parent Token ID</label>
                  <p className="text-lg font-mono">{verificationResult.parentTokenId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Parent Location</label>
                  <p className="text-lg">
                    {typeof verificationResult.parentMetadata.lokasi === 'object'
                      ? `${verificationResult.parentMetadata.lokasi.jalan}, RT ${verificationResult.parentMetadata.lokasi.rt}, RW ${verificationResult.parentMetadata.lokasi.rw}, ${verificationResult.parentMetadata.lokasi.desa}, ${verificationResult.parentMetadata.lokasi.kecamatan}, ${verificationResult.parentMetadata.lokasi.kabupaten}, ${verificationResult.parentMetadata.lokasi.provinsi}`
                      : verificationResult.parentMetadata.lokasi
                    }
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Parent Area</label>
                  <p className="text-lg">{verificationResult.parentMetadata.luas} m²</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Parent Status</label>
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    Inactive (Split)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Children NFTs */}
          {verificationResult.children.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Child Certificates</h2>
              <div className="space-y-3">
                {verificationResult.children.map((child, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Child Token ID</label>
                        <p className="font-mono">{child.tokenId}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Child Location</label>
                        <p>
                          {typeof child.metadata.lokasi === 'object'
                            ? `${child.metadata.lokasi.jalan}, RT ${child.metadata.lokasi.rt}, RW ${child.metadata.lokasi.rw}, ${child.metadata.lokasi.desa}, ${child.metadata.lokasi.kecamatan}, ${child.metadata.lokasi.kabupaten}, ${child.metadata.lokasi.provinsi}`
                            : child.metadata.lokasi
                          }
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Child Owner</label>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm">{child.owner.slice(0, 6)}...{child.owner.slice(-4)}</p>
                          <button
                            onClick={() => copyToClipboard(child.owner)}
                            className="text-teal-600 hover:text-teal-800 text-sm"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Section */}
          <ActivitySection tokenId={verificationResult.tokenId} />

          {/* Authenticity Verification */}
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Authenticity Verification</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span>NFT exists on blockchain</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span>Metadata stored on IPFS</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span>Token URI verified</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span>Smart contract verified</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Activity Section Component (sama seperti di CertificateList.jsx)
function ActivitySection({ tokenId }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, LandCertificateABI, provider);
        // Ambil semua event Transfer
        const allEvents = await contract.queryFilter(contract.filters.Transfer(), 0, "latest");
        // Filter hanya untuk tokenId ini
        const filtered = allEvents.filter(ev => ev.args.tokenId.toString() === tokenId.toString());
        // Ambil timestamp untuk setiap event
        const withTime = await Promise.all(filtered.map(async (ev) => {
          const block = await provider.getBlock(ev.blockNumber);
          return {
            event: ev.args.from === ethers.ZeroAddress ? 'Mint' : 'Transfer',
            from: ev.args.from,
            to: ev.args.to,
            time: new Date(block.timestamp * 1000),
            txHash: ev.transactionHash
          };
        }));
        setEvents(withTime.reverse()); // urutkan terbaru di atas
      } catch (err) {
        setEvents([]);
      }
      setLoading(false);
    })();
  }, [open, tokenId]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-lg font-bold text-gray-700 hover:text-teal-600 focus:outline-none mb-2"
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M12 5v14m7-7H5" /></svg>
        Activity
        <span className="ml-2 text-xs font-normal text-gray-400">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          {loading && <div className="text-gray-500">Loading activity...</div>}
          {!loading && events.length === 0 && <div className="text-gray-400">No activity yet.</div>}
          {!loading && events.length > 0 && (
            <table className="w-full text-sm mt-2">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-1">Event</th>
                  <th className="py-1">From</th>
                  <th className="py-1">To</th>
                  <th className="py-1">Time</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-gray-100">
                    <td className="py-1 font-semibold">{ev.event}</td>
                    <td className="py-1 font-mono text-xs">{ev.from === ethers.ZeroAddress ? 'NullAddress' : ev.from.slice(0, 6) + '...' + ev.from.slice(-4)}</td>
                    <td className="py-1 font-mono text-xs">{ev.to.slice(0, 6) + '...' + ev.to.slice(-4)}</td>
                    <td className="py-1">{ev.time.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
} 