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

## 📁 Struktur Project

```
Web3.0/
├── backend/
│   ├── contracts/
│   │   └── LandCertificate.sol    # Smart contract utama
│   ├── scripts/                    # Deployment scripts
│   └── hardhat.config.js
├── frontend/
│   ├── src/
│   ├── public/
│   └── vite.config.js
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- npm atau yarn
- MetaMask atau wallet lainnya

### Instalasi

1. **Clone repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Web3.0.git
   cd Web3.0
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

### Menjalankan Development

1. **Jalankan local blockchain**
   ```bash
   cd backend
   npx hardhat node
   ```

2. **Deploy smart contract**
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

3. **Jalankan frontend**
   ```bash
   cd frontend
   npm run dev
   ```

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

- Hanya institusi terdaftar yang dapat menerbitkan sertifikat
- Semua transaksi memerlukan EIP-712 signature dari pemilik
- Token yang sudah dipecah otomatis dinonaktifkan

## 📄 License

MIT License

## 👥 Contributing

Kontribusi sangat diterima! Silakan buat Pull Request atau buka Issue untuk diskusi.
