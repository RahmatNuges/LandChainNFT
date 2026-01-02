const { ethers } = require("hardhat");

async function main() {
  const contract = await ethers.getContractAt("LandCertificate", "0x546c9b61a16Bf2970d992F6443eA29361103252D");//Alamat kontrak
  await contract.addInstitution("0x8Bf2fA06f44a11E0eca375f51CCA14E4E44B61cE");//Alamat institusi
  console.log("Institusi ditambahkan!");
}

main();