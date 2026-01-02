import { Link } from 'react-router-dom';

function CertificateCard() {
  return (
    <div className="bg-white rounded-lg border-4 border-yellow-400 p-6 shadow-2xl relative">
      {/* NFT Badge */}
      <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-10">
        NFT
      </div>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-xl text-green-800">Land Certificate NFT</h3>
          <p className="text-green-600 text-xs">Digital & Verifiable on Blockchain</p>
        </div>
      </div>
      <hr className="my-3" />
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-400">Token ID</p>
          <p className="font-semibold text-gray-800">#12345</p>
        </div>
        <div>
          <p className="text-gray-400">Area</p>
          <p className="font-semibold text-gray-800">250 m²</p>
        </div>
        <div>
          <p className="text-gray-400">Owner Address</p>
          <p className="font-mono text-green-700">0x1234...5678</p>
        </div>
        <div>
          <p className="text-gray-400">Issued</p>
          <p className="font-semibold text-gray-800">15/06/2022</p>
        </div>
      </div>
      <div className="absolute -bottom-5 -right-5 bg-yellow-500 text-white px-4 py-1 rounded-full font-semibold text-sm shadow-lg transform rotate-6">
        Verified NFT
      </div>
    </div>
  )
}

export default function Home({ connectWallet, account }) {
  return (
    <div className="bg-green-600 w-full h-screen pt-30 pb-24">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center px-8">
        <div className="text-white">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
          NFT-Based Digital Land Certificate
          </h1>
          <p className="text-base md:text-lg text-green-100 mb-8">
          Transform your conventional land certificates into secure and unparalleled digital assets on the blockchain. 
          LandChain delivers unique and verified land certificates in the form of NFTs (Non-Fungible Tokens), 
          giving you full control, transparency, and maximum security over your property. 
          Experience the property ownership revolution in Indonesia.
          </p>
          <div className="flex gap-4">
            {account && (
              <Link to="/certificates" className="bg-white text-green-700 font-bold py-3 px-6 rounded-lg shadow-md hover:bg-green-50 transition">
                View My Properties
              </Link>
            )}
            {!account && (
            <button onClick={connectWallet} className="bg-transparent border-2 border-white text-white font-bold py-3 px-6 rounded-lg hover:bg-white hover:text-green-700 transition">
              Get Started
            </button>
            )}
          </div>
        </div>
        <div>
          <CertificateCard />
        </div>
      </div>
    </div>
  );
}
