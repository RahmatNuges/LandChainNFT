const { ethers } = require("hardhat");

async function main() {
  // Ganti dengan alamat kontrak hasil deploy
  const contractAddress = "0x225ADC6049a8b271ac5B00B226A80Af178e12BC3";
  // Ganti dengan alamat penerima NFT (bisa dari akun Ganache)
  const recipient = "0xB65DE78b8cF976696781c01A7bDBF92BD44Bac25";
  // Ganti dengan CID IPFS metadata sertifikat tanah
  const tokenURI = "CID_IPFS";

  const LandCertificate = await ethers.getContractAt("LandCertificate", contractAddress);
  const tx = await LandCertificate.mintCertificate(recipient, tokenURI);
  const receipt = await tx.wait();
  console.log("Minted! Transaction hash:", receipt.transactionHash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 