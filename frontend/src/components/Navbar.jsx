import { NavLink } from 'react-router-dom';
import HomeIcon from '../icons/HomeIcon';
import GridIcon from '../icons/GridIcon';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import ClockIcon from '../icons/ClockIcon';
import WalletIcon from '../icons/WalletIcon';
import ShieldIcon from '../icons/ShieldIcon';
import SearchIcon from '../icons/SearchIcon';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import LandCertificateABI from '../abis/LandCertificate.json';

export default function Navbar({ account, connectWallet }) {
  const activeLink = 'bg-green-100 text-green-800';
  const normalLink = 'hover:bg-green-50 hover:text-green-800';
  const [isInstitution, setIsInstitution] = useState(false);
  const [isContractOwner, setIsContractOwner] = useState(false);

  useEffect(() => {
    async function checkInstitution() {
      if (!account) {
        setIsInstitution(false);
        setIsContractOwner(false);
        return;
      }
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(
          "0x4a0332c599Db448b1A84ebFA59cfD6918B14595d",
          LandCertificateABI,
          provider
        );
        
        // Check if user is institution
        const allowed = await contract.isInstitution(account);
        setIsInstitution(allowed);
        console.log('Is Institution:', allowed, 'Account:', account);
        
        // Check if user is contract owner
        const owner = await contract.owner();
        const normalizedOwner = ethers.getAddress(owner); // Ensure checksum format
        const normalizedAccount = ethers.getAddress(account); // Ensure checksum format
        const isOwner = normalizedOwner.toLowerCase() === normalizedAccount.toLowerCase();
        setIsContractOwner(isOwner);
        console.log('Contract Owner:', normalizedOwner, 'Is Owner:', isOwner, 'Account:', normalizedAccount);
        
        // Note: Contract owner should also be institution (set in constructor)
        // If owner is not institution, something is wrong
        if (isOwner && !allowed) {
          console.warn('Warning: Contract owner is not registered as institution. This should not happen.');
        }
      } catch (e) {
        console.error('Error checking institution/owner status:', e);
        setIsInstitution(false);
        setIsContractOwner(false);
      }
    }
    checkInstitution();
  }, [account]);

  return (
    <nav className="fixed top-0 left-0 w-screen z-50 bg-white shadow-md flex items-center justify-between px-8 py-3 text-gray-700">
      <div className="flex items-center gap-2">
        <span className="font-bold text-xl text-gray-800">LandChain</span>
      </div>
      <div className="flex gap-2 items-center">
        <NavLink to="/" className={({isActive}) => `${isActive ? activeLink : normalLink} px-3 py-2 rounded-md flex items-center gap-2 font-medium`}>
          <HomeIcon /> Home
        </NavLink>
        <NavLink to="/certificates" className={({isActive}) => `${isActive ? activeLink : normalLink} px-3 py-2 rounded-md flex items-center gap-2 font-medium`}>
          <GridIcon /> My Properties
        </NavLink>
        <NavLink to="/verify" className={({isActive}) => `${isActive ? activeLink : normalLink} px-3 py-2 rounded-md flex items-center gap-2 font-medium`}>
          <SearchIcon />
          Verify
        </NavLink>
        {account && (
          <NavLink to="/request-mint" className={({isActive}) => `${isActive ? activeLink : normalLink} px-3 py-2 rounded-md flex items-center gap-2 font-medium`}>
            <PlusCircleIcon /> Request Mint
          </NavLink>
        )}
        {isInstitution && (
          <>
            <NavLink to="/mint" className={({isActive}) => `${isActive ? activeLink : normalLink} px-3 py-2 rounded-md flex items-center gap-2 font-medium`}>
              <PlusCircleIcon /> Execute Mint
            </NavLink>
            <NavLink to="/execute-split" className={({isActive}) => `${isActive ? activeLink : normalLink} px-3 py-2 rounded-md flex items-center gap-2 font-medium`}>
              <PlusCircleIcon /> Execute Split
            </NavLink>
          </>
        )}
        {isContractOwner && (
          <NavLink to="/admin" className={({isActive}) => `${isActive ? activeLink : normalLink} px-3 py-2 rounded-md flex items-center gap-2 font-medium`}>
            <ShieldIcon />
            Admin
          </NavLink>
        )}
        {/* <NavLink to="/transactions" className={({isActive}) => `${isActive ? activeLink : normalLink} px-3 py-2 rounded-md flex items-center gap-2 font-medium`}>
          <ClockIcon /> Transactions
        </NavLink> */}
      </div>
      <div className="flex items-center gap-4">
        {/* Debug info - bisa dihapus setelah testing */}
        {account && (
          <div className="text-xs text-gray-500">
            {isContractOwner && <span className="text-green-600">Owner</span>}
            {isInstitution && <span className="text-blue-600 ml-2">Institution</span>}
          </div>
        )}
        <button onClick={connectWallet} className="text-sm border rounded-md px-3 py-2 flex items-center gap-2 hover:bg-gray-100">
          {account ? (
            <>
              <WalletIcon />
              <span className="font-mono">{account.slice(0,6)}...{account.slice(-4)}</span>
            </>
          ) : (
            <>
              <WalletIcon />
              <span>Connect Wallet</span>
            </>
          )}
        </button>
      </div>
    </nav>
  );
}