import { MetaRecord } from "nextra";

const displayWip = process.env.NODE_ENV === 'development' ? 'normal' : "hidden"

/*
Conditionally hide items in production
USAGE:
{
  ...,
  "display": displayWip,
}
*/
const META = {
  "protocol": {
    "title": "Velocity Protocol",
    "type": "page",
    "items": {
      "index": "Velocity Overview",
      "--- using": {
        "title": "USING VELOCITY",
        "type": "separator"
      },
      "getting-started": {
        "title": "Getting Started",
        "items": {
          "wallet-setup": {
            "title": "Wallet Setup",
            "items": {
              "index": "",
              "phantom-wallet": "",
              "passwordless-login": "",
              "wallet-faq": "Wallet FAQ",
            },
          },
          "cross-collateral-deposits": "",
          "managing-subaccounts": "",
          "delegated-accounts": "",
          "withdraw-and-close-account": ""
        }
      },
      "trading": {
        "title": "Trading",
        "items": {
          "market-specs": "",
          "prelaunch-markets": "",
          "perpetuals-trading": {
            "title": "Perpetuals Trading",
            "items": {
              "index": "",
              "perpetuals-trading": "",
              "auction-parameters": "",
              "funding-rates": "",
            }
          },
          "spot-trading": "Spot Trading",
          "margin": {
            "title": "Margin",
            "items": {
              "index": "",
              "per-market-leverage": "",
              "account-health": "",
            },
          },
          "profit-loss": {
            "title": "Profit & Loss (P&L)",
            "items": {
              "index": "",
              "accounting-settlement": "",
              "unsettled-profit-loss": "",
            }
          },
          "order-types": {
            "title": "Order Types",
            "items": {
              "index": "",
              "advanced-order-types": "",
              "advanced-orders-faq": "",
            },
          },
          "liquidations": {
            "title": "Liquidations",
            "items": {
              "index": "",
            }
          },
          "trading-fees": {
            "title": "Trading Fees",
            "items": {
              "index": "",
              "other-trading-fees": "",
            }
          },
          "versioned-transactions": "",
        }
      },
      "borrow-lend": {
        "title": "Borrow & Lend",
        "items": {
          "index": "",
          "borrow-lend-faq": "",
          "borrow-lend-apy": "",
          "amplify": {
            "title": "Amplify",
            "items": {
              "index": "",
              "opening-a-position": "",
              "monitoring-a-position": "",
              "closing-a-position": "",
              "risk": ""
            }
          },
        }
      },
      "rewards": "Referral Links",
      "glossary": "",
      "--- how-it-works": {
        "title": "HOW VELOCITY WORKS",
        "type": "separator"
      },
      "how-it-works": {
        "title": "How Velocity Works",
        "items": {
          "index": "Understanding Velocity",
          "matching-engine": "",
          "velocity-amm": "",
          "decentralized-orderbook": "",
          "jit-faq": "",
          "keepers": {
            "title": "Keepers",
            "items": {
              "index": "",
              "keepers-dlob-faq": "",
              "keeper-incentives": "",
            },
          },
          "oracles": "",
          "liquidation-engine": "",
          "liquidators": "",
          "revenue-pool": "",
          "fee-pool": "",
          "profit-loss-pool": "",
          "borrow-interest-rate": "",
          "isolated-pools": "",
          "block-conditions": "",
          "optimizations": "",
          "program-vault-addresses": "",
        }
      },
      "insurance-fund": {
        "title": "Insurance Fund",
        "items": {
          "index": "",
          "insurance-fund-staking": ""
        }
      },
      "market-makers": {
        "title": "Market Makers",
        "items": {
          "index": "",
          "market-maker-participation": "",
          "maker-fee-rebate": "",
        }
      },
      "--- risk": {
        "title": "RISK & SAFETY",
        "type": "separator"
      },
      "risk-and-safety": {
        "title": "Risk and Safety",
        "items": {
          "risk-parameters": "",
          "delisting-process": "",
          "protocol-guard-rails": "",
          "audits": "",
          "bug-bounty": {
            display: 'hidden',
          },
          "risks": "",
        }
      },
      "--- Legal": {
        "title": "LEGAL",
        "type": "separator"
      },
      "legal-and-regulations": {
        "title": "Legal and Regulations",
        "items": {
          "terms-of-use": "",
          "disclaimer": "",
          "privacy-policy": "",
          "competition-terms": ""
        }
      },
    }
  },
  "developers": {
    "title": "Developers",
    "type": "page",
    "items": {
      "concepts": {
        "title": "Concepts",
        "items": {
          "index": "",
          "program-structure": "",
          "account-model": ""
        }
      },
      "velocity-sdk": {
        "title": "Velocity SDK",
        "items": {
          "setup": "",
          "precision-and-types": "",
          "deposits-withdrawals": "",
          "transfers": "",
          "users": "",
          "markets": "",
          "orders": "",
          "pnl-risk": "",
          "events": "",
          "dlob": "DLOB",
          "swaps": "",
          "swift": "",
          "builder-codes": "",
          "sdk-internals": "",
          "autogen": {
            "display": displayWip,
          },
        },
      },
      "data-api": {
        "title": "Data API",
        "items": {
          "index": "",
          "glossary": ""
        }
      },
      "--- guides": {
        "title": "GUIDES",
        "type": "separator"
      },
      "market-makers": {
        "title": "Market Makers",
        "items": {
          "index": "",
          "quickstart": "",
          "dlob-mm": "DLOB MM",
          "jit-only": "",
          "bot-architecture": "",
          "orderbook-and-matching": "",
          "jit-auctions": "",
          "swift-api": "",
          "indicative-quotes": ""
        }
      },
      "vault-managers": {
        "title": "Vault Managers",
        "items": {
          "index": ""
        }
      },
      "trading-automation": {
        "title": "Trading Automation",
        "items": {
          "index": "",
          "bot-wallet": "",
          "trading-workflows": "",
          "keeper-bots": {
            "title": "Keeper Bots",
            "items": {
              "order-matching-bot": "",
              "order-trigger-bot": "",
              "liquidation-bot": "",
              "jit-maker-bot": ""
            }
          },
          "rpc-providers": "",
          "troubleshooting": ""
        }
      },
      "ecosystem-builders": {
        "title": "Ecosystem Builders",
        "items": {
          "index": "",
          "reading-data": "",
          "orderbook-and-ws": "",
          "sending-actions": ""
        },
      },
      "builder-codes": "Builder Codes",
      "--- Contribute": {
        "title": "CONTRIBUTE",
        "type": "separator"
      },
      "contributing-to-velocity": "Contributing to Velocity"
    }
  }
} as MetaRecord;

export default META;
