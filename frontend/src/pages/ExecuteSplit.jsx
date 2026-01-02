import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import LandCertificateABI from '../abis/LandCertificate.json';
import { getPendingSplitRequests, removePendingSplitRequest } from '../utils/pendingRequests';

const CONTRACT_ADDRESS = "0x4a0332c599Db448b1A84ebFA59cfD6918B14595d";

// Component untuk menampilkan setiap split request dengan approval status
function SplitRequestCard({ request, account, onExecute, executing }) {
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [checkingApproval, setCheckingApproval] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  // Check approval status for this request
  useEffect(() => {
    async function checkApproval() {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, LandCertificateABI, provider);
        const approved = await contract.getApproved(request.parentId);
        const isApprovedForAll = await contract.isApprovedForAll(request.ownerAddress, account);
        
        const isApproved = approved.toLowerCase() === account.toLowerCase() || isApprovedForAll;
        setApprovalStatus(isApproved);
      } catch (err) {
        console.error('Error checking approval:', err);
        setApprovalStatus(false);
      }
      setCheckingApproval(false);
    }
    if (account) {
      checkApproval();
    }
  }, [request.parentId, request.ownerAddress, account]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800">Split Request #{request.id.slice(-6)}</h3>
          <p className="text-sm text-gray-600 mt-1">
            Parent Token ID: <span className="font-mono">{request.parentId}</span>
          </p>
          <p className="text-sm text-gray-600">
            Owner: <span className="font-mono">{request.ownerAddress}</span>
          </p>
          <p className="text-sm text-gray-600">
            Number of Children: <span className="font-semibold">{request.recipients.length}</span>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Created: {new Date(request.timestamp).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm"
          >
            {showDetails ? 'Hide Details' : 'View Details'}
          </button>
          <button
            onClick={() => onExecute(request)}
            disabled={executing || !approvalStatus}
            className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Execute Split
          </button>
        </div>
      </div>

      {/* Approval Status */}
      {!checkingApproval && (
        <div className={`mt-4 p-4 rounded-md ${approvalStatus ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          {approvalStatus ? (
            <div>
              <p className="text-sm text-green-800 font-medium">✓ Institution Approved</p>
              <p className="text-xs text-green-700 mt-1">You can execute this split request.</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-yellow-800 font-medium">⚠ Approval Required</p>
              <p className="text-xs text-yellow-700 mt-1">
                The owner ({request.ownerAddress.slice(0, 6)}...{request.ownerAddress.slice(-4)}) must approve this institution before you can execute the split.
              </p>
              <p className="text-xs text-yellow-700 mt-2">
                <strong>Owner Action Required:</strong> The owner needs to go to their certificate details page (Token ID: {request.parentId}) and approve this institution ({account.slice(0, 6)}...{account.slice(-4)}).
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Detailed View */}
      {showDetails && (
        <div className="mt-4 p-6 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
          <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Complete Split Request Details</h4>
          
          {/* Basic Information */}
          <div>
            <h5 className="text-sm font-semibold text-gray-700 mb-2">Basic Information</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm bg-white p-3 rounded-md border border-gray-200">
              <div>
                <span className="text-gray-600">Request ID:</span>
                <span className="ml-2 font-mono text-gray-800">{request.id}</span>
              </div>
              <div>
                <span className="text-gray-600">Parent Token ID:</span>
                <span className="ml-2 font-mono text-gray-800">{request.parentId}</span>
              </div>
              <div>
                <span className="text-gray-600">Owner Address:</span>
                <span className="ml-2 font-mono text-gray-800 break-all">{request.ownerAddress}</span>
              </div>
              <div>
                <span className="text-gray-600">Number of Children:</span>
                <span className="ml-2 font-semibold text-gray-800">{request.recipients.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Created:</span>
                <span className="ml-2 text-gray-800">{new Date(request.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Child Tokens Details */}
          {request.recipients && request.recipients.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-gray-700 mb-2">Child Tokens Information</h5>
              <div className="space-y-3">
                {request.recipients.map((recipient, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-md border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <h6 className="font-semibold text-gray-800">Child Token #{idx + 1}</h6>
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${request.tokenURIs[idx]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-teal-600 hover:text-teal-800 underline"
                      >
                        View Metadata →
                      </a>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600 font-medium">Recipient Address:</span>
                        <p className="font-mono text-gray-800 break-all mt-1">{recipient}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">IPFS CID:</span>
                        <p className="font-mono text-xs text-gray-800 break-all mt-1">{request.tokenURIs[idx]}</p>
                      </div>
                    </div>
                    
                    {/* Child Metadata Details */}
                    {request.metadata && request.metadata[idx] && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {request.metadata[idx].luas && (
                            <div>
                              <span className="text-gray-600 font-medium">Area:</span>
                              <span className="ml-2 text-gray-800">{request.metadata[idx].luas} m²</span>
                            </div>
                          )}
                          {request.metadata[idx].statusHukum && (
                            <div>
                              <span className="text-gray-600 font-medium">Legal Status:</span>
                              <span className="ml-2 text-gray-800">{request.metadata[idx].statusHukum}</span>
                            </div>
                          )}
                          {request.metadata[idx].nomorSuratUkur && (
                            <div>
                              <span className="text-gray-600 font-medium">Survey Number:</span>
                              <span className="ml-2 text-gray-800">{request.metadata[idx].nomorSuratUkur}</span>
                            </div>
                          )}
                          {request.metadata[idx].deskripsi && (
                            <div className="md:col-span-2">
                              <span className="text-gray-600 font-medium">Description:</span>
                              <p className="ml-2 text-gray-800 mt-1">{request.metadata[idx].deskripsi}</p>
                            </div>
                          )}
                        </div>

                        {/* Location for Child */}
                        {request.metadata[idx].lokasi && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <h6 className="text-xs font-semibold text-gray-600 mb-2">Location</h6>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              {request.metadata[idx].lokasi.jalan && (
                                <div>
                                  <span className="text-gray-600">Street:</span>
                                  <span className="ml-1 text-gray-800">{request.metadata[idx].lokasi.jalan}</span>
                                </div>
                              )}
                              {request.metadata[idx].lokasi.rt && (
                                <div>
                                  <span className="text-gray-600">RT:</span>
                                  <span className="ml-1 text-gray-800">{request.metadata[idx].lokasi.rt}</span>
                                </div>
                              )}
                              {request.metadata[idx].lokasi.rw && (
                                <div>
                                  <span className="text-gray-600">RW:</span>
                                  <span className="ml-1 text-gray-800">{request.metadata[idx].lokasi.rw}</span>
                                </div>
                              )}
                              {request.metadata[idx].lokasi.desa && (
                                <div>
                                  <span className="text-gray-600">Village:</span>
                                  <span className="ml-1 text-gray-800">{request.metadata[idx].lokasi.desa}</span>
                                </div>
                              )}
                              {request.metadata[idx].lokasi.kecamatan && (
                                <div>
                                  <span className="text-gray-600">District:</span>
                                  <span className="ml-1 text-gray-800">{request.metadata[idx].lokasi.kecamatan}</span>
                                </div>
                              )}
                              {request.metadata[idx].lokasi.kabupaten && (
                                <div>
                                  <span className="text-gray-600">Regency:</span>
                                  <span className="ml-1 text-gray-800">{request.metadata[idx].lokasi.kabupaten}</span>
                                </div>
                              )}
                              {request.metadata[idx].lokasi.provinsi && (
                                <div>
                                  <span className="text-gray-600">Province:</span>
                                  <span className="ml-1 text-gray-800">{request.metadata[idx].lokasi.provinsi}</span>
                                </div>
                              )}
                            </div>
                            <div className="mt-2 text-xs">
                              <span className="text-gray-600 font-medium">Full Address:</span>
                              <p className="text-gray-800 mt-1">
                                {[
                                  request.metadata[idx].lokasi.jalan,
                                  `RT ${request.metadata[idx].lokasi.rt}/RW ${request.metadata[idx].lokasi.rw}`,
                                  request.metadata[idx].lokasi.desa,
                                  request.metadata[idx].lokasi.kecamatan,
                                  request.metadata[idx].lokasi.kabupaten,
                                  request.metadata[idx].lokasi.provinsi
                                ].filter(Boolean).join(', ')}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Boundaries for Child */}
                        {request.metadata[idx].batas && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <h6 className="text-xs font-semibold text-gray-600 mb-2">Land Boundaries</h6>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              {request.metadata[idx].batas.utara && (
                                <div>
                                  <span className="text-gray-600">North:</span>
                                  <span className="ml-1 text-gray-800">{request.metadata[idx].batas.utara}</span>
                                </div>
                              )}
                              {request.metadata[idx].batas.timur && (
                                <div>
                                  <span className="text-gray-600">East:</span>
                                  <span className="ml-1 text-gray-800">{request.metadata[idx].batas.timur}</span>
                                </div>
                              )}
                              {request.metadata[idx].batas.barat && (
                                <div>
                                  <span className="text-gray-600">West:</span>
                                  <span className="ml-1 text-gray-800">{request.metadata[idx].batas.barat}</span>
                                </div>
                              )}
                              {request.metadata[idx].batas.selatan && (
                                <div>
                                  <span className="text-gray-600">South:</span>
                                  <span className="ml-1 text-gray-800">{request.metadata[idx].batas.selatan}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signature Information */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h5 className="text-sm font-semibold text-gray-700 mb-2">Signature Information</h5>
            <div className="bg-white p-3 rounded-md border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">EIP-712 Signature:</p>
              <p className="font-mono text-xs text-gray-800 break-all">{request.signature}</p>
              <p className="text-xs text-gray-500 mt-2">
                This signature was created by the token owner ({request.ownerAddress.slice(0, 6)}...{request.ownerAddress.slice(-4)}) and verifies their consent for this split request.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Compact Preview (when details not shown) */}
      {!showDetails && request.recipients && request.recipients.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Child Recipients (Quick Preview):</h4>
          <div className="space-y-1">
            {request.recipients.map((recipient, idx) => (
              <div key={idx} className="text-xs text-gray-600">
                <span className="font-medium">Child #{idx + 1}:</span> <span className="font-mono">{recipient}</span>
                {request.metadata && request.metadata[idx] && (
                  <span className="ml-2">({request.metadata[idx].luas} m²)</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExecuteSplit({ account }) {
  const [isInstitution, setIsInstitution] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [status, setStatus] = useState('');

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
    const requests = getPendingSplitRequests();
    setPendingRequests(requests);
  };

  const handleExecuteSplit = async (request) => {
    if (!account) {
      setStatus("Error: Please connect your wallet first.");
      return;
    }

    // Check approval before executing
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, LandCertificateABI, provider);
      const approved = await contract.getApproved(request.parentId);
      const isApprovedForAll = await contract.isApprovedForAll(request.ownerAddress, account);
      
      if (approved.toLowerCase() !== account.toLowerCase() && !isApprovedForAll) {
        setStatus(`Error: This institution is not approved for token ${request.parentId}. The owner must approve this institution first.`);
        return;
      }
    } catch (err) {
      console.error('Error checking approval:', err);
      // Continue anyway, smart contract will reject if not approved
    }

    setStatus('Executing split transaction...');
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, LandCertificateABI, signer);
      
      const tx = await contract.splitCertificate(
        request.parentId,
        request.recipients,
        request.tokenURIs,
        request.signature
      );
      
      setStatus(`Split in progress... Transaction Hash: ${tx.hash}`);
      await tx.wait();
      
      // Remove from pending requests
      removePendingSplitRequest(request.id);
      loadPendingRequests();
      
      setStatus(`Split Certificate successful! Parent token ${request.parentId} has been split into ${request.recipients.length} child tokens.`);
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      console.error(err);
      if (err.reason && err.reason.includes('Not owner nor approved')) {
        setStatus('Error: This institution is not approved. Please ask the token owner to approve this institution first.');
      } else {
        setStatus('Error: ' + (err.reason || err.message || 'Split failed'));
      }
    }
  };

  if (isInstitution === null) {
    return <div className="text-center py-20 text-gray-500">Checking institution access...</div>;
  }
  if (!isInstitution) {
    return <div className="text-center py-20 text-red-600 font-bold text-xl">Access denied: Only institutions can execute split requests.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-24 p-4 md:p-8">
      <h2 className="text-3xl font-bold mb-4">Execute Split Requests</h2>
      <p className="text-gray-600 mb-8">View and execute pending split requests from certificate owners.</p>

      {pendingRequests.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No pending split requests found.</p>
          <p className="text-sm text-gray-500 mt-2">Certificate owners can create split requests from their certificate details page.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request) => (
            <SplitRequestCard
              key={request.id}
              request={request}
              account={account}
              onExecute={handleExecuteSplit}
              executing={status.includes("proses...")}
            />
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
