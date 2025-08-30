// scripts/smokeTest.js
import 'dotenv/config';
import { ethers } from 'ethers';

const { SEP_RPC, PRIVATE_KEY, ORACLE_ADDR } = process.env;

function invariant(cond, msg) { if (!cond) throw new Error(msg); }

async function main() {
  invariant(SEP_RPC, 'Missing SEP_RPC');
  invariant(PRIVATE_KEY, 'Missing PRIVATE_KEY');
  invariant(ORACLE_ADDR, 'Missing ORACLE_ADDR');

  const provider = new ethers.JsonRpcProvider(SEP_RPC);
  const { chainId } = await provider.getNetwork();
  console.log('Connected to chainId:', Number(chainId));

  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log('Wallet address:', await wallet.getAddress());

  const ABI = ["function value() view returns (uint256)"];
  const oracle = new ethers.Contract(ORACLE_ADDR, ABI, provider);
  try {
    const current = await oracle.value();
    console.log('Current on-chain value:', current.toString());
  } catch (e) {
    console.log('Contract read failed. Check ORACLE_ADDR and ABI. Error:', e.message);
  }

  const feeData = await provider.getFeeData();
  console.log('Suggested gas price (gwei):', Number(ethers.formatUnits(feeData.gasPrice ?? 0n, 'gwei')));
}

main().catch(e => { console.error(e); process.exit(1); });
