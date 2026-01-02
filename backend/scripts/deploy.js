const { ethers } = require("hardhat");

async function main() {
  const LandCertificate = await ethers.getContractFactory("LandCertificate");
  const contract = await LandCertificate.deploy();
  await contract.deployed();
  console.log("LandCertificate deployed to:", contract.address);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
