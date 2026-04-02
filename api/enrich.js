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

// ---- Ethereum enrichment via Etherscan free API ----
async function enrichEthereum(address) {
  const base = 'https://api.etherscan.io/api';
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

  // Fire all requests in parallel, catch individually so partial data still returns
  const [balRes, txListRes, codeRes] = await Promise.allSettled([
    // Balance
    httpGet(base + '?module=account&action=balance&address=' + address + '&tag=latest'),
    // Transaction list (first + last, page=1 limited, then last page)
    httpGet(base + '?module=account&action=txlist&address=' + address + '&startblock=0&endblock=99999999&page=1&offset=1&sort=asc'),
    // Check if contract (getcode)
    httpGet(base + '?module=proxy&action=eth_getCode&address=' + address + '&tag=latest')
  ]);

  // Balance
  if (balRes.status === 'fulfilled' && balRes.value && balRes.value.status === '1') {
    const weiStr = balRes.value.result;
    result.balance = weiStr;
    // Convert wei to ETH (avoid BigInt for serverless compat)
    const wei = parseFloat(weiStr);
    result.balanceEth = (wei / 1e18).toFixed(6);
  } else if (balRes.status === 'fulfilled' && balRes.value) {
    result.balance = balRes.value.result || null;
  }

  // First transaction
  if (txListRes.status === 'fulfilled' && txListRes.value && txListRes.value.status === '1' && Array.isArray(txListRes.value.result) && txListRes.value.result.length > 0) {
    const firstTx = txListRes.value.result[0];
    result.firstTx = new Date(parseInt(firstTx.timeStamp) * 1000).toISOString();

    // Now get last tx
    try {
      const lastRes = await httpGet(base + '?module=account&action=txlist&address=' + address + '&startblock=0&endblock=99999999&page=1&offset=1&sort=desc');
      if (lastRes && lastRes.status === '1' && Array.isArray(lastRes.result) && lastRes.result.length > 0) {
        result.lastTx = new Date(parseInt(lastRes.result[0].timeStamp) * 1000).toISOString();
      }
    } catch (_) { /* partial data is fine */ }
  }

  // Transaction count via eth_getTransactionCount (proxy)
  try {
    const txCountRes = await httpGet(base + '?module=proxy&action=eth_getTransactionCount&address=' + address + '&tag=latest');
    if (txCountRes && txCountRes.result) {
      result.txCount = parseInt(txCountRes.result, 16);
    }
  } catch (_) { /* partial data */ }

  // Is contract
  if (codeRes.status === 'fulfilled' && codeRes.value && codeRes.value.result) {
    const code = codeRes.value.result;
    result.isContract = code !== '0x' && code !== '0x0' && code.length > 4;
  }

  // Token holdings count (ERC-20 transfers as proxy for unique tokens held)
  try {
    const tokRes = await httpGet(base + '?module=account&action=tokentx&address=' + address + '&page=1&offset=100&sort=desc');
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
