// scripts/demoAgent.js
import 'dotenv/config';
import fetch from 'node-fetch';
import { ethers } from 'ethers';

const {
  SEP_RPC,
  PRIVATE_KEY,
  ORACLE_ADDR,
  GAIA_ENDPOINT,
  POLICY_ALLOWED_FN = 'updateValue(uint256)',
  POLICY_MAX_GAS_GWEI = '50'
} = process.env;

function invariant(cond, msg) { if (!cond) throw new Error(msg); }

async function getIntent() {
  if (GAIA_ENDPOINT) {
    try {
      const res = await fetch(GAIA_ENDPOINT, { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ prompt: 'Propose new value if delta > 1%' }) });
      const data = await res.json();
      return { action: 'updateValue', newValue: Number(data?.newValue ?? 1), reason: data?.reason ?? 'from Gaia endpoint', confidence: data?.confidence ?? 0.7 };
    } catch (e) {
      console.warn('Gaia endpoint failed, falling back to mock. Error:', e.message);
    }
  }
  const newValue = Math.floor(1 + Math.random() * 999);
  return { action: 'updateValue', newValue, reason: 'random mock', confidence: 0.5 };
}

function policyCheck(intent, gasPriceGwei, allowedFn, maxGasGwei) {
  const allowed = allowedFn.startsWith('updateValue(');
  const gasOk = gasPriceGwei <= maxGasGwei;
  return { allowed, gasOk, allowedFn, gasPriceGwei, maxGasGwei };
}

const ABI = [
  "function updateValue(uint256 newValue) external",
  "function value() view returns (uint256)",
  "event ValueUpdated(uint256 newValue)"
];

async function main() {
  invariant(SEP_RPC, 'Missing SEP_RPC');
  invariant(PRIVATE_KEY, 'Missing PRIVATE_KEY');
  invariant(ORACLE_ADDR, 'Missing ORACLE_ADDR');

  const provider = new ethers.JsonRpcProvider(SEP_RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const oracle = new ethers.Contract(ORACLE_ADDR, ABI, wallet);

  const intent = await getIntent();
  console.log('Intent:', intent);

  const feeData = await provider.getFeeData();
  const gasPriceGwei = Number(ethers.formatUnits(feeData.gasPrice ?? 0n, 'gwei'));
  const check = policyCheck(intent, gasPriceGwei, POLICY_ALLOWED_FN, Number(POLICY_MAX_GAS_GWEI));
  console.log('Policy check:', check);
  invariant(check.allowed && check.gasOk, 'Policy rejected: not allowed or gas too high');

  const tx = await oracle.updateValue(intent.newValue);
  console.log('TX hash:', tx.hash);
  const rcpt = await tx.wait();
  console.log('Mined in block:', rcpt.blockNumber);
  const current = await oracle.value();
  console.log('On-chain value now:', current.toString());
}

main().catch(e => { console.error(e); process.exit(1); });
