// Environment-based configuration
// All values are loaded from .env file with VITE_ prefix

export const config = {
    // Smart Contract
    CONTRACT_ADDRESS: import.meta.env.VITE_CONTRACT_ADDRESS || '',

    // Pinata IPFS
    PINATA_API_KEY: import.meta.env.VITE_PINATA_API_KEY || '',
    PINATA_API_SECRET: import.meta.env.VITE_PINATA_API_SECRET || '',
};

// Validation - warn if config is empty during development
if (import.meta.env.DEV) {
    if (!config.CONTRACT_ADDRESS) {
        console.warn('⚠️ VITE_CONTRACT_ADDRESS is not set in .env');
    }
    if (!config.PINATA_API_KEY) {
        console.warn('⚠️ VITE_PINATA_API_KEY is not set in .env');
    }
    if (!config.PINATA_API_SECRET) {
        console.warn('⚠️ VITE_PINATA_API_SECRET is not set in .env');
    }
}

export default config;
