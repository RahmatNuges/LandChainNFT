import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import LandCertificateABI from '../abis/LandCertificate.json';
import { config } from '../config';

const { CONTRACT_ADDRESS } = config;

export default function AdminPage({ account }) {
  const [isContractOwner, setIsContractOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newInstitutionAddress, setNewInstitutionAddress] = useState('');
  const [removeInstitutionAddress, setRemoveInstitutionAddress] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    checkContractOwner();
  }, [account]);

  const checkContractOwner = async () => {
    if (!account) {
      setIsContractOwner(false);
      setLoading(false);
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, LandCertificateABI, provider);
      const owner = await contract.owner();
      const isOwner = owner.toLowerCase() === account.toLowerCase();
      setIsContractOwner(isOwner);
    } catch (e) {
      console.error('Error checking contract owner:', e);
      setIsContractOwner(false);
    }
    setLoading(false);
  };

  const addInstitution = async () => {
    if (!newInstitutionAddress || !ethers.isAddress(newInstitutionAddress)) {
      setStatus('Error: Please enter a valid address');
      return;
    }

    setStatus('Adding institution...');
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, LandCertificateABI, signer);
      const tx = await contract.addInstitution(newInstitutionAddress);
      setStatus('Waiting for transaction confirmation...');
      await tx.wait();
      setStatus('Institution added successfully!');
      setNewInstitutionAddress('');
    } catch (err) {
      console.error(err);
      setStatus('Error: ' + (err.reason || err.message));
    }
  };

  const removeInstitution = async () => {
    if (!removeInstitutionAddress || !ethers.isAddress(removeInstitutionAddress)) {
      setStatus('Error: Please enter a valid address');
      return;
    }

    setStatus('Removing institution...');
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, LandCertificateABI, signer);
      const tx = await contract.removeInstitution(removeInstitutionAddress);
      setStatus('Waiting for transaction confirmation...');
      await tx.wait();
      setStatus('Institution removed successfully!');
      setRemoveInstitutionAddress('');
    } catch (err) {
      console.error(err);
      setStatus('Error: ' + (err.reason || err.message));
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Checking admin access...</div>;
  }

  if (!isContractOwner) {
    return <div className="text-center py-20 text-red-600 font-bold text-xl">Access denied: Only contract owner can access this page.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 mt-24 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>

      {/* Add Institution */}
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Add New Institution</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={newInstitutionAddress}
            onChange={(e) => setNewInstitutionAddress(e.target.value)}
            placeholder="Enter institution address (0x...)"
            className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
          />
          <button
            onClick={addInstitution}
            className="bg-teal-600 text-white px-6 py-3 rounded-md hover:bg-teal-700 transition-colors"
          >
            Add Institution
          </button>
        </div>
      </div>

      {/* Remove Institution */}
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Remove Institution</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={removeInstitutionAddress}
            onChange={(e) => setRemoveInstitutionAddress(e.target.value)}
            placeholder="Enter institution address (0x...)"
            className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
          />
          <button
            onClick={removeInstitution}
            className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition-colors"
          >
            Remove Institution
          </button>
        </div>
      </div>

      {/* Status Message */}
      {status && (
        <div className={`p-4 rounded-md text-sm ${status.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
          {status}
        </div>
      )}
    </div>
  );
} 