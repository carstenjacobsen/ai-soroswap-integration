'use client';

import { useState, useEffect, useRef } from 'react';
import { Token } from '@/lib/tokens';

interface TokenSelectorProps {
  selected: Token | null;
  tokens: Token[];
  onChange: (token: Token) => void;
  exclude?: string; // contract address to exclude
  label: string;
}

export default function TokenSelector({ selected, tokens, onChange, exclude, label }: TokenSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  const filtered = tokens.filter((t) => {
    if (t.contract === exclude) return false;
    if (!search) return true;
    return (
      t.symbol.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.contract.toLowerCase().includes(search.toLowerCase())
    );
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={modalRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 transition-colors rounded-xl px-3 py-2 min-w-[110px]"
        aria-label={`Select ${label} token`}
      >
        {selected ? (
          <>
            <span
              className={`w-6 h-6 rounded-full ${selected.logoColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
            >
              {selected.symbol[0]}
            </span>
            <span className="text-white font-semibold text-sm">{selected.symbol}</span>
          </>
        ) : (
          <span className="text-gray-300 text-sm">Select</span>
        )}
        <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-72 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-3 border-b border-gray-700">
            <p className="text-xs text-gray-400 mb-2">Select {label} token</p>
            <input
              autoFocus
              type="text"
              placeholder="Search by name or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-900 text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-gray-500 border border-gray-700 focus:border-blue-500"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">No tokens found</p>
            ) : (
              filtered.map((token) => (
                <button
                  key={token.contract}
                  onClick={() => {
                    onChange(token);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors text-left ${
                    selected?.contract === token.contract ? 'bg-gray-700' : ''
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-full ${token.logoColor} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
                  >
                    {token.symbol[0]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{token.symbol}</p>
                    <p className="text-gray-400 text-xs truncate">{token.name}</p>
                  </div>
                  {selected?.contract === token.contract && (
                    <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
