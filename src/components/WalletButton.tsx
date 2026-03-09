'use client';

import { useState, useEffect, useCallback } from 'react';

interface WalletState {
  connected: boolean;
  address: string | null;
  network: string | null;
  error: string | null;
}

interface WalletButtonProps {
  onConnect: (address: string, network: string) => void;
  onDisconnect: () => void;
}

export default function WalletButton({ onConnect, onDisconnect }: WalletButtonProps) {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: null,
    network: null,
    error: null,
  });
  const [loading, setLoading] = useState(false);

  const checkConnection = useCallback(async () => {
    try {
      // Dynamic import to avoid SSR issues
      const freighter = await import('@stellar/freighter-api');
      const connected = await freighter.isConnected();
      if (connected?.isConnected) {
        const addrResult = await freighter.getAddress();
        const netResult = await freighter.getNetworkDetails();
        if (addrResult?.address) {
          const net = netResult?.networkPassphrase?.includes('Test') ? 'testnet' : 'mainnet';
          setWallet({ connected: true, address: addrResult.address, network: net, error: null });
          onConnect(addrResult.address, net);
        }
      }
    } catch {
      // Freighter not installed or not connected
    }
  }, [onConnect]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const connect = async () => {
    setLoading(true);
    setWallet((w) => ({ ...w, error: null }));
    try {
      const freighter = await import('@stellar/freighter-api');

      const installed = await freighter.isConnected();
      if (!installed?.isConnected) {
        setWallet((w) => ({
          ...w,
          error: 'Freighter not installed. Please install the Freighter browser extension.',
        }));
        setLoading(false);
        return;
      }

      const addrResult = await freighter.getAddress();
      if (addrResult?.error) {
        setWallet((w) => ({ ...w, error: addrResult.error || 'Failed to get address' }));
        setLoading(false);
        return;
      }

      const netResult = await freighter.getNetworkDetails();
      const net = netResult?.networkPassphrase?.includes('Test') ? 'testnet' : 'mainnet';

      if (addrResult?.address) {
        setWallet({ connected: true, address: addrResult.address, network: net, error: null });
        onConnect(addrResult.address, net);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect wallet';
      setWallet((w) => ({ ...w, error: msg }));
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    setWallet({ connected: false, address: null, network: null, error: null });
    onDisconnect();
  };

  const short = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  if (wallet.connected && wallet.address) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-sm font-mono text-gray-200">{short(wallet.address)}</span>
          {wallet.network && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900 text-blue-300 capitalize">
              {wallet.network}
            </span>
          )}
        </div>
        <button
          onClick={disconnect}
          className="text-xs text-gray-400 hover:text-gray-200 transition-colors px-2 py-2"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={connect}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
      >
        {loading ? 'Connecting...' : 'Connect Freighter'}
      </button>
      {wallet.error && (
        <p className="text-red-400 text-xs mt-1 max-w-xs">{wallet.error}</p>
      )}
    </div>
  );
}
