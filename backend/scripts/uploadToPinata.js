const axios = require('axios');

async function main() {
  // Ganti dengan API Key dan Secret Anda
  const PINATA_API_KEY = 'bc9530788d8ae530a3ba';
  const PINATA_API_SECRET = '0365ab73ba14479dd8bb59abad986b3456bc8ddec3298569d2daa619191fe86e';

  // Contoh metadata sertifikat tanah
  const metadata = {
    namaPemilik: "Budi Santoso",
    lokasi: {
      jalan: "Jl. Merdeka No. 10",
      rt: "01",
      rw: "02",
      desa: "Sukamaju",
      kecamatan: "Cibadak",
      kabupaten: "Bandung",
      provinsi: "Jawa Barat"
    },
    luas: "200 m2",
    statusHukum: "Hak Milik",
    deskripsi: "Tanah kosong siap bangun."
  };

  try {
    const res = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      metadata,
      {
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_API_SECRET
        }
      }
    );
    console.log('Metadata uploaded to Pinata (IPFS)!');
    console.log('CID:', res.data.IpfsHash);
    console.log('Gateway URL:', `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`);
  } catch (err) {
    console.error('Upload to Pinata failed:', err.response ? err.response.data : err.message);
  }
}

main(); 