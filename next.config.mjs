import nextra from "nextra";

const withNextra = nextra({
  defaultShowCopyCode: true,
  latex: true,
});

const redirects = [
    ["/rewards/traderrewards", "/rewards"],
    ["/rewards/rewards-program", "/rewards"],
    ["/about-v3/understanding-drift", "/protocol/how-it-works"],
    ["/about-v3/drift-amm", "/protocol/how-it-works/velocity-amm"],
    ["/about-v3/decentralized-orderbook", "/protocol/how-it-works/decentralized-orderbook"],
    ["/about-v3/keepers", "/protocol/how-it-works/keepers"],
    ["/about-v3/keepers-decentralized-orderbook-faq", "/protocol/how-it-works/keepers/keepers-dlob-faq"],
    ["/about-v3/keeper-incentives", "/protocol/how-it-works/keepers/keeper-incentives"],
    ["/about-v3/matching-engine", "/protocol/how-it-works/matching-engine"],
    ["/about-v3/jit-maker-faq", "/protocol/how-it-works/jit-faq"],
    ["/about-v3/revenue-pool", "/protocol/how-it-works/revenue-pool"],
    ["/about-v3/optimizations", "/developers/concepts/optimizations"],
    ["/about-v3/program-vault-addresses", "/developers/concepts/program-vault-addresses"],
    ["/protocol/how-it-works/optimizations", "/developers/concepts/optimizations"],
    ["/protocol/how-it-works/program-vault-addresses", "/developers/concepts/program-vault-addresses"],
    ["/protocol/how-it-works/block-conditions", "/developers/concepts/block-conditions"],
    ["/protocol/how-it-works/liquidators", "/protocol/how-it-works/liquidation-engine"],
    ["/developers/trading-automation/bot-wallet", "/developers/trading-automation#bot-wallet"],
    ["/developers/trading-automation/rpc-providers", "/developers/trading-automation#rpc-providers"],
    ["/protocol/borrow-lend/amplify/monitoring-a-position", "/protocol/borrow-lend/amplify/managing-a-position"],
    ["/protocol/borrow-lend/amplify/closing-a-position", "/protocol/borrow-lend/amplify/managing-a-position"],
    ["/protocol/trading/versioned-transactions", "/protocol/getting-started/versioned-transactions"],
    ["/getting-started/wallet-setup/phantom-setup", "/protocol/getting-started/wallet-setup/phantom-wallet"],
    ["/getting-started/wallet-setup/metamask-setup", "/protocol/getting-started/wallet-setup/metamask"],
    ["/getting-started/wallet-setup/bot-wallet-setup", "/developers/trading-automation#bot-wallet"],
    ["/getting-started/wallet-setup/wallet-faq", "/protocol/getting-started/wallet-setup/wallet-faq"],
    ["/getting-started/passwordless-login", "/protocol/getting-started/wallet-setup/passwordless-login"],
    ["/getting-started/cross-collateral-deposits", "/protocol/getting-started/cross-collateral-deposits"],
    ["/getting-started/managing-subaccount", "/protocol/getting-started/managing-subaccounts"],
    ["/getting-started/delegated-accounts", "/protocol/getting-started/delegated-accounts"],
    ["/getting-started/versioned-transactions", "/protocol/getting-started/versioned-transactions"],
    ["/getting-started/withdraw-and-close-account", "/protocol/getting-started/withdraw-and-close-account"],
    ["/trading/market-specs", "/protocol/trading/market-specs"],
    ["/trading/prelaunch-markets", "/protocol/trading/prelaunch-markets"],
    ["/trading/perpetuals-trading", "/protocol/trading/perpetuals-trading"],
    ["/trading/what-are-perpetual-futures", "/protocol/trading/perpetuals-trading"],
    ["/trading/funding-rates", "/protocol/trading/perpetuals-trading/funding-rates"],
    ["/trading/spot-margin-trading", "/protocol/trading/spot-trading"],
    ["/trading/spot-faq", "/protocol/trading/spot-trading"],
    ["/trading/margin", "/protocol/trading/margin"],
    ["/trading/order-types", "/protocol/trading/order-types"],
    ["/trading/all-order-types", "/protocol/trading/order-types/advanced-order-types"],
    ["/trading/advanced-orders-faq", "/protocol/trading/order-types/advanced-orders-faq"],
    ["/trading/account-health", "/protocol/trading/margin/account-health"],
    ["/trading/auction-parameters", "/protocol/trading/perpetuals-trading/auction-parameters"],
    ["/trading/trading-fees", "/protocol/trading/trading-fees"],
    ["/trading/other-trading-fees", "/protocol/trading/trading-fees/other-trading-fees"],
    ["/trading/fee-pool", "/protocol/how-it-works/fee-pool"],
    ["/trading/versioned-transactions", "/protocol/trading/versioned-transactions"],
    ["/trading/block-conditions", "/protocol/how-it-works/block-conditions"],
    ["/trading/oracles", "/protocol/how-it-works/oracles"],
    ["/profit-loss/profit-loss-intro", "/protocol/trading/profit-loss"],
    ["/profit-loss/accounting-settlement", "/protocol/trading/profit-loss/accounting-settlement"],
    ["/profit-loss/what-is-unsettled-profit-loss", "/protocol/trading/profit-loss/unsettled-profit-loss"],
    ["/profit-loss/profit-loss-pool", "/protocol/how-it-works/profit-loss-pool"],
    ["/liquidations/liquidations", "/protocol/trading/liquidations"],
    ["/liquidations/liquidation-engine", "/protocol/how-it-works/liquidation-engine"],
    ["/liquidations/liquidators", "/protocol/how-it-works/liquidators"],
    ["/lend-borrow/borrow-interest-rate", "/protocol/how-it-works/borrow-interest-rate"],
    ["/lend-borrow/isolated-pools", "/protocol/how-it-works/isolated-pools"],
    ["/lend-borrow/lend-borrow-faq", "/protocol/borrow-lend/borrow-lend-faq"],
    ["/lend-borrow/rewards", "/protocol/rewards"],
    ["/lend-borrow/supply-borrow-apy", "/protocol/borrow-lend/borrow-lend-apy"],
    ["/lend-borrow/what-is-lend-borrow", "/protocol/borrow-lend"],
    ["/amplify/how-it-works", "/protocol/borrow-lend/amplify"],
    ["/amplify/opening-a-position", "/protocol/borrow-lend/amplify/opening-a-position"],
    ["/amplify/monitoring-a-position", "/protocol/borrow-lend/amplify/monitoring-a-position"],
    ["/amplify/closing-a-position", "/protocol/borrow-lend/amplify/closing-a-position"],
    ["/amplify/risk", "/protocol/borrow-lend/amplify/risk"],
    ["/market-makers/market-maker-participation", "/protocol/market-makers/market-maker-participation"],
    ["/market-makers/maker-rebate-fees", "/protocol/market-makers/maker-fee-rebate"],
    ["/market-makers/rewards-program", "/protocol/market-makers"],
    ["/insurance-fund/insurance-fund-intro", "/protocol/insurance-fund"],
    ["/insurance-fund/insurance-fund-staking", "/protocol/insurance-fund/insurance-fund-staking"],
    ["/sdk-documentation", "/developers"],
    ["/partnerships/DBC", "/developers/builder-codes"],
    ["/partnerships/referral-link", "/protocol/rewards/referral-links"],
    ["/tutorial-bots", "/developers/trading-automation"],
    ["/tutorial-bots/keeper-bots", "/developers/trading-automation/keeper-bots"],
    ["/tutorial-bots/keeper-bots/tutorial-order-matching-bot", "/developers/trading-automation/keeper-bots/order-matching-bot"],
    ["/tutorial-bots/keeper-bots/tutorial-order-trigger-bot", "/developers/trading-automation/keeper-bots/order-trigger-bot"],
    ["/tutorial-bots/keeper-bots/tutorial-liquidation-bot", "/developers/trading-automation/keeper-bots/liquidation-bot"],
    ["/tutorial-bots/trading-bots/tutorial-jit-trading-bot", "/developers/trading-automation/keeper-bots/jit-maker-bot"],
    ["/developers/trading-automation/trading-bots/jit-trading-bot", "/developers/trading-automation/keeper-bots/jit-maker-bot"],
    ["/developers/trading-automation/trading-bots", "/developers/trading-automation/keeper-bots"],
    ["/developers/trading-automation/liquidator-bots", "/developers/trading-automation/keeper-bots/liquidation-bot"],
    ["/tutorial-bots/rpc-providers", "/developers/trading-automation/rpc-providers"],
    ["/tutorial-bots/troubleshooting", "/developers/trading-automation/troubleshooting"],
    ["/historical-data/historical-data-v1", "/developers/data-api"],
    ["/historical-data/historical-data-v2", "/developers/data-api"],
    ["/historical-data/historical-data-glossary", "/developers/data-api/glossary"],
    ["/fuel/overview", "/"],
    ["/risk-and-safety/delisting-process", "/protocol/risk-and-safety/delisting-process"],
    ["/risk-and-safety/protocol-guard-rails", "/protocol/risk-and-safety/protocol-guard-rails"],
    ["/risk-and-safety/risk-parameters", "/protocol/risk-and-safety/risk-parameters"],
    ["/drift-safety-module", "/protocol/risk-and-safety/drift-safety-module"],
    ["/security/audits", "/protocol/risk-and-safety/audits"],
    ["/security/risks", "/protocol/risk-and-safety/risks"],
    ["/glossary", "/protocol/glossary"],
    ["/additional-resources-data", "/developers/data-api"],
    ["/legal-and-regulations/terms-of-use", "/protocol/legal-and-regulations/terms-of-use"],
    ["/legal-and-regulations/disclaimer", "/protocol/legal-and-regulations/disclaimer"],
    ["/legal-and-regulations/privacy-policy", "/protocol/legal-and-regulations/privacy-policy"],
    ["/legal-and-regulations/competition-terms", "/protocol/legal-and-regulations/competition-terms"],
    // --- IA reorg: pages relocated into the "How Velocity Works" section
    ["/protocol/trading/oracles", "/protocol/how-it-works/oracles"],
    ["/protocol/trading/liquidations/liquidation-engine", "/protocol/how-it-works/liquidation-engine"],
    ["/protocol/trading/liquidations/liquidators", "/protocol/how-it-works/liquidators"],
    ["/protocol/trading/profit-loss/profit-loss-pool", "/protocol/how-it-works/profit-loss-pool"],
    ["/protocol/trading/trading-fees/fee-pool", "/protocol/how-it-works/fee-pool"],
    ["/protocol/trading/block-conditions", "/protocol/how-it-works/block-conditions"],
    ["/protocol/borrow-lend/borrow-interest-rate", "/protocol/how-it-works/borrow-interest-rate"],
    ["/protocol/borrow-lend/isolated-pools", "/protocol/how-it-works/isolated-pools"],
    ["/protocol/getting-started/wallet-setup/bot-wallet", "/developers/trading-automation/bot-wallet"],
]

const nextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/protocol/",
        permanent: false,
      },
      {
        source: "/about-v2/:path*",
        destination: "/protocol/how-it-works/:path*",
        permanent: false,
      },
      {
        source: "/developers/drift-sdk/:path*",
        destination: "/developers/velocity-sdk/:path*",
        permanent: false,
      },
      // --- IA reorg: about-v3 renamed to how-it-works (drift-amm -> velocity-amm)
      {
        source: "/protocol/about-v3/drift-amm",
        destination: "/protocol/how-it-works/velocity-amm",
        permanent: false,
      },
      {
        source: "/protocol/about-v3/:path*",
        destination: "/protocol/how-it-works/:path*",
        permanent: false,
      },
      {
        source: "/protocol/about-v3",
        destination: "/protocol/how-it-works",
        permanent: false,
      },
      ...redirects.map(([source, destination]) => ({
        source,
        destination,
        permanent: false,
      }))
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        dns: false,
        tls: false,
      };
    }
    return config;
  },
  turbopack: {
    resolveAlias: {
      'next-mdx-import-source-file': './mdx-components.tsx'
    }
  }
};

export default withNextra(nextConfig);
