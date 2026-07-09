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
              "wallet-faq": "Wallet FAQ",
            },
          },
          "cross-collateral-deposits": "",
          "managing-subaccounts": "",
          "delegated-accounts": "",
          "versioned-transactions": "",
          "withdraw-and-close-account": ""
        }
      },
      "trading": {
        "title": "Trading",
        "items": {
          "auction-parameters": "",
          "funding-rates": "",
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
          "liquidations": "",
          "trading-fees": {
            "title": "Trading Fees",
            "items": {
              "other-trading-fees": "",
            }
          },
          "market-specs": "",
        }
      },
      "borrow-lend": {
        "title": "Borrow & Lend",
        "items": {
          "index": "",
          "borrow-lend-faq": "",
          "borrow-lend-apy": "",
          "withdrawal-limits": "",
          "amplify": {
            "title": "Amplify",
            "items": {
              "index": "",
              "opening-a-position": "",
              "managing-a-position": "",
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
          "keepers": {
            "title": "Keepers",
            "items": {
              "keepers-dlob-faq": "",
              "keeper-incentives": "",
            },
          },
          "decentralized-orderbook": "",
          "jit-faq": "",
          "oracles": "",
          "liquidation-engine": "",
          "revenue-pool": "",
          "fee-pool": "",
          "profit-loss-pool": "",
          "borrow-interest-rate": "",
          "isolated-pools": "",
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
          "contract-tiers": "",
          "block-conditions": "",
          "delisting-process": "",
          "protocol-guard-rails": "",
          "audits": "",
          "bug-bounty": {
            display: 'hidden',
          },
          "risks": "",
        }
      },
      "--- Terms": {
        "title": "TERMS",
        "type": "separator"
      },
      "legal-and-regulations": {
        "title": "Legal and Regulations",
        "items": {
          "terms-of-use": "",
          "disclaimer": "",
          "privacy-policy": ""
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
          "account-model": "",
          "optimizations": "",
          "program-vault-addresses": ""
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
      "migrate-from-drift": {
        "title": "Migrate from Drift",
        "items": {
          "agent-guide": "AI Agent Guide"
        }
      },
      "market-makers": {
        "title": "Market Makers",
        "items": {
          "quickstart": "",
          "orderbook-and-matching": "",
          "jit-auctions": "",
          "dlob-mm": "DLOB MM",
          "jit-only": "",
          "bot-architecture": "",
          "swift-api": "",
          "indicative-quotes": ""
        }
      },
      "vault-managers": {
        "title": "Vault Managers",
        "items": {
          "quickstart": "",
          "trusted-vaults": "",
          "multisig-ops": "Multisig Ops"
        }
      },
      "trading-automation": {
        "title": "Trading Automation",
        "items": {
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
          "troubleshooting": ""
        }
      },
      "ecosystem-builders": {
        "title": "Ecosystem Builders",
        "items": {
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
