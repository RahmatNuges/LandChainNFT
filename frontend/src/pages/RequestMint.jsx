import { useState } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import { signMintRequest } from '../utils/eip712';
import { savePendingMintRequest } from '../utils/pendingRequests';

const CONTRACT_ADDRESS = "0x4a0332c599Db448b1A84ebFA59cfD6918B14595d";
const PINATA_API_KEY = "3477e87bd404b5490bbd";
const PINATA_API_SECRET = "e2eb35f6fe50896ab89cda093648ce30e4cdeba62e31d7342f9fd83bcf50be1c";

export default function RequestMint({ account }) {
  const [form, setForm] = useState({
    jalan: '', rt: '', rw: '', desa: '', kecamatan: '', kabupaten: '', provinsi: '',
    luas: '', statusHukum: '', deskripsi: '',
    nomorSuratUkur: '',
    batasUtara: '',
    batasTimur: '',
    batasBarat: '',
    batasSelatan: ''
  });
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [fileName, setFileName] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1: Upload, 2: Sign
  const [cid, setCid] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFile = e => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  const uploadToPinata = async (metadata, file) => {
    let imageCid = null;
    if (file) {
      const data = new FormData();
      data.append('file', file);
      const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', data, {
        headers: {
          'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_API_SECRET
        }
      });
      imageCid = res.data.IpfsHash;
      metadata.image = imageCid;
      metadata.fileCid = imageCid;
    }
    
    const res2 = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', metadata, {
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_API_SECRET
      }
    });
    return res2.data.IpfsHash;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!account) {
      setStatus("Error: Please connect your wallet first.");
      return;
    }
    
    setStatus('Uploading data to IPFS (Pinata)...');
    setCurrentStep(1);
    
    try {
      const metadata = {
        lokasi: {
          jalan: form.jalan, rt: form.rt, rw: form.rw, desa: form.desa, kecamatan: form.kecamatan, kabupaten: form.kabupaten, provinsi: form.provinsi
        },
        luas: form.luas,
        statusHukum: form.statusHukum,
        deskripsi: form.deskripsi,
        nomorSuratUkur: form.nomorSuratUkur,
        batas: {
          utara: form.batasUtara,
          timur: form.batasTimur,
          barat: form.batasBarat,
          selatan: form.batasSelatan
        }
      };

      const uploadedCid = await uploadToPinata(metadata, file);
      setCid(uploadedCid);
      setStatus('Data successfully uploaded to IPFS. Please sign the mint request.');
      setCurrentStep(2);
      
    } catch (err) {
      console.error(err);
      setStatus('Upload failed, please try again');
      setCurrentStep(1);
    }
  };

  const handleSign = async () => {
    if (!account || !cid) {
      setStatus("Error: Missing required data.");
      return;
    }

    setStatus('Requesting signature...');
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = network.chainId;
      
      // Sign as the land owner (account is the recipient)
      const signature = await signMintRequest(
        provider,
        account, // Signer address (must be the recipient)
        account, // to parameter (recipient)
        cid,     // tokenURI
        chainId,
        CONTRACT_ADDRESS
      );

      // Save to localStorage
      const request = savePendingMintRequest({
        to: account,
        tokenURI: cid,
        signature: signature,
        metadata: {
          lokasi: {
            jalan: form.jalan, rt: form.rt, rw: form.rw, desa: form.desa, kecamatan: form.kecamatan, kabupaten: form.kabupaten, provinsi: form.provinsi
          },
          luas: form.luas,
          statusHukum: form.statusHukum,
          deskripsi: form.deskripsi,
          nomorSuratUkur: form.nomorSuratUkur,
          batas: {
            utara: form.batasUtara,
            timur: form.batasTimur,
            barat: form.batasBarat,
            selatan: form.batasSelatan
          }
        }
      });

      setStatus(`Mint request signed and saved! Request ID: ${request.id}. An institution can now execute this mint request.`);
      
      // Reset form
      setForm({ jalan: '', rt: '', rw: '', desa: '', kecamatan: '', kabupaten: '', provinsi: '', luas: '', statusHukum: '', deskripsi: '',
        nomorSuratUkur: '', batasUtara: '', batasTimur: '', batasBarat: '', batasSelatan: '' });
      setFile(null);
      setFileName('');
      setCid('');
      setCurrentStep(1);

    } catch (err) {
      console.error(err);
      if (err.code === 4001) {
        setStatus('Error: Signature request was rejected by user.');
      } else {
        setStatus('Error: ' + (err.reason || err.message || 'Signature failed'));
      }
    }
  };

  const isFormIncomplete = Object.values(form).some(value => value === '') || !file;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 mt-24">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Request Mint Certificate</h1>
      <p className="text-gray-600 mb-8">Fill in all the details below to request a mint certificate. After signing, an institution can execute the mint for you.</p>
      
      {/* Step Indicator */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${currentStep >= 1 ? 'text-teal-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-teal-600 text-white' : 'bg-gray-200'}`}>1</div>
            <span className="ml-2 font-medium">Upload Data</span>
          </div>
          <div className={`flex-1 h-1 mx-4 ${currentStep >= 2 ? 'bg-teal-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center ${currentStep >= 2 ? 'text-teal-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-teal-600 text-white' : 'bg-gray-200'}`}>2</div>
            <span className="ml-2 font-medium">Sign Request</span>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-2xl shadow-lg">
        {/* Informasi Properti */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">1. Property Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div>
              <label htmlFor="statusHukum" className="block text-sm font-medium text-gray-700">Legal Status</label>
              <input type="text" name="statusHukum" id="statusHukum" value={form.statusHukum} onChange={handleChange} placeholder="e.g. SHM, HGB" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" required />
            </div>
            <div>
              <label htmlFor="luas" className="block text-sm font-medium text-gray-700">Land Area (m²)</label>
              <input type="number" name="luas" id="luas" value={form.luas} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" required />
            </div>
          </div>
          <div>
            <label htmlFor="deskripsi" className="block text-sm font-medium text-gray-700">Additional Description</label>
            <textarea name="deskripsi" id="deskripsi" value={form.deskripsi} onChange={handleChange} rows="3" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" placeholder="Additional information about the property..."></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div>
              <label htmlFor="nomorSuratUkur" className="block text-sm font-medium text-gray-700">Land Survey Number & Date</label>
              <input type="text" name="nomorSuratUkur" id="nomorSuratUkur" value={form.nomorSuratUkur} onChange={handleChange} placeholder="e.g. SU.0123/2024" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" required />
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <label className="block text-sm font-medium text-gray-700">Land Boundaries</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="batasUtara" className="block text-xs font-medium text-gray-600">North Boundary</label>
                <input type="text" name="batasUtara" id="batasUtara" value={form.batasUtara} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" required />
              </div>
              <div>
                <label htmlFor="batasTimur" className="block text-xs font-medium text-gray-600">East Boundary</label>
                <input type="text" name="batasTimur" id="batasTimur" value={form.batasTimur} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" required />
              </div>
              <div>
                <label htmlFor="batasBarat" className="block text-xs font-medium text-gray-600">West Boundary</label>
                <input type="text" name="batasBarat" id="batasBarat" value={form.batasBarat} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" required />
              </div>
              <div>
                <label htmlFor="batasSelatan" className="block text-xs font-medium text-gray-600">South Boundary</label>
                <input type="text" name="batasSelatan" id="batasSelatan" value={form.batasSelatan} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" required />
              </div>
            </div>
          </div>
        </div>

        {/* Detail Lokasi */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">2. Location Details</h2>
          <div className="pt-4">
            <label htmlFor="jalan" className="block text-sm font-medium text-gray-700">Street Name</label>
            <input type="text" name="jalan" id="jalan" value={form.jalan} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label htmlFor="rt" className="block text-sm font-medium text-gray-700">RT</label>
              <input type="text" name="rt" id="rt" value={form.rt} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" required />
            </div>
            <div>
              <label htmlFor="rw" className="block text-sm font-medium text-gray-700">RW</label>
              <input type="text" name="rw" id="rw" value={form.rw} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" required />
            </div>
            <div>
              <label htmlFor="desa" className="block text-sm font-medium text-gray-700">Village / Subdistrict</label>
              <input type="text" name="desa" id="desa" value={form.desa} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" required />
            </div>
            <div>
              <label htmlFor="kecamatan" className="block text-sm font-medium text-gray-700">District</label>
              <input type="text" name="kecamatan" id="kecamatan" value={form.kecamatan} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" required />
            </div>
             <div>
              <label htmlFor="kabupaten" className="block text-sm font-medium text-gray-700">Regency / City</label>
              <input type="text" name="kabupaten" id="kabupaten" value={form.kabupaten} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" required />
            </div>
             <div>
              <label htmlFor="provinsi" className="block text-sm font-medium text-gray-700">Province</label>
              <input type="text" name="provinsi" id="provinsi" value={form.provinsi} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" required />
            </div>
          </div>
        </div>

        {/* Upload File */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">3. Digital Document</h2>
          <div className="pt-4">
            <label className="block text-sm font-medium text-gray-700">Upload Image / Scan Document</label>
            <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500">
                    <span>Choose file to upload</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFile} required />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF, PDF up to 10MB</p>
                {fileName && <p className="text-sm font-semibold text-teal-700 mt-2">{fileName}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Tombol Submit dan Status */}
        <div className="pt-5">
          {currentStep === 1 && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isFormIncomplete || status.includes("proses...")}
                className="w-full bg-teal-600 py-3 px-6 border border-transparent rounded-md shadow-sm text-base font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Upload Data to IPFS
              </button>
            </div>
          )}
          
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium mb-2">Data uploaded successfully!</p>
                <p className="text-xs text-blue-700">IPFS CID: {cid}</p>
                <p className="text-sm text-blue-800 mt-2">Please sign the mint request to save it for institution execution.</p>
              </div>
              <button
                type="button"
                onClick={handleSign}
                className="w-full bg-blue-600 py-3 px-6 border border-transparent rounded-md shadow-sm text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Sign Mint Request
              </button>
            </div>
          )}
          
          {status && (
            <div className={`mt-4 p-4 rounded-md text-sm ${status.includes("Error") ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
              {status}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
