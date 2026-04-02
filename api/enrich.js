const { protect } = require('./middleware.js');
const https = require('https');
const http = require('http');

// Simple fetch wrapper using built-in https/http (no node-fetch dependency)
function httpGet(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), opts.timeout || 8000);
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        clearTimeout(timer);
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    }).on('error', (err) => { clearTimeout(timer); reject(err); });
  });
}

function httpPost(url, body, opts = {}) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), opts.timeout || 8000);
    const parsed = new URL(url);
    const mod = parsed.protocol === 'https:' ? https : http;
    const payload = JSON.stringify(body);
    const reqOpts = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    };
    const req = mod.request(reqOpts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        clearTimeout(timer);
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });
    req.on('error', (err) => { clearTimeout(timer); reject(err); });
    req.write(payload);
    req.end();
  });
}

// ---- Ethereum enrichment via public RPC + Etherscan V2 ----
async function enrichEthereum(address) {
  const rpc = 'https://ethereum-rpc.publicnode.com';
  const base = 'https://api.etherscan.io/v2/api';
  const result = {
    address,
    chain: 'ETH',
    balance: null,
    balanceEth: null,
    txCount: null,
    isContract: false,
    firstTx: null,
    lastTx: null,
    tokenHoldings: 0,
    riskFlags: [],
    error: null
  };

  // Fire all requests in parallel via public JSON-RPC
  const [balRes, txCountRes, codeRes] = await Promise.allSettled([
    // Balance via public RPC
    httpPost(rpc, { jsonrpc: '2.0', method: 'eth_getBalance', params: [address, 'latest'], id: 1 }),
    // Transaction count via public RPC
    httpPost(rpc, { jsonrpc: '2.0', method: 'eth_getTransactionCount', params: [address, 'latest'], id: 2 }),
    // Check if contract
    httpPost(rpc, { jsonrpc: '2.0', method: 'eth_getCode', params: [address, 'latest'], id: 3 })
  ]);

  // Balance
  if (balRes.status === 'fulfilled' && balRes.value && balRes.value.result) {
    const weiHex = balRes.value.result;
    const wei = parseInt(weiHex, 16);
    result.balance = wei.toString();
    result.balanceEth = (wei / 1e18).toFixed(6);
  }

  // Transaction count
  if (txCountRes.status === 'fulfilled' && txCountRes.value && txCountRes.value.result) {
    result.txCount = parseInt(txCountRes.value.result, 16);
  }

  // Is contract
  if (codeRes.status === 'fulfilled' && codeRes.value && codeRes.value.result) {
    const code = codeRes.value.result;
    result.isContract = code !== '0x' && code !== '0x0' && code.length > 4;
    if (result.isContract) result.riskFlags.push('Contract address');
  }

  // Risk flags based on data
  if (result.txCount > 100) result.riskFlags.push('High activity');
  if (result.balanceEth && parseFloat(result.balanceEth) === 0) result.riskFlags.push('Drained (zero balance)');
  if (result.balanceEth && parseFloat(result.balanceEth) > 100) result.riskFlags.push('High value holder');

  // Skip Etherscan-dependent lookups (V1 deprecated, V2 needs key)
  // Token holdings — not available without API key
  try {
    const tokRes = { status: '0', result: [] }; // Placeholder — Etherscan V2 needs key
    if (tokRes && tokRes.status === '1' && Array.isArray(tokRes.result)) {
      const uniqueTokens = new Set(tokRes.result.map(t => t.contractAddress));
      result.tokenHoldings = uniqueTokens.size;
    }
  } catch (_) { /* partial data */ }

  // Risk flags
  if (result.isContract) result.riskFlags.push('Contract address');
  if (result.balanceEth && parseFloat(result.balanceEth) > 1000) result.riskFlags.push('High balance (>1000 ETH)');
  if (result.txCount === 0) result.riskFlags.push('No outgoing transactions');
  if (result.firstTx) {
    const ageMs = Date.now() - new Date(result.firstTx).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays < 7) result.riskFlags.push('New address (<7 days old)');
  }

  return result;
}

