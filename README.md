# AI Soroswap Integration

_Time Estimate: 60 mins (Vibe Coding)

Soroswap is an open-source protocol designed for liquidity provision and token trading on the Soroban blockchain. It operates without the need for intermediaries, ensuring a secure, transparent, and efficient trading environment.

Soroswap consists of three main components:

* **Soroswap AMM**: An Automated Market Maker that facilitates token swaps and liquidity provision.
* **Soroswap Aggregator**: An AMM Aggregator that optimizes trading routes across various liquidity pools.
* **Soroswap API**: The Soroswap API serves as the core interface to quote trades by aggregating liquidity from all available Stellar DEXs — including those on Soroban (Soroswap, Phoenix, Aqua) and the Stellar Classic DEX.

There are multiple ways to integrate Soroswap into your project, depending on your needs and technical stack. The easiest way to get started is to use the Soroswap API, which provides a simple REST interface for quoting trades and accessing liquidity across all Stellar DEXs.

For more advanced use cases, you can also interact directly with the Soroswap AMM smart contracts on Soroban. This allows you to build custom trading interfaces, create your own liquidity pools, or integrate Soroswap functionality directly into your dApp's backend.

A third option is to use the TypeScript SDK, which provides a convenient wrapper around the Soroswap API and smart contracts. The SDK simplifies the process of building custom integrations and can be used in both frontend and backend applications.

## Why Use Soroswap?
* **Optimized Aggregated Routing** - Best price. Every time.
* **Plug-and-Play REST API** - REST endpoints for everything
* **Smooth Integration** - From zero to production, fast
* **Gasless Trustlines** - Trustlines without the friction

Learn more about Soroswap and get started with these resources:

* [Documentation]()
* [Soroswap Website]()
* [Soroswap GitHub]()
* [Soroswap API Reference]()
* [Soroswap SDK]()

## Vibe Coding
Soroswap is a well-documented, mature project in the Stellar Ecosystem, with an easy-to-use API, great documentation and a lot of example projects and open source projects, so Claude Code is very capable of integrating DeFindex.

A simple prompt to build a simple DeFindex-based dApp could look like this:

```
create an application using stellar freighter wallet and soroswap to make my own token swap application.
```

This will build a Next.js dapp with the Freighter wallet integration and the Soroswap integration, allowing users to connect their wallet, create vaults, deposit XLM, and earn yield on their assets.

