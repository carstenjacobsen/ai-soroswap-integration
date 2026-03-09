import { NextRequest, NextResponse } from 'next/server';
import { SoroswapSDK, SupportedNetworks } from '@soroswap/sdk';

export async function POST(req: NextRequest) {
  const apiKey = process.env.SOROSWAP_API_KEY;
  if (!apiKey || apiKey === 'sk_your_api_key_here') {
    return NextResponse.json(
      { error: 'SOROSWAP_API_KEY not configured. Add it to .env.local' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { signedXdr, network } = body;

    if (!signedXdr) {
      return NextResponse.json({ error: 'Missing required field: signedXdr' }, { status: 400 });
    }

    const net = network === 'mainnet' ? SupportedNetworks.MAINNET : SupportedNetworks.TESTNET;
    const client = new SoroswapSDK({ apiKey, defaultNetwork: net });

    // false = don't use Launchtube (gasless service)
    const result = await client.send(signedXdr, false);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
