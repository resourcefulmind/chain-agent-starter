# Chain Agent Starter (No-Demo Edition)

A minimal starter to show the **agent → policy/signer → Ethereum** flow on **Sepolia**.
- Uses **ethers v6** + Node.js (no framework).
- Provides a **mock planner** if no Gaia endpoint is set.
- Demonstrates a **policy gate** (allow‑list + simple gas cap) before signing.
- Interacts with a simple contract function: `updateValue(uint256)`.

> Designed for post‑talk use. It runs locally. For production, replace the mock planner with a call to your **Gaia** inference endpoint.

## What you need
- Node.js v18+
- A **throwaway** Sepolia private key funded with test ETH (≥ 0.02)
- A deployed contract with `function updateValue(uint256) external`
  - You can deploy the included `contracts/AgentOracle.sol` using **Remix** (steps below).

## Quick start
```bash
git clone <your-repo-url> chain-agent-starter
cd chain-agent-starter
cp .env.example .env
# edit .env with your values
npm install
node scripts/smokeTest.js   # optional: sanity check
node scripts/demoAgent.js
```

### .env values
```
SEP_RPC=            # e.g., https://sepolia.infura.io/v3/<key>
PRIVATE_KEY=        # throwaway testnet key only
ORACLE_ADDR=        # address of deployed AgentOracle
GAIA_ENDPOINT=      # optional; if unset, a local mock planner will be used
POLICY_ALLOWED_FN=updateValue(uint256)
POLICY_MAX_GAS_GWEI=50
```

## Deploy the contract quickly (Remix)
1. Open https://remix.ethereum.org
2. Create `AgentOracle.sol` with the file below.
3. Compile with Solidity ^0.8.20.
4. In **Deploy & Run**, choose **Sepolia**, set your injected provider or a wallet extension.
5. Deploy; copy the contract address to `ORACLE_ADDR` in `.env`.

## What the scripts do
1. **Planner**: calls GAIA_ENDPOINT (if set) for an intent; otherwise uses a simple local mock that proposes a `newValue` (random 1..999) and a reason.
2. **Policy**: checks the function is allowed and current gas price ≤ `POLICY_MAX_GAS_GWEI` (rough cap).
3. **Signer**: builds, signs, and sends `updateValue(newValue)` to your contract on Sepolia.
4. **Verify**: prints the transaction hash; you can view it on Etherscan.

## Smoke test (sanity check before sending a tx)
```bash
node scripts/smokeTest.js
# Expect: connected chainId, your wallet address, current value(), and a suggested gas price
```

## Security notes
- Never use a mainnet key for testing. Use a **throwaway** key and delete it after use.
- Keep your `.env` out of source control (gitignore already included).

## Next steps
- Replace the mock planner with a real call to your **Gaia** inference node.
- Extend the policy layer (daily spend caps, rate‑limits, human‑in‑the‑loop).
- Swap `updateValue` for a function that matches your use‑case.
