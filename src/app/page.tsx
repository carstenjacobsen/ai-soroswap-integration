'use client';

import { useState } from 'react';
import WalletButton from '@/components/WalletButton';
import SwapWidget from '@/components/SwapWidget';

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState(
    process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet'
  );

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <span className="text-white font-bold text-lg leading-none">StellarSwap</span>
              <p className="text-gray-500 text-xs">Powered by Soroswap</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Network toggle */}
            <div className="flex items-center bg-gray-800 rounded-xl p-1 gap-1">
              <button
                onClick={() => setNetwork('testnet')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  network === 'testnet'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Testnet
              </button>
              <button
                onClick={() => setNetwork('mainnet')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  network === 'mainnet'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Mainnet
              </button>
            </div>
            <WalletButton
              onConnect={(addr, net) => {
                setWalletAddress(addr);
                setNetwork(net);
              }}
              onDisconnect={() => setWalletAddress(null)}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Swap Stellar Tokens</h1>
          <p className="text-gray-400 text-sm">
            Best rates across Soroswap, Phoenix, Aqua &amp; SDEX
          </p>
        </div>

        <SwapWidget walletAddress={walletAddress} network={network} />

        {/* Info Cards */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
          <div className="bg-gray-800/50 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">4+</div>
            <div className="text-gray-400 text-xs">DEX Protocols</div>
          </div>
          <div className="bg-gray-800/50 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-indigo-400 mb-1">Best</div>
            <div className="text-gray-400 text-xs">Price Routing</div>
          </div>
          <div className="bg-gray-800/50 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">~5s</div>
            <div className="text-gray-400 text-xs">Finality</div>
          </div>
        </div>

        {/* Network info */}
        <div className="mt-6 text-center text-gray-600 text-xs">
          {network === 'testnet' && (
            <p>
              Get testnet XLM at{' '}
              <a
                href="https://laboratory.stellar.org/#account-creator?network=test"
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:text-blue-400 underline"
              >
                Stellar Laboratory
              </a>
              {' '}· Get test tokens at{' '}
              <a
                href="https://testnet.soroswap.finance/balance"
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:text-blue-400 underline"
              >
                testnet.soroswap.finance/balance
              </a>
            </p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-4 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <span>Built with Soroswap Aggregator on Stellar Soroban</span>
          <div className="flex items-center gap-4">
            <a
              href="https://docs.soroswap.finance"
              target="_blank"
              rel="noreferrer"
              className="hover:text-gray-400 transition-colors"
            >
              Soroswap Docs
            </a>
            <a
              href="https://stellar.org"
              target="_blank"
              rel="noreferrer"
              className="hover:text-gray-400 transition-colors"
            >
              Stellar.org
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
