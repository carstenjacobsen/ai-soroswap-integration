import { NextRequest, NextResponse } from 'next/server';
import { SoroswapSDK, SupportedNetworks, SupportedProtocols, TradeType } from '@soroswap/sdk';

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
    const { assetIn, assetOut, amount, tradeType, network } = body;

    if (!assetIn || !assetOut || !amount) {
      return NextResponse.json({ error: 'Missing required fields: assetIn, assetOut, amount' }, { status: 400 });
    }

    const net = network === 'mainnet' ? SupportedNetworks.MAINNET : SupportedNetworks.TESTNET;

    const client = new SoroswapSDK({ apiKey, defaultNetwork: net });

    const quote = await client.quote({
      assetIn,
      assetOut,
      amount: BigInt(amount),
      tradeType: tradeType === 'EXACT_OUT' ? TradeType.EXACT_OUT : TradeType.EXACT_IN,
      protocols: [
        SupportedProtocols.SOROSWAP,
        SupportedProtocols.SDEX,
        SupportedProtocols.AQUA,
        SupportedProtocols.PHOENIX,
      ],
      slippageBps: body.slippageBps ?? '50',
    });

    return NextResponse.json(quote);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
