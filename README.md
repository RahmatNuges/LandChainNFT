# 🏠 Land Certificate DApp

Sistem Sertifikat Tanah berbasis Blockchain menggunakan NFT (ERC-721). Aplikasi ini memungkinkan institusi yang berwenang untuk menerbitkan sertifikat tanah digital yang aman, dapat diverifikasi, dan mendukung pemecahan sertifikat.

## ✨ Fitur Utama

- **Sertifikat Tanah Digital**: Setiap sertifikat tanah direpresentasikan sebagai NFT (ERC-721)
- **EIP-712 Signature Verification**: Keamanan transaksi dengan typed data signing
- **Multi-Institusi**: Dukungan untuk beberapa institusi yang berwenang
- **Pemecahan Sertifikat**: Kemampuan untuk memecah satu sertifikat menjadi beberapa bagian
- **Tracking Lineage**: Pelacakan hubungan parent-child antar sertifikat

## 🛠️ Tech Stack

### Backend (Smart Contract)
- Solidity ^0.8.0
- Hardhat
- OpenZeppelin Contracts (ERC721, ERC721Enumerable, Ownable, EIP712)

### Frontend
- Vite.js
- React
- Ethers.js

## 📁 Struktur Project

```
LandChainNFT/
├── backend/
│   ├── contracts/
│   │   └── LandCertificate.sol    # Smart contract utama
│   ├── scripts/                    # Deployment scripts
│   └── hardhat.config.js
├── frontend/
│   ├── src/
│   │   ├── config.js              # Centralized configuration
│   │   ├── components/
│   │   └── pages/
│   ├── .env.example               # Template environment variables
│   └── vite.config.js
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- npm atau yarn
- MetaMask atau wallet lainnya
- Pinata Account (untuk IPFS storage) - [Daftar di sini](https://app.pinata.cloud/)

### Instalasi

1. **Clone repository**
   ```bash
   git clone https://github.com/RahmatNuges/LandChainNFT.git
   cd LandChainNFT
   ```

2. **Install dependencies Backend**
   ```bash
   cd backend
   npm install
   ```

3. **Install dependencies Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Setup Environment Variables** ⚠️ **PENTING**
   
   ```bash
   # Copy template environment file
   cp .env.example .env
   ```
   
   Kemudian edit file `.env` dengan nilai yang sesuai:
   
   ```env
   # Smart Contract Configuration
   VITE_CONTRACT_ADDRESS=0x_YOUR_DEPLOYED_CONTRACT_ADDRESS
   
   # Pinata IPFS Configuration (dapatkan dari https://app.pinata.cloud/keys)
   VITE_PINATA_API_KEY=your_pinata_api_key
   VITE_PINATA_API_SECRET=your_pinata_api_secret
   ```

### Menjalankan Development

1. **Jalankan local blockchain**
   ```bash
   cd backend
   npx hardhat node
   ```

2. **Deploy smart contract** (di terminal baru)
   ```bash
   cd backend
   npx hardhat run scripts/deploy.js --network localhost
   ```
   
   > 📝 **Catatan**: Setelah deploy, copy contract address yang muncul dan update `VITE_CONTRACT_ADDRESS` di file `frontend/.env`

3. **Jalankan frontend** (di terminal baru)
   ```bash
   cd frontend
   npm run dev
   ```

4. **Buka browser** dan akses `http://localhost:5173`

## ⚙️ Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_CONTRACT_ADDRESS` | Alamat smart contract yang sudah di-deploy | ✅ Yes |
| `VITE_PINATA_API_KEY` | API Key dari Pinata untuk upload ke IPFS | ✅ Yes |
| `VITE_PINATA_API_SECRET` | API Secret dari Pinata | ✅ Yes |

### Mendapatkan Pinata API Keys

1. Buat akun di [Pinata](https://app.pinata.cloud/)
2. Pergi ke **API Keys** di dashboard
3. Klik **New Key** dan buat key dengan akses `pinFileToIPFS` dan `pinJSONToIPFS`
4. Copy API Key dan Secret ke file `.env`

## 📜 Smart Contract Functions

| Function | Description |
|----------|-------------|
| `mintCertificate` | Menerbitkan sertifikat tanah baru |
| `splitCertificate` | Memecah sertifikat menjadi beberapa bagian |
| `addInstitution` | Menambah institusi yang berwenang |
| `removeInstitution` | Menghapus akses institusi |
| `isActive` | Memeriksa status aktif sertifikat |
| `getChildren` | Mendapatkan daftar sertifikat turunan |

## 🔒 Keamanan

- ✅ Hanya institusi terdaftar yang dapat menerbitkan sertifikat
- ✅ Semua transaksi memerlukan EIP-712 signature dari pemilik
- ✅ Token yang sudah dipecah otomatis dinonaktifkan
- ✅ Sensitive credentials disimpan di environment variables (tidak di-commit ke Git)

## 🐛 Troubleshooting

### "VITE_CONTRACT_ADDRESS is not set"
Pastikan Anda sudah membuat file `.env` di folder `frontend` dan mengisi semua variabel yang diperlukan.

### "Failed to upload to Pinata"
Periksa apakah:
- API Key dan Secret sudah benar
- API Key memiliki permission untuk `pinFileToIPFS` dan `pinJSONToIPFS`

### "Not owner nor approved"
Pastikan:
- Wallet yang terhubung terdaftar sebagai institution
- Owner sertifikat sudah approve institution untuk operasi split

## 📄 License

MIT License

## 👥 Contributing

Kontribusi sangat diterima! Silakan buat Pull Request atau buka Issue untuk diskusi.
