export interface Token {
  symbol: string;
  name: string;
  contract: string;
  decimals: number;
  logoColor: string; // Tailwind color class for placeholder icon
}

export const TESTNET_TOKENS: Token[] = [
  {
    symbol: 'XLM',
    name: 'Stellar Lumens',
    contract: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    decimals: 7,
    logoColor: 'bg-blue-500',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    contract: 'CBBHRKEP5M3NUDRISGLJKGHDHX3DA2CN2AZBQY6WLVUJ7VNLGSKBDUCM',
    decimals: 7,
    logoColor: 'bg-blue-400',
  },
];

export const MAINNET_TOKENS: Token[] = [
  {
    symbol: 'XLM',
    name: 'Stellar Lumens',
    contract: 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA',
    decimals: 7,
    logoColor: 'bg-blue-500',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    contract: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
    decimals: 7,
    logoColor: 'bg-blue-400',
  },
];

export function getTokensByNetwork(network: string): Token[] {
  return network === 'mainnet' ? MAINNET_TOKENS : TESTNET_TOKENS;
}

export function getTokenByContract(contract: string, network: string): Token | undefined {
  return getTokensByNetwork(network).find((t) => t.contract === contract);
}

export function toBaseUnits(amount: string, decimals: number): bigint {
  const [whole, frac = ''] = amount.split('.');
  const fracPadded = frac.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + fracPadded);
}

export function fromBaseUnits(amount: bigint, decimals: number): string {
  const str = amount.toString().padStart(decimals + 1, '0');
  const whole = str.slice(0, -decimals) || '0';
  const frac = str.slice(-decimals).replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : whole;
}
