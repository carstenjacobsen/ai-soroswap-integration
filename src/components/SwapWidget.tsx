'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import TokenSelector from './TokenSelector';
import { Token, getTokensByNetwork, toBaseUnits, fromBaseUnits } from '@/lib/tokens';

interface SwapWidgetProps {
  walletAddress: string | null;
  network: string;
}

interface QuoteResult {
  amountIn?: string;
  amountOut?: string;
  amountOutMin?: string;
  priceImpact?: string | number;
  path?: string[];
  protocols?: string[];
  distribution?: unknown[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

type SwapStatus = 'idle' | 'quoting' | 'building' | 'signing' | 'sending' | 'success' | 'error';

export default function SwapWidget({ walletAddress, network }: SwapWidgetProps) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [tokenIn, setTokenIn] = useState<Token | null>(null);
  const [tokenOut, setTokenOut] = useState<Token | null>(null);
  const [amountIn, setAmountIn] = useState('');
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [slippage, setSlippage] = useState('0.5');
  const [status, setStatus] = useState<SwapStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState('');
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const quoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load tokens
  useEffect(() => {
    fetch(`/api/soroswap/tokens?network=${network}`)
      .then((r) => r.json())
      .then((list: Token[]) => {
        setTokens(list);
        if (list.length >= 2) {
          setTokenIn(list[0]);
          setTokenOut(list[1]);
        }
      })
      .catch(() => {});
  }, [network]);

  // Auto-fetch quote when inputs change
  const fetchQuote = useCallback(async () => {
    if (!tokenIn || !tokenOut || !amountIn || Number(amountIn) <= 0) {
      setQuote(null);
      return;
    }

    setStatus('quoting');
    setErrorMsg('');

    try {
      const amount = toBaseUnits(amountIn, tokenIn.decimals).toString();
      const slippageBps = Math.round(parseFloat(slippage) * 100).toString();

      const res = await fetch('/api/soroswap/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetIn: tokenIn.contract,
          assetOut: tokenOut.contract,
          amount,
          tradeType: 'EXACT_IN',
          network,
          slippageBps,
        }),
      });

      const data = await res.json();

      if (data.error) {
        if (data.error.includes('SOROSWAP_API_KEY')) {
          setApiKeyMissing(true);
        }
        setErrorMsg(data.error);
        setStatus('error');
        setQuote(null);
        return;
      }

      setApiKeyMissing(false);
      setQuote(data);
      setStatus('idle');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to get quote');
      setStatus('error');
      setQuote(null);
    }
  }, [tokenIn, tokenOut, amountIn, network, slippage]);

  useEffect(() => {
    if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current);
    if (!amountIn || Number(amountIn) <= 0) {
      setQuote(null);
      setStatus('idle');
      return;
    }
    quoteTimerRef.current = setTimeout(fetchQuote, 600);
    return () => {
      if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current);
    };
  }, [fetchQuote, amountIn]);

  const swap = async () => {
    if (!walletAddress || !tokenIn || !tokenOut || !amountIn || !quote) return;

    setStatus('building');
    setErrorMsg('');
    setTxHash('');

    try {
      // Step 1: Build unsigned XDR
      const buildRes = await fetch('/api/soroswap/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote, from: walletAddress, to: walletAddress, network }),
      });

      const buildData = await buildRes.json();
      if (buildData.error) throw new Error(buildData.error);

      const unsignedXdr = buildData.xdr || buildData.tx || buildData.transaction;
      if (!unsignedXdr) throw new Error('No XDR returned from build step');

      // Step 2: Sign with Freighter
      setStatus('signing');
      const freighter = await import('@stellar/freighter-api');
      const netPassphrase =
        network === 'mainnet'
          ? 'Public Global Stellar Network ; September 2015'
          : 'Test SDF Network ; September 2015';

      const signResult = await freighter.signTransaction(unsignedXdr, {
        networkPassphrase: netPassphrase,
        accountToSign: walletAddress,
      });

      if (signResult?.error) throw new Error(signResult.error);

      const signedXdr = signResult?.signedTxXdr || signResult;
      if (!signedXdr || typeof signedXdr !== 'string') {
        throw new Error('Signing failed or was cancelled');
      }

      // Step 3: Send
      setStatus('sending');
      const sendRes = await fetch('/api/soroswap/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedXdr, network }),
      });

      const sendData = await sendRes.json();
      if (sendData.error) throw new Error(sendData.error);

      const hash = sendData.hash || sendData.txHash || sendData.id || 'unknown';
      setTxHash(hash);
      setStatus('success');
      setAmountIn('');
      setQuote(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('denied')) {
        setErrorMsg('Transaction was cancelled.');
      } else {
        setErrorMsg(msg);
      }
      setStatus('error');
    }
  };

  const swapTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn('');
    setQuote(null);
    setStatus('idle');
  };

  const amountOut = quote
    ? fromBaseUnits(BigInt(quote.amountOut || '0'), tokenOut?.decimals ?? 7)
    : '';

  const amountOutMin = quote
    ? fromBaseUnits(BigInt(quote.amountOutMin || '0'), tokenOut?.decimals ?? 7)
    : '';

  const isLoading = ['quoting', 'building', 'signing', 'sending'].includes(status);
  const canSwap = !isLoading && !!walletAddress && !!tokenIn && !!tokenOut && !!amountIn && Number(amountIn) > 0 && !!quote;

  const explorerBase =
    network === 'mainnet'
      ? 'https://stellar.expert/explorer/public/tx/'
      : 'https://stellar.expert/explorer/testnet/tx/';

  const priceImpact = quote?.priceImpact
    ? typeof quote.priceImpact === 'number'
      ? quote.priceImpact.toFixed(2)
      : parseFloat(String(quote.priceImpact)).toFixed(2)
    : null;

  const protocols = quote?.protocols || [];

  return (
    <div className="w-full max-w-md">
      {/* API Key Warning */}
      {apiKeyMissing && (
        <div className="mb-4 p-4 bg-yellow-900/50 border border-yellow-700 rounded-2xl">
          <p className="text-yellow-300 text-sm font-semibold mb-1">Soroswap API Key Required</p>
          <p className="text-yellow-400 text-xs">
            Copy <code className="bg-yellow-900 px-1 rounded">.env.local.example</code> to{' '}
            <code className="bg-yellow-900 px-1 rounded">.env.local</code> and add your key from{' '}
            <a href="https://api.soroswap.finance/docs" target="_blank" rel="noreferrer" className="underline">
              api.soroswap.finance
            </a>
            , then restart the dev server.
          </p>
        </div>
      )}

      {/* Swap Card */}
      <div className="bg-gray-800 rounded-3xl p-1 shadow-2xl border border-gray-700">
        {/* You Pay */}
        <div className="bg-gray-900 rounded-2xl p-4 m-1">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">You pay</span>
            {walletAddress && tokenIn && (
              <span className="text-gray-500 text-xs">Balance: —</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              step="any"
              placeholder="0.0"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              className="flex-1 bg-transparent text-white text-2xl font-light outline-none placeholder-gray-600 min-w-0"
            />
            <TokenSelector
              selected={tokenIn}
              tokens={tokens}
              onChange={(t) => { setTokenIn(t); setQuote(null); setStatus('idle'); }}
              exclude={tokenOut?.contract}
              label="input"
            />
          </div>
        </div>

        {/* Swap direction button */}
        <div className="flex justify-center my-1">
          <button
            onClick={swapTokens}
            className="w-10 h-10 bg-gray-700 hover:bg-gray-600 transition-colors rounded-xl flex items-center justify-center text-gray-300 hover:text-white"
            title="Swap tokens"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* You Receive */}
        <div className="bg-gray-900 rounded-2xl p-4 m-1">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">You receive</span>
            {status === 'quoting' && (
              <span className="text-blue-400 text-xs animate-pulse">Getting quote...</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <span className="text-2xl font-light text-white">
                {amountOut || <span className="text-gray-600">0.0</span>}
              </span>
            </div>
            <TokenSelector
              selected={tokenOut}
              tokens={tokens}
              onChange={(t) => { setTokenOut(t); setQuote(null); setStatus('idle'); }}
              exclude={tokenIn?.contract}
              label="output"
            />
          </div>
        </div>

        {/* Quote Details */}
        {quote && tokenIn && tokenOut && amountOut && (
          <div className="mx-1 mb-1 px-4 py-3 bg-gray-900/50 rounded-2xl space-y-1.5">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Rate</span>
              <span className="text-gray-300">
                1 {tokenIn.symbol} ≈{' '}
                {amountIn && Number(amountIn) > 0
                  ? (Number(amountOut) / Number(amountIn)).toFixed(6)
                  : '—'}{' '}
                {tokenOut.symbol}
              </span>
            </div>
            {amountOutMin && (
              <div className="flex justify-between text-xs text-gray-400">
                <span>Min. received ({slippage}% slippage)</span>
                <span className="text-gray-300">
                  {amountOutMin} {tokenOut.symbol}
                </span>
              </div>
            )}
            {priceImpact !== null && (
              <div className="flex justify-between text-xs text-gray-400">
                <span>Price impact</span>
                <span
                  className={
                    parseFloat(priceImpact) > 5
                      ? 'text-red-400'
                      : parseFloat(priceImpact) > 1
                      ? 'text-yellow-400'
                      : 'text-green-400'
                  }
                >
                  {priceImpact}%
                </span>
              </div>
            )}
            {protocols.length > 0 && (
              <div className="flex justify-between text-xs text-gray-400">
                <span>Route</span>
                <span className="text-gray-300 capitalize">{protocols.join(' + ')}</span>
              </div>
            )}
          </div>
        )}

        {/* Slippage */}
        <div className="mx-1 mb-1 px-4 py-2 flex items-center justify-between">
          <span className="text-gray-500 text-xs">Max slippage</span>
          <div className="flex items-center gap-1.5">
            {['0.1', '0.5', '1.0'].map((s) => (
              <button
                key={s}
                onClick={() => setSlippage(s)}
                className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                  slippage === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {s}%
              </button>
            ))}
            <input
              type="number"
              min="0.01"
              max="50"
              step="0.01"
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
              className="w-14 bg-gray-700 text-white text-xs text-center rounded-lg py-1 outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Swap Button */}
        <div className="m-1">
          {!walletAddress ? (
            <button
              disabled
              className="w-full py-4 rounded-2xl bg-gray-700 text-gray-400 font-semibold text-base cursor-not-allowed"
            >
              Connect wallet to swap
            </button>
          ) : (
            <button
              onClick={swap}
              disabled={!canSwap}
              className="w-full py-4 rounded-2xl font-semibold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
            >
              {status === 'building' && 'Building transaction...'}
              {status === 'signing' && 'Sign in Freighter...'}
              {status === 'sending' && 'Broadcasting...'}
              {status === 'quoting' && 'Getting quote...'}
              {!isLoading && 'Swap'}
            </button>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {status === 'success' && txHash && (
        <div className="mt-4 p-4 bg-green-900/40 border border-green-700 rounded-2xl">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-300 font-semibold text-sm">Swap submitted!</span>
          </div>
          <a
            href={`${explorerBase}${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="text-green-400 text-xs underline break-all"
          >
            View on Stellar Expert →
          </a>
          <button
            onClick={() => { setStatus('idle'); setTxHash(''); }}
            className="mt-2 text-xs text-green-500 hover:text-green-300 block"
          >
            Dismiss
          </button>
        </div>
      )}

      {status === 'error' && errorMsg && (
        <div className="mt-4 p-4 bg-red-900/40 border border-red-700 rounded-2xl">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-300 font-semibold text-sm">Error</span>
          </div>
          <p className="text-red-400 text-xs break-words">{errorMsg}</p>
          <button
            onClick={() => { setStatus('idle'); setErrorMsg(''); }}
            className="mt-2 text-xs text-red-500 hover:text-red-300"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
