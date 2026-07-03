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
      "about-v3": {
        "title": "About Velocity",
        "items": {
          "index": "Understanding Velocity",
          "drift-amm": "",
          "decentralized-orderbook": "",
          "keepers": {
            "title": "Keepers",
            "items": {
              "index": "",
              "keepers-dlob-faq": "",
              "keeper-incentives": "",
            },
          },
          "matching-engine": "",
          "jit-faq": "",
          "revenue-pool": "",
          "optimizations": "",
        }
      },
      "getting-started": {
        "title": "Getting Started",
        "items": {
          "wallet-setup": {
            "title": "Wallet Setup",
            "items": {
              "index": "",
              "phantom-wallet": "",
              "metamask": "",
              "passwordless-login": "",
              "bot-wallet": "",
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
              "profit-loss-pool": ""
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
              "liquidation-engine": "",
              "liquidators": ""
            }
          },
          "trading-fees": {
            "title": "Trading Fees",
            "items": {
              "index": "",
              "fee-pool": "",
              "other-trading-fees": "",
            }
          },
          "versioned-transactions": "",
          "oracles": "",
          "block-conditions": "",
        }
      },
      "borrow-lend": {
        "title": "Borrow & Lend",
        "items": {
          "index": "",
          "borrow-interest-rate": "",
          "isolated-pools": "",
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
      "market-makers": {
        "title": "Market Makers",
        "items": {
          "index": "",
          "market-maker-participation": "",
          "maker-fee-rebate": "",
        }
      },
      "insurance-fund": {
        "title": "Insurance Fund",
        "items": {
          "index": "",
          "insurance-fund-staking": ""
        }
      },
      "rewards": {
        "title": "Rewards",
        "items": {
          "index": "",
          "referral-links": "",
        },
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
      "glossary": "",
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
