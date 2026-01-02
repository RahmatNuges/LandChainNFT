import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import LandCertificateABI from '../abis/LandCertificate.json';
import { getPendingMintRequests, removePendingMintRequest } from '../utils/pendingRequests';

const CONTRACT_ADDRESS = "0x4a0332c599Db448b1A84ebFA59cfD6918B14595d";

export default function Mint({ account }) {
  const [isInstitution, setIsInstitution] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [status, setStatus] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    async function checkInstitution() {
      if (!account) {
        setIsInstitution(false);
        return;
      }
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          LandCertificateABI,
          provider
        );
        const allowed = await contract.isInstitution(account);
        setIsInstitution(allowed);
      } catch (e) {
        setIsInstitution(false);
      }
    }
    checkInstitution();
    loadPendingRequests();
  }, [account]);

  const loadPendingRequests = () => {
    const requests = getPendingMintRequests();
    setPendingRequests(requests);
  };

  const handleExecuteMint = async (request) => {
    if (!account) {
      setStatus("Error: Please connect your wallet first.");
      return;
    }

    setStatus('Executing mint transaction...');
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, LandCertificateABI, signer);
      
      const tx = await contract.mintCertificate(
        request.to,
        request.tokenURI,
        request.signature
      );
      
      setStatus(`Minting in progress... Transaction Hash: ${tx.hash}`);
      await tx.wait();
      
      // Remove from pending requests
      removePendingMintRequest(request.id);
      loadPendingRequests();
      
      setStatus(`Certificate successfully minted! Token will be minted to ${request.to}`);
    } catch (err) {
      console.error(err);
      setStatus('Error: ' + (err.reason || err.message || 'Minting failed'));
    }
  };

  if (isInstitution === null) {
    return <div className="text-center py-20 text-gray-500">Checking institution access...</div>;
  }
  if (!isInstitution) {
    return <div className="text-center py-20 text-red-600 font-bold text-xl">Access denied: Only institutions can execute mint requests.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-24 p-4 md:p-8">
      <h2 className="text-3xl font-bold mb-4">Execute Mint Requests</h2>
      <p className="text-gray-600 mb-8">View and execute pending mint requests from land owners.</p>

      {pendingRequests.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No pending mint requests found.</p>
          <p className="text-sm text-gray-500 mt-2">Land owners can create mint requests from the "Request Mint" page.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request) => (
            <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">Mint Request #{request.id.slice(-6)}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Recipient: <span className="font-mono">{request.to}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    IPFS CID: <span className="font-mono text-xs">{request.tokenURI}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Created: {new Date(request.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedRequest(selectedRequest === request.id ? null : request.id)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm"
                  >
                    {selectedRequest === request.id ? 'Hide Details' : 'View Details'}
                  </button>
                  <button
                    onClick={() => handleExecuteMint(request)}
                    disabled={status.includes("proses...")}
                    className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Execute Mint
                  </button>
                </div>
              </div>
              
              {/* Detailed View */}
              {selectedRequest === request.id && (
                <div className="mt-4 p-6 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Complete Request Details</h4>
                  
                  {/* Basic Information */}
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Basic Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Request ID:</span>
                        <span className="ml-2 font-mono text-gray-800">{request.id}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Recipient Address:</span>
                        <span className="ml-2 font-mono text-gray-800 break-all">{request.to}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">IPFS CID:</span>
                        <span className="ml-2 font-mono text-gray-800 break-all">{request.tokenURI}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Created:</span>
                        <span className="ml-2 text-gray-800">{new Date(request.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Details */}
                  {request.metadata && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-700 mb-2">Property Details</h5>
                      <div className="bg-white p-4 rounded-md border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {request.metadata.luas && (
                            <div>
                              <span className="text-gray-600 font-medium">Land Area:</span>
                              <span className="ml-2 text-gray-800">{request.metadata.luas} m²</span>
                            </div>
                          )}
                          {request.metadata.statusHukum && (
                            <div>
                              <span className="text-gray-600 font-medium">Legal Status:</span>
                              <span className="ml-2 text-gray-800">{request.metadata.statusHukum}</span>
                            </div>
                          )}
                          {request.metadata.nomorSuratUkur && (
                            <div>
                              <span className="text-gray-600 font-medium">Survey Number:</span>
                              <span className="ml-2 text-gray-800">{request.metadata.nomorSuratUkur}</span>
                            </div>
                          )}
                          {request.metadata.deskripsi && (
                            <div className="md:col-span-2">
                              <span className="text-gray-600 font-medium">Description:</span>
                              <p className="ml-2 text-gray-800 mt-1">{request.metadata.deskripsi}</p>
                            </div>
                          )}
                        </div>

                        {/* Location Details */}
                        {request.metadata.lokasi && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h6 className="text-xs font-semibold text-gray-600 mb-2">Location Information</h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              {request.metadata.lokasi.jalan && (
                                <div>
                                  <span className="text-gray-600">Street:</span>
                                  <span className="ml-2 text-gray-800">{request.metadata.lokasi.jalan}</span>
                                </div>
                              )}
                              {request.metadata.lokasi.rt && (
                                <div>
                                  <span className="text-gray-600">RT:</span>
                                  <span className="ml-2 text-gray-800">{request.metadata.lokasi.rt}</span>
                                </div>
                              )}
                              {request.metadata.lokasi.rw && (
                                <div>
                                  <span className="text-gray-600">RW:</span>
                                  <span className="ml-2 text-gray-800">{request.metadata.lokasi.rw}</span>
                                </div>
                              )}
                              {request.metadata.lokasi.desa && (
                                <div>
                                  <span className="text-gray-600">Village:</span>
                                  <span className="ml-2 text-gray-800">{request.metadata.lokasi.desa}</span>
                                </div>
                              )}
                              {request.metadata.lokasi.kecamatan && (
                                <div>
                                  <span className="text-gray-600">District:</span>
                                  <span className="ml-2 text-gray-800">{request.metadata.lokasi.kecamatan}</span>
                                </div>
                              )}
                              {request.metadata.lokasi.kabupaten && (
                                <div>
                                  <span className="text-gray-600">Regency/City:</span>
                                  <span className="ml-2 text-gray-800">{request.metadata.lokasi.kabupaten}</span>
                                </div>
                              )}
                              {request.metadata.lokasi.provinsi && (
                                <div>
                                  <span className="text-gray-600">Province:</span>
                                  <span className="ml-2 text-gray-800">{request.metadata.lokasi.provinsi}</span>
                                </div>
                              )}
                            </div>
                            <div className="mt-2 text-sm">
                              <span className="text-gray-600 font-medium">Full Address:</span>
                              <p className="text-gray-800 mt-1">
                                {[
                                  request.metadata.lokasi.jalan,
                                  `RT ${request.metadata.lokasi.rt}/RW ${request.metadata.lokasi.rw}`,
                                  request.metadata.lokasi.desa,
                                  request.metadata.lokasi.kecamatan,
                                  request.metadata.lokasi.kabupaten,
                                  request.metadata.lokasi.provinsi
                                ].filter(Boolean).join(', ')}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Boundaries */}
                        {request.metadata.batas && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h6 className="text-xs font-semibold text-gray-600 mb-2">Land Boundaries</h6>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              {request.metadata.batas.utara && (
                                <div>
                                  <span className="text-gray-600">North:</span>
                                  <span className="ml-2 text-gray-800">{request.metadata.batas.utara}</span>
                                </div>
                              )}
                              {request.metadata.batas.timur && (
                                <div>
                                  <span className="text-gray-600">East:</span>
                                  <span className="ml-2 text-gray-800">{request.metadata.batas.timur}</span>
                                </div>
                              )}
                              {request.metadata.batas.barat && (
                                <div>
                                  <span className="text-gray-600">West:</span>
                                  <span className="ml-2 text-gray-800">{request.metadata.batas.barat}</span>
                                </div>
                              )}
                              {request.metadata.batas.selatan && (
                                <div>
                                  <span className="text-gray-600">South:</span>
                                  <span className="ml-2 text-gray-800">{request.metadata.batas.selatan}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Signature Info */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Signature Information</h5>
                    <div className="bg-white p-3 rounded-md border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">EIP-712 Signature:</p>
                      <p className="font-mono text-xs text-gray-800 break-all">{request.signature}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        This signature was created by the recipient address ({request.to}) and verifies their consent for this mint request.
                      </p>
                    </div>
                  </div>

                  {/* IPFS Link */}
                  <div className="mt-4">
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${request.tokenURI}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:text-teal-800 text-sm font-medium underline"
                    >
                      View Full Metadata on IPFS →
                    </a>
                  </div>
                </div>
              )}
              
              {/* Compact Preview (when details not shown) */}
              {selectedRequest !== request.id && request.metadata && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Quick Preview:</h4>
                  <div className="text-xs text-gray-600 space-y-1">
                    {request.metadata.luas && <p>Area: {request.metadata.luas} m²</p>}
                    {request.metadata.statusHukum && <p>Legal Status: {request.metadata.statusHukum}</p>}
                    {request.metadata.lokasi && (
                      <p>Location: {[
                        request.metadata.lokasi.jalan,
                        request.metadata.lokasi.desa,
                        request.metadata.lokasi.kecamatan,
                        request.metadata.lokasi.kabupaten,
                        request.metadata.lokasi.provinsi
                      ].filter(Boolean).join(', ')}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {status && (
        <div className={`mt-6 p-4 rounded-md text-sm ${status.includes("Error") ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
          {status}
        </div>
      )}
    </div>
  );
}