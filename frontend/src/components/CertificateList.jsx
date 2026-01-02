import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import LandCertificateABI from '../abis/LandCertificate.json';
import axios from 'axios';
import { signSplitRequest } from '../utils/eip712';
import { savePendingSplitRequest } from '../utils/pendingRequests';

const CONTRACT_ADDRESS = "0x4a0332c599Db448b1A84ebFA59cfD6918B14595d";
const PINATA_API_KEY = "3477e87bd404b5490bbd";
const PINATA_API_SECRET = "e2eb35f6fe50896ab89cda093648ce30e4cdeba62e31d7342f9fd83bcf50be1c";

export default function CertificateList({ account }) {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [isInstitution, setIsInstitution] = useState(false);

  useEffect(() => {
    if (account) {
        fetchCertificates();
    }
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
  // eslint-disable-next-line
  }, [account]);

  async function fetchCertificates() {
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, LandCertificateABI, provider);
      const balance = await contract.balanceOf(account);
      let certList = [];
      for (let i = 0; i < balance; i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(account, i);
        const tokenURI = await contract.tokenURI(tokenId);
        let meta = {};
        let isActive = true;
        try {
          const url = `https://gateway.pinata.cloud/ipfs/${tokenURI.replace('ipfs://','')}`;
          const res = await fetch(url);
          if (res.ok) {
            meta = await res.json();
          } else {
             console.error(`Failed to fetch metadata from ${url}: ${res.statusText}`);
          }
          isActive = await contract.isActive(tokenId);
        } catch(e) {
            console.error("Failed to parse JSON metadata", e)
        }
        certList.push({ tokenId: tokenId.toString(), tokenURI, meta, isActive });
      }
      setCerts(certList);
    } catch (err) {
      console.error("Failed to fetch certificates:", err);
      setCerts([]);
    }
    setLoading(false);
  }
  
  // Fungsi untuk fetch NFT by tokenId (dari blockchain & IPFS)
  async function fetchNFTById(tokenId) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, LandCertificateABI, provider);
      const tokenURI = await contract.tokenURI(tokenId);
      let meta = {};
      try {
        const url = `https://gateway.pinata.cloud/ipfs/${tokenURI.replace('ipfs://','')}`;
        const res = await fetch(url);
        if (res.ok) {
          meta = await res.json();
        }
      } catch(e) {}
      return { tokenId: tokenId.toString(), tokenURI, meta };
    } catch (err) {
      return null;
    }
  }

  if (selectedCert) {
    const cert = selectedCert;
    return (
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
        <button
          onClick={() => setSelectedCert(null)}
          className="mb-6 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded-lg shadow-sm inline-flex items-center transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Property List
        </button>
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg max-w-4xl mx-auto">
          <NFTDetail cert={cert} fetchNFTById={fetchNFTById} />
          <ActivitySection tokenId={cert.tokenId} />
          <ContractAddressSection />
          <div className="mt-8 border-t pt-6">
            <TransferButton tokenId={cert.tokenId} />
          </div>
          <div className="mt-6">
            <SplitButton tokenId={cert.tokenId} cert={cert} account={account} isInstitution={isInstitution} institutionAddress={account} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Your Properties</h2>
      {loading && <div className="text-center text-gray-500 py-10">Loading Properties...</div>}
      {!loading && certs.length === 0 && (
        <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-lg">
          <p className="text-lg font-medium">You don't have any properties yet.</p>
          <p className="mt-2 text-sm">Please create a new certificate to start.</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {certs.map(cert => (
          <div
            key={cert.tokenId}
            onClick={() => setSelectedCert(cert)}
            className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1 flex flex-col relative"
          >
            {!cert.isActive && (
              <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-10">
                Inactive
              </div>
            )}
            <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
              {cert.meta.image ? (
                <img src={`https://gateway.pinata.cloud/ipfs/${cert.meta.image.replace('ipfs://','')}`} alt={cert.meta.namaPemilik || 'Property Picture'} className="w-full h-full object-cover"/>
              ) : (
                <svg xmlns="http://www.w3.org/2000" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              )}
            </div>
            <div className="p-4 flex-grow flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-lg text-gray-800 truncate" >{'LAND #' + cert.tokenId || 'No Name'}</h3>
              </div>
              <div className="mt-2">
                <p className="text-xs text-gray-600 truncate">{cert.meta.lokasi?.kabupaten || 'Location not Found'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Komponen TransferButton
function TransferButton({ tokenId }) {
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');
  const handleTransfer = async () => {
    if (!to || !ethers.isAddress(to)) {
        setStatus('Error: Address is not valid.');
        return;
    }
    setStatus('Sending transaction...');
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      // PERBAIKAN: Menggunakan LandCertificateABI langsung, tanpa .abi
      const contract = new ethers.Contract(CONTRACT_ADDRESS, LandCertificateABI, signer);
      const tx = await contract.transferFrom(await signer.getAddress(), to, tokenId);
      setStatus('Waiting for transaction confirmation: ' + tx.hash);
      await tx.wait();
      setStatus('Transfer successful!');
      // TODO: Idealnya, panggil ulang fetchCertificates daripada reload
      setTimeout(() => window.location.reload(), 2000); 
    } catch (err) {
      console.error(err);
      setStatus('Error: ' + (err.reason || err.message));
    }
  };
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-gray-700">Ownership Transfer</h3>
      <div className="flex items-center space-x-2">
        <input value={to} onChange={e=>setTo(e.target.value)} placeholder="Destination Address" className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500" />
        <button onClick={handleTransfer} className="bg-teal-600 text-white font-bold py-2 px-4 rounded-md hover:bg-teal-700 transition-colors">Transfer</button>
      </div>
      {status && <div className="text-sm text-gray-600 mt-2">{status}</div>}
    </div>
  );
}

// Komponen SplitButton
function SplitButton({ tokenId, cert, account, isInstitution, institutionAddress }) {
  const [show, setShow] = useState(false);
  const [numChildren, setNumChildren] = useState(2);
  const [recipients, setRecipients] = useState(Array(2).fill(''));
  const [metas, setMetas] = useState(Array(2).fill(null).map(() => ({
    lokasi: { ...cert.meta.lokasi },
    luas: '', 
    statusHukum: cert.meta.statusHukum || '',
    deskripsi: cert.meta.deskripsi || '',
    nomorSuratUkur: '',
    batasUtara: '',
    batasTimur: '',
    batasBarat: '',
    batasSelatan: '',
    file: null,
    fileCid: cert.meta.fileCid || '',
    image: cert.meta.image || ''
  })));
  const [status, setStatus] = useState('');
  const [approvalStatus, setApprovalStatus] = useState(''); // Separate status for approval
  const [error, setError] = useState('');
  const [isApproved, setIsApproved] = useState(null);
  const [ownerAddress, setOwnerAddress] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Upload, 2: Approval, 3: Signature, 4: Success & Approval
  const [institutionToApprove, setInstitutionToApprove] = useState(''); // For owner to input institution address

  const handleNumChildren = (val) => {
    const n = Math.max(2, parseInt(val) || 2);
    setNumChildren(n);

    const newRecipients = [...recipients];
    const newMetas = [...metas];
    while (newRecipients.length < n) newRecipients.push('');
    while (newMetas.length < n) newMetas.push({
      lokasi: { ...cert.meta.lokasi },
      luas: '', 
      statusHukum: cert.meta.statusHukum || '',
      deskripsi: cert.meta.deskripsi || '',
      nomorSuratUkur: '',
      batasUtara: '',
      batasTimur: '',
      batasBarat: '',
      batasSelatan: '',
      file: null,
      fileCid: cert.meta.fileCid || '',
      image: cert.meta.image || ''
    });

    setRecipients(newRecipients.slice(0, n));
    setMetas(newMetas.slice(0, n));
  };
  
  const handleRecipient = (i, val) => {
    const arr = [...recipients];
    arr[i] = val;
    setRecipients(arr);
  };
  
  const handleMeta = (i, field, val) => {
    const arr = [...metas];
    if (field.startsWith('lokasi.')) {
        const lokField = field.split('.')[1];
        arr[i].lokasi[lokField] = val;
    } else {
        arr[i][field] = val;
    }
    setMetas(arr);
    validateLuas();
  };
  
  const handleFile = (i, file) => {
    const arr = [...metas];
    arr[i].file = file;
    arr[i].image = file; // Asumsikan file yg diupload adalah gambar
    setMetas(arr);
  };

  // Check approval status and ownership when form is shown
  useEffect(() => {
    if (!show || !account) return;
    
    const checkApproval = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, LandCertificateABI, provider);
        const owner = await contract.ownerOf(tokenId);
        setOwnerAddress(owner);
        
        const isTokenOwner = owner.toLowerCase() === account.toLowerCase();
        setIsOwner(isTokenOwner);
        
        // Only check approval if institution is trying to split
        const institutionAddr = institutionAddress || account;
        if (isInstitution && !isTokenOwner) {
          const approved = await contract.getApproved(tokenId);
          const isApprovedForAll = await contract.isApprovedForAll(owner, institutionAddr);
          
          setIsApproved(approved.toLowerCase() === institutionAddr.toLowerCase() || isApprovedForAll);
        } else if (isTokenOwner && isInstitution) {
          // Owner is also institution, no approval needed
          setIsApproved(true);
        } else {
          setIsApproved(null); // Not applicable
        }
      } catch (err) {
        console.error('Error checking approval:', err);
        setIsApproved(false);
      }
    };
    
    checkApproval();
  }, [show, account, isInstitution, tokenId, institutionAddress]);

  const handleApprove = async () => {
    if (!account || !isOwner) {
      setStatus('Error: Only the certificate owner can approve.');
      return;
    }
    
    // Determine which institution to approve
    // If institutionAddress is provided, use it; otherwise use account if it's an institution
    const institutionToApprove = institutionAddress || (isInstitution ? account : null);
    
    if (!institutionToApprove) {
      setStatus('Error: Institution address is required for approval.');
      return;
    }
    
    setStatus('Requesting approval...');
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, LandCertificateABI, signer);
      const tx = await contract.approve(institutionToApprove, tokenId);
      setStatus('Waiting for approval transaction...');
      await tx.wait();
      setStatus('Approval successful!');
      setIsApproved(true);
      setCurrentStep(2);
    } catch (err) {
      console.error(err);
      setStatus('Error: ' + (err.reason || err.message || 'Approval failed'));
    }
  };

  const validateLuas = () => {
    const total = metas.reduce((sum, m) => sum + (parseFloat(m.luas) || 0), 0);
    const parentLuas = parseFloat(cert.meta.luas) || 0;
    if (total !== parentLuas) {
      setError(`Total child area (${total} m²) is not equal to parent area (${parentLuas} m²)!`);
      return false;
    }
    setError('');
    return true;
  };
  
  const uploadToPinata = async (meta, file) => {
    let finalMeta = { ...meta };
    delete finalMeta.file;

    // Gabungkan batas ke dalam satu objek
    finalMeta.nomorSuratUkur = meta.nomorSuratUkur;
    finalMeta.batas = {
      utara: meta.batasUtara,
      timur: meta.batasTimur,
      barat: meta.batasBarat,
      selatan: meta.batasSelatan
    };
    delete finalMeta.batasUtara;
    delete finalMeta.batasTimur;
    delete finalMeta.batasBarat;
    delete finalMeta.batasSelatan;

    if (file) {
      const data = new FormData();
      data.append('file', file);
      const resFile = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_API_SECRET
        }
      });
      finalMeta.image = resFile.data.IpfsHash;
      finalMeta.fileCid = resFile.data.IpfsHash;
    }

    const resJson = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', finalMeta, {
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_API_SECRET
      }
    });
    return resJson.data.IpfsHash;
  };

  const handleSplit = async () => {
    if (!validateLuas()) return;

    for(let i=0; i<recipients.length; i++) {
        if (!recipients[i] || !ethers.isAddress(recipients[i])) {
            setStatus(`Error: Destination Address #${i+1} is not valid.`);
            return;
        }
        if(!metas[i].luas || parseFloat(metas[i].luas) <= 0) {
            setStatus(`Error: Total Child Area #${i+1} Must be greater than 0.`);
            return;
        }
    }

    // Only owner can create split request
    if (!isOwner || !account) {
      setStatus('Error: Only the certificate owner can create split requests.');
      return;
    }

    // Note: Approval is not required for owner to create and sign split request
    // Approval will be needed later when institution executes the split

    setStatus('Uploading metadata to Pinata...');
    setCurrentStep(1);
    try {
      // Tambahkan parentTokenId ke setiap metadata anak
      const cids = await Promise.all(metas.map(m => {
        const metaWithParent = { ...m, parentTokenId: tokenId };
        delete metaWithParent.file; // Remove file object before upload
        return uploadToPinata(metaWithParent, m.file);
      }));
      
      setStatus('Metadata uploaded. Requesting owner signature...');
      setCurrentStep(3);
      
      // Request signature from owner
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = network.chainId;
      
      const signature = await signSplitRequest(
        provider,
        account, // Signer must be the owner (account is owner)
        tokenId,
        recipients,
        cids,
        chainId,
        CONTRACT_ADDRESS
      );

      // Save to localStorage for institution to execute later
      const request = savePendingSplitRequest({
        parentId: tokenId.toString(),
        recipients: recipients,
        tokenURIs: cids,
        signature: signature,
        ownerAddress: account,
        metadata: metas.map(m => ({
          luas: m.luas,
          statusHukum: m.statusHukum,
          deskripsi: m.deskripsi,
          nomorSuratUkur: m.nomorSuratUkur,
          batas: {
            utara: m.batasUtara,
            timur: m.batasTimur,
            barat: m.batasBarat,
            selatan: m.batasSelatan
          }
        }))
      });

      setStatus(`Split request signed and saved! Request ID: ${request.id}.`);
      
      // Don't close form yet - show approval section
      setCurrentStep(4); // Step 4: Approval needed
    } catch (err) {
      console.error(err);
      if (err.code === 4001) {
        setStatus('Error: Signature request was rejected by user.');
      } else {
        setStatus('Error: ' + (err.reason || (err.response ? JSON.stringify(err.response.data) : err.message)));
      }
    }
  };

  return (
    <div className="space-y-2">
      <button onClick={()=>setShow(!show)} className="w-full bg-gray-700 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-800 transition-colors flex justify-center items-center">
        {show ? 'Close Split Form' : 'Split Certificate'}
      </button>
      {show && (
        <div className="text-sm border border-gray-200 bg-gray-50 p-4 rounded-lg mt-2 space-y-6">
          {/* Info: Owner can fill form, Institution can execute */}
          {!isOwner && !isInstitution && (
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
              <p className="text-sm text-gray-700">Only the certificate owner can create split requests.</p>
            </div>
          )}
          
          {(isOwner || isInstitution) && (
            <>
              {/* Approval Status - Only show if institution is not the owner */}
              {!isOwner && isApproved === false && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 font-medium mb-2">Approval Required</p>
                  <p className="text-xs text-yellow-700 mb-3">The certificate owner ({ownerAddress.slice(0, 6)}...{ownerAddress.slice(-4)}) must approve this institution ({account.slice(0, 6)}...{account.slice(-4)}) before splitting.</p>
                  <p className="text-xs text-yellow-700 italic mt-2">Please have the owner connect their wallet to approve this institution.</p>
                  {status && <div className="text-xs text-yellow-700 mt-2">{status}</div>}
                </div>
              )}
              
              {/* Show approve button for owner if institutionAddress is provided */}
              {isOwner && isApproved === false && institutionAddress && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 font-medium mb-2">Optional: Approve Institution</p>
                  <p className="text-xs text-blue-700 mb-3">You can approve the institution now, or later before they execute the split. This is optional for creating the split request.</p>
                  <button
                    onClick={handleApprove}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Approve Institution (Optional)
                  </button>
                  {status && <div className="text-xs text-blue-700 mt-2">{status}</div>}
                </div>
              )}
              
              {isOwner && isApproved === true && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 font-medium">✓ Institution Approved</p>
                  <p className="text-xs text-green-700 mt-1">The institution can execute this split request.</p>
                </div>
              )}
              
              {isOwner && isApproved === null && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">You can create and sign the split request. Approval from institution can be done later if needed.</p>
                </div>
              )}
            </>
          )}

          <div>
            <label className="font-semibold text-gray-700">Number of Child Certificates</label>
            <input type="number" min={2} value={numChildren} onChange={e=>handleNumChildren(e.target.value)} className="mt-1 w-24 p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500" />
            {error && <div className="text-red-600 mt-2">{error}</div>}
          </div>
          
          {[...Array(numChildren)].map((_,i)=>(
            <div key={i} className="p-4 border-t border-gray-200 space-y-3">
              <h4 className="font-bold text-md text-teal-700">Child #{i+1}</h4>
              <div>
                <label className="block text-xs font-medium text-gray-600">Receiver Address</label>
                <input value={recipients[i]} onChange={e=>handleRecipient(i, e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Total Area (m²)</label>
                  <input type="number" value={metas[i].luas} onChange={e=>handleMeta(i, 'luas', e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Legal Status</label>
                  <input value={metas[i].statusHukum} onChange={e=>handleMeta(i, 'statusHukum', e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">Description</label>
                <textarea value={metas[i].deskripsi} onChange={e=>handleMeta(i, 'deskripsi', e.target.value)} rows="2" className="mt-1 w-full border border-gray-300 rounded-md" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Land Survey Number & Date</label>
                  <input type="text" value={metas[i].nomorSuratUkur} onChange={e=>handleMeta(i, 'nomorSuratUkur', e.target.value)} placeholder="cth. SU.0123/2024" className="mt-1 w-full border border-gray-300 rounded-md" />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-medium text-gray-600">Land Boundaries</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600">North Boundary</label>
                    <input type="text" value={metas[i].batasUtara} onChange={e=>handleMeta(i, 'batasUtara', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600">East Boundary</label>
                    <input type="text" value={metas[i].batasTimur} onChange={e=>handleMeta(i, 'batasTimur', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600">West Boundary</label>
                    <input type="text" value={metas[i].batasBarat} onChange={e=>handleMeta(i, 'batasBarat', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600">South Boundary</label>
                    <input type="text" value={metas[i].batasSelatan} onChange={e=>handleMeta(i, 'batasSelatan', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md" />
                  </div>
                </div>
              </div>
              {/* Sisakan field lain jika diperlukan, atau bisa di-autofill dari parent */}
              <div>
                <label className="block text-xs font-medium text-gray-600">Upload New Image/Document (Optional)</label>
                <input type="file" onChange={e=>handleFile(i, e.target.files[0])} className="mt-1 w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"/>
              </div>
            </div>
          ))}

          {/* Success Message & Approval Section */}
          {currentStep === 4 && status.includes("signed and saved") && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
              <div>
                <p className="text-sm text-green-800 font-medium">✓ Split Request Created Successfully!</p>
                <p className="text-xs text-green-700 mt-1">Your split request has been signed and saved. An institution can now execute it.</p>
              </div>
              
              {/* Approval Section - After Split Request Created */}
              {isOwner && !isApproved && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-sm text-blue-800 font-medium mb-2">⚠ Approval Required for Institution</p>
                    <p className="text-xs text-blue-700 mb-3">
                      To allow an institution to execute this split request, you need to approve them first. Enter the institution address below and approve.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Institution Address</label>
                    <input
                      type="text"
                      value={institutionToApprove || institutionAddress || ''}
                      onChange={(e) => setInstitutionToApprove(e.target.value)}
                      placeholder="0x..."
                      className="w-full p-2 border border-blue-300 rounded-md text-sm"
                    />
                    <p className="text-xs text-blue-600 mt-1">Enter the address of the institution that will execute this split</p>
                  </div>
                  
                  <button
                    onClick={async () => {
                      const targetInstitution = institutionToApprove || institutionAddress;
                      if (!targetInstitution || !ethers.isAddress(targetInstitution)) {
                        setApprovalStatus('Error: Please enter a valid institution address.');
                        return;
                      }
                      
                      setApprovalStatus('Requesting approval...');
                      try {
                        const provider = new ethers.BrowserProvider(window.ethereum);
                        const signer = await provider.getSigner();
                        const contract = new ethers.Contract(CONTRACT_ADDRESS, LandCertificateABI, signer);
                        const tx = await contract.approve(targetInstitution, tokenId);
                        setApprovalStatus('Waiting for approval transaction...');
                        await tx.wait();
                        // Reload approval status after approval
                        const approved = await contract.getApproved(tokenId);
                        const isApprovedForAll = await contract.isApprovedForAll(ownerAddress, targetInstitution);
                        setIsApproved(approved.toLowerCase() === targetInstitution.toLowerCase() || isApprovedForAll);
                        
                        setApprovalStatus('✓ Approval successful! The institution can now execute your split request.');
                      } catch (err) {
                        console.error(err);
                        setApprovalStatus('Error: ' + (err.reason || err.message || 'Approval failed'));
                      }
                    }}
                    disabled={!institutionToApprove && !institutionAddress || approvalStatus.includes("Waiting") || approvalStatus.includes("Requesting")}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium w-full disabled:bg-gray-400"
                  >
                    Approve Institution
                  </button>
                  {approvalStatus && <div className={`text-xs mt-2 ${approvalStatus.includes("Error") ? 'text-red-700' : approvalStatus.includes("✓") ? 'text-green-700' : 'text-blue-700'}`}>{approvalStatus}</div>}
                </div>
              )}
              
              {isOwner && isApproved === true && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 font-medium">✓ Institution Approved</p>
                  <p className="text-xs text-green-700 mt-1">The institution can now execute your split request.</p>
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShow(false);
                    setCurrentStep(1);
                    setStatus('');
                  }}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  Close Form
                </button>
              </div>
            </div>
          )}

          {/* Split Request Button - Only show if not in step 4 */}
          {currentStep !== 4 && (
            <div className="pt-4">
              <button 
                onClick={handleSplit} 
                disabled={!!error || !isOwner || !!status.includes("Waiting") || !!status.includes("Uploading") || !!status.includes("Requesting") || !!status.includes("signed and saved")} 
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {!isOwner ? 'Owner Only' : 'Create Split Request & Sign'}
              </button>
              {status && !status.includes("signed and saved") && <div className={`text-center text-sm mt-2 ${status.includes("Error") ? 'text-red-600' : 'text-gray-600'}`}>{status}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Activity Section Component
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
    <div className="mt-10">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-lg font-bold text-gray-700 hover:text-teal-600 focus:outline-none mb-2"
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M12 5v14m7-7H5"/></svg>
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

// Tambahkan komponen ContractAddressSection
function ContractAddressSection() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-lg font-bold text-gray-700 hover:text-teal-600 focus:outline-none mb-2"
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M12 5v14m7-7H5"/></svg>
        Contract Address
        <span className="ml-2 text-xs font-normal text-gray-400">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm break-all">{CONTRACT_ADDRESS}</span>
            <button
              className="ml-2 px-2 py-1 text-xs bg-teal-600 text-white rounded hover:bg-teal-700"
              onClick={() => {navigator.clipboard.writeText(CONTRACT_ADDRESS)}}
            >Copy</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Tambahkan komponen rekursif untuk detail NFT
function NFTDetail({ cert, fetchNFTById, onBack }) {
  const [parentCert, setParentCert] = useState(null);
  const [loadingParent, setLoadingParent] = useState(false);
  const [owner, setOwner] = useState('');

  useEffect(() => {
    async function fetchOwner() {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, LandCertificateABI, provider);
        const ownerAddr = await contract.ownerOf(cert.tokenId);
        setOwner(ownerAddr);
      } catch (e) {
        setOwner('');
      }
    }
    fetchOwner();
  }, [cert.tokenId]);

  const handleParentClick = async (parentTokenId) => {
    setLoadingParent(true);
    const parent = await fetchNFTById(parentTokenId);
    setParentCert(parent);
    setLoadingParent(false);
  };

  return (
    <div className="border-l-4 border-teal-300 pl-4 mt-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Detail Certificate #{cert.tokenId}</h2>
        {onBack && (
          <button onClick={onBack} className="text-xs text-gray-500 hover:underline">Back</button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-2">
        <div>
          <p className="text-sm font-medium text-gray-500">Owner Wallet Address</p>
          <p className="text-lg text-gray-800 font-mono">{owner.slice(0,6)}...{owner.slice(-4)}</p>
        </div>
        {/* <div>
          <p className="text-sm font-medium text-gray-500">Nama Pemilik</p>
          <p className="text-lg text-gray-800">{cert.meta.namaPemilik}</p>
        </div> */}
        <div>
          <p className="text-sm font-medium text-gray-500">Area</p>
          <p className="text-lg text-gray-800">{cert.meta.luas} m²</p>
        </div>
        {cert.meta.parentTokenId && (
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-teal-700">
              Split from certificate
              <button
                className="ml-1 text-blue-600 underline hover:text-blue-800"
                onClick={() => handleParentClick(cert.meta.parentTokenId)}
                disabled={loadingParent}
              >
                #{cert.meta.parentTokenId}
              </button>
              {loadingParent && <span className="ml-2 text-xs text-gray-400">(loading...)</span>}
            </p>
          </div>
        )}
        <div className="md:col-span-2">
          <p className="text-sm font-medium text-gray-500">Location</p>
          <p className="text-lg text-gray-800">{cert.meta.lokasi ? `${cert.meta.lokasi.jalan}, RT ${cert.meta.lokasi.rt}/RW ${cert.meta.lokasi.rw}, ${cert.meta.lokasi.desa}, ${cert.meta.lokasi.kecamatan}, ${cert.meta.lokasi.kabupaten}, ${cert.meta.lokasi.provinsi}` : '-'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Legal Status</p>
          <p className="text-lg text-gray-800">{cert.meta.statusHukum}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-sm font-medium text-gray-500">Description</p>
          <p className="text-gray-800">{cert.meta.deskripsi}</p>
        </div>
        {cert.meta.nomorSuratUkur && (
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-gray-500">Land Survey Number & Date</p>
            <p className="text-gray-800">{cert.meta.nomorSuratUkur}</p>
          </div>
        )}
        {cert.meta.batas && (
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-gray-500">Land Boundaries</p>
            <ul className="text-gray-800 text-sm list-disc ml-6">
              <li>North Boundary: {cert.meta.batas.utara}</li>
              <li>East Boundary: {cert.meta.batas.timur}</li>
              <li>West Boundary: {cert.meta.batas.barat}</li>
              <li>South Boundary: {cert.meta.batas.selatan}</li>
            </ul>
          </div>
        )}
        {cert.meta.fileCid && (
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-gray-500">Document/Image</p>
            <a href={`https://gateway.pinata.cloud/ipfs/${cert.meta.fileCid}`} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
              View File on IPFS
            </a>
          </div>
        )}
        
      </div>
      
      {/* Tampilkan Children Section */}
      <ChildrenSection tokenId={cert.tokenId} fetchNFTById={fetchNFTById} />
      
      {/* Rekursif tampilkan parent jika ada dan sudah di-load */}
      {parentCert && (
        <div className="mt-8">
          <NFTDetail cert={parentCert} fetchNFTById={fetchNFTById} onBack={() => setParentCert(null)} />
          <ActivitySection tokenId={parentCert.tokenId} />
        </div>
      )}
    </div>
  );
}

// Komponen ChildrenSection untuk menampilkan sertifikat anak-anak
function ChildrenSection({ tokenId, fetchNFTById }) {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, LandCertificateABI, provider);
        const childIds = await contract.getChildren(tokenId);
        // Fetch metadata dan owner untuk setiap child
        const childrenData = await Promise.all(
          childIds.map(async (childId) => {
            const child = await fetchNFTById(childId.toString());
            let ownerAddress = '';
            try {
              ownerAddress = await contract.ownerOf(childId);
            } catch (e) {
              ownerAddress = '';
            }
            return { ...child, ownerAddress };
          })
        );
        setChildren(childrenData.filter(child => child !== null));
      } catch (err) {
        console.error("Error fetching children:", err);
        setChildren([]);
      }
      setLoading(false);
    })();
  }, [open, tokenId, fetchNFTById]);

  return (
    <div className="mt-8">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-lg font-bold text-gray-700 hover:text-teal-600 focus:outline-none mb-2"
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M12 5v14m7-7H5"/></svg>
        Children Certificates
        <span className="ml-2 text-xs font-normal text-gray-400">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          {loading && <div className="text-gray-500">Loading children certificates...</div>}
          {!loading && children.length === 0 && (
            <div className="text-gray-400">No child certificates yet.</div>
          )}
          {!loading && children.length > 0 && (
            <div className="space-y-4">
              {children.map((child, index) => (
                <div key={child.tokenId} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">Child #{child.tokenId}</h4>
                      <p className="text-sm text-gray-600">Owner: {child.ownerAddress ? `${child.ownerAddress.slice(0,6)}...${child.ownerAddress.slice(-4)}` : '-'}</p>
                      <p className="text-sm text-gray-600">Area: {child.meta.luas} m²</p>
                      <p className="text-sm text-gray-600">Location: {child.meta.lokasi?.kabupaten || 'N/A'}</p>
                    </div>
                    <button
                      onClick={() => {
                        // Navigate ke detail child certificate
                        window.location.href = `/certificates?tokenId=${child.tokenId}`;
                      }}
                      className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                    >
                      View Detail
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 