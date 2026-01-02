import CertificateList from '../components/CertificateList';

export default function Certificates({ account }) {
  return (
    <div className="max-w-4xl mx-auto mt-24">
      <h2 className="text-2xl font-bold mb-4">Property List</h2>
      <CertificateList account={account} />
    </div>
  );
} 