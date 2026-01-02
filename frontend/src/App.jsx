import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Mint from './pages/Mint'
import RequestMint from './pages/RequestMint'
import Certificates from './pages/Certificates'
import AdminPage from './pages/AdminPage';
import VerifyPage from './pages/VerifyPage';
import ExecuteSplit from './pages/ExecuteSplit';
import './App.css'

function App() {
  const [account, setAccount] = useState('')

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        setAccount(accounts[0])
      } catch (error) {
        console.error("User denied account access")
      }
    } else {
      alert('Metamask not detected!')
    }
  }

  return (
    <Router>
      <Navbar account={account} connectWallet={connectWallet} />
      <main>
        <Routes>
          <Route path="/" element={<Home connectWallet={connectWallet} account={account} />} />
          <Route path="/mint" element={
            <div className="max-w-5xl mx-auto px-4 pt-28">
              <Mint account={account} />
            </div>
          } />
          <Route path="/request-mint" element={
            <div className="max-w-5xl mx-auto px-4 pt-28">
              <RequestMint account={account} />
            </div>
          } />
          <Route path="/certificates" element={
            <div className="max-w-5xl mx-auto px-4 pt-28">
              <Certificates account={account} />
            </div>
          } />
          <Route path="/execute-split" element={
            <div className="max-w-5xl mx-auto px-4 pt-28">
              <ExecuteSplit account={account} />
            </div>
          } />
          <Route path="/admin" element={<AdminPage account={account} />} />
          <Route path="/verify" element={<VerifyPage />} />
        </Routes>
      </main>
    </Router>
  )
}

export default App