// ---- Solana enrichment via public RPC ----
async function enrichSolana(address) {
  const rpc = 'https://api.mainnet-beta.solana.com';
  const result = {
    address,
    chain: 'SOL',
    balance: null,
    balanceSol: null,
    txCount: null,
    isContract: false,
    firstTx: null,
    lastTx: null,
    tokenHoldings: 0,
    riskFlags: [],
    error: null
  };

  // Get balance
  try {
    const balRes = await httpPost(rpc, {
      jsonrpc: '2.0', id: 1, method: 'getBalance', params: [address]
    });
    if (balRes && balRes.result && balRes.result.value !== undefined) {
      result.balance = String(balRes.result.value);
      result.balanceSol = (balRes.result.value / 1e9).toFixed(6);
    }
  } catch (_) { /* partial */ }

  // Get recent signatures (for tx count estimate, first/last tx)
  try {
    const sigRes = await httpPost(rpc, {
      jsonrpc: '2.0', id: 2, method: 'getSignaturesForAddress',
      params: [address, { limit: 1000 }]
    });
    if (sigRes && sigRes.result && Array.isArray(sigRes.result)) {
      const sigs = sigRes.result;
      result.txCount = sigs.length; // capped at 1000; indicates >= 1000 if full
      if (sigs.length > 0) {
        // Most recent is first in array
        result.lastTx = sigs[0].blockTime ? new Date(sigs[0].blockTime * 1000).toISOString() : null;
        result.firstTx = sigs[sigs.length - 1].blockTime ? new Date(sigs[sigs.length - 1].blockTime * 1000).toISOString() : null;
      }
      if (sigs.length >= 1000) result.riskFlags.push('High activity (1000+ transactions)');
    }
  } catch (_) { /* partial */ }

  // Check if executable (program/contract)
  try {
    const acctRes = await httpPost(rpc, {
      jsonrpc: '2.0', id: 3, method: 'getAccountInfo',
      params: [address, { encoding: 'jsonParsed' }]
    });
    if (acctRes && acctRes.result && acctRes.result.value) {
      result.isContract = acctRes.result.value.executable === true;
    }
  } catch (_) { /* partial */ }

  // Token accounts
  try {
    const tokRes = await httpPost(rpc, {
      jsonrpc: '2.0', id: 4, method: 'getTokenAccountsByOwner',
      params: [address, { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' }, { encoding: 'jsonParsed' }]
    });
    if (tokRes && tokRes.result && Array.isArray(tokRes.result.value)) {
      result.tokenHoldings = tokRes.result.value.length;
    }
  } catch (_) { /* partial */ }

  // Risk flags
  if (result.isContract) result.riskFlags.push('Program (executable) account');
  if (result.balanceSol && parseFloat(result.balanceSol) > 10000) result.riskFlags.push('High balance (>10000 SOL)');
  if (result.txCount === 0) result.riskFlags.push('No transactions found');
  if (result.firstTx) {
    const ageMs = Date.now() - new Date(result.firstTx).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays < 7) result.riskFlags.push('New address (<7 days old)');
  }

  return result;
}

// ---- Exported handler with protect middleware ----
module.exports = protect(async function(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET only' });
  }

  const { address, chain } = req.query;
  if (!address) {
    return res.status(400).json({ error: 'address query parameter required' });
  }

  const chainUpper = (chain || 'ETH').toUpperCase();
  const startTime = Date.now();

  try {
    let enrichment;
    if (chainUpper === 'SOL' || chainUpper === 'SOLANA') {
      enrichment = await enrichSolana(address);
    } else {
      // Default to Ethereum (covers ETH, BSC patterns via Etherscan-compatible APIs)
      enrichment = await enrichEthereum(address);
    }

    enrichment.enrichedAt = new Date().toISOString();
    enrichment.latencyMs = Date.now() - startTime;

    return res.status(200).json(enrichment);
  } catch (err) {
    return res.status(500).json({
      error: 'Enrichment failed',
      message: err.message,
      address,
      chain: chainUpper
    });
  }
}, { ratePerMinute: 10 });

// Export enrichment functions for internal use by alerts.js
module.exports.enrichEthereum = enrichEthereum;
module.exports.enrichSolana = enrichSolana;
