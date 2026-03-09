import { NextRequest, NextResponse } from 'next/server';
import { SoroswapSDK, SupportedNetworks, SupportedAssetLists } from '@soroswap/sdk';
import { TESTNET_TOKENS, MAINNET_TOKENS } from '@/lib/tokens';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const network = searchParams.get('network') || 'testnet';

  const apiKey = process.env.SOROSWAP_API_KEY;

  // If no API key, return hardcoded tokens
  if (!apiKey || apiKey === 'sk_your_api_key_here') {
    return NextResponse.json(network === 'mainnet' ? MAINNET_TOKENS : TESTNET_TOKENS);
  }

  try {
    const net = network === 'mainnet' ? SupportedNetworks.MAINNET : SupportedNetworks.TESTNET;
    const client = new SoroswapSDK({ apiKey, defaultNetwork: net });

    const assetList = await client.getAssetList(SupportedAssetLists.SOROSWAP);

    // Transform to our Token format
    type AssetEntry = { contract?: string; address?: string; symbol?: string; code?: string; name?: string; decimals?: number };
    const tokens = (assetList?.assets || [])
      .filter((a: AssetEntry) => a.contract || a.address)
      .map((a: AssetEntry, i: number) => ({
        symbol: a.symbol || a.code || 'UNKNOWN',
        name: a.name || a.symbol || a.code || 'Unknown',
        contract: a.contract || a.address || '',
        decimals: a.decimals ?? 7,
        logoColor: `bg-${['blue', 'purple', 'green', 'yellow', 'pink', 'indigo'][i % 6]}-500`,
      }));

    // Ensure the hardcoded tokens are at the top
    const base = network === 'mainnet' ? MAINNET_TOKENS : TESTNET_TOKENS;
    const merged = [
      ...base,
      ...tokens.filter(
        (t: { contract: string }) => !base.find((b) => b.contract === t.contract)
      ),
    ];

    return NextResponse.json(merged);
  } catch {
    // Fallback to hardcoded tokens on error
    return NextResponse.json(network === 'mainnet' ? MAINNET_TOKENS : TESTNET_TOKENS);
  }
}
