require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.20",
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545", // default Ganache GUI
      accounts: [
        "0xa01ca92565b2c4d8a43ca13d729c94917910e791ec2f7eb1a86536aaa9b31864"
        // Masukkan private key dari salah satu akun Ganache GUI (bisa di-copy dari aplikasi Ganache)
      ]
    }
  }
};