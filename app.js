/* ===== CHAIN911 — CRYPTO EXPLOIT ALERT RELAY ===== */

// ===== MOCK DATA =====

const REPORTERS = [
  { id: 'r1', handle: 'ZachXBT', role: 'Independent Investigator', color: '#3366ff', totalAlerts: 847, confirmedAlerts: 832, falsePositives: 15, joinedAt: '2023-06-15' },
  { id: 'r2', handle: 'PeckShield', role: 'Security Firm', color: '#aa66ff', totalAlerts: 1203, confirmedAlerts: 1161, falsePositives: 42, joinedAt: '2023-03-01' },
  { id: 'r3', handle: 'SlowMist', role: 'Security Firm', color: '#00ccff', totalAlerts: 634, confirmedAlerts: 601, falsePositives: 33, joinedAt: '2023-04-22' },
  { id: 'r4', handle: 'samczsun', role: 'Paradigm Security', color: '#00ff88', totalAlerts: 312, confirmedAlerts: 309, falsePositives: 3, joinedAt: '2023-02-10' },
  { id: 'r5', handle: 'Tayvano', role: 'MetaMask Security', color: '#ff6633', totalAlerts: 289, confirmedAlerts: 278, falsePositives: 11, joinedAt: '2023-07-01' },
  { id: 'r6', handle: 'CertiK Alert', role: 'Security Firm', color: '#ffaa00', totalAlerts: 1567, confirmedAlerts: 1442, falsePositives: 125, joinedAt: '2023-01-15' },
  { id: 'r7', handle: 'officer_cia', role: 'OSINT Researcher', color: '#ff3366', totalAlerts: 198, confirmedAlerts: 193, falsePositives: 5, joinedAt: '2023-09-10' },
  { id: 'r8', handle: 'CryptoForensic', role: 'Forensic Analyst', color: '#44aaff', totalAlerts: 156, confirmedAlerts: 153, falsePositives: 3, joinedAt: '2024-01-05' },
];

const CHAINS = ['ETH', 'SOL', 'BSC', 'ARB', 'BASE', 'POLY', 'AVAX'];

const TEAMS = [
  { id: 't1', name: 'deBridge', type: 'Bridge' },
  { id: 't2', name: 'Wormhole', type: 'Bridge' },
  { id: 't3', name: 'SwapKit', type: 'Aggregator' },
  { id: 't4', name: 'LayerZero', type: 'Messaging' },
  { id: 't5', name: 'Stargate', type: 'Bridge' },
  { id: 't6', name: 'Across Protocol', type: 'Bridge' },
];

const DESCRIPTIONS = [
  'Drainer contract deployed {t} ago, already {n} victims. Funds moving to mixer.',
  'Flash loan exploit preparation detected — approval pattern matches known attack vector.',
  'Known phishing address reactivated after {t} dormancy. New approval transactions observed.',
  'Bridge exploit in progress — abnormal outflow detected. {a} drained so far.',
  'Reentrancy attack on lending protocol. Attacker address linked to previous {chain} exploit.',
  'Governance manipulation — attacker acquired voting power via flash loan. Proposal executing in {t}.',
  'Private key compromise suspected — rapid sequential drains across multiple wallets.',
  'Oracle manipulation attack — price feed deviation of {n}% observed on DEX pair.',
  'Malicious proxy upgrade detected — implementation contract replaced {t} ago.',
  'Suspected DPRK-linked address cluster reactivated. {n} addresses, {a} total value.',
  'MEV sandwich attack escalation — bot extracting {a} per block from AMM pools.',
  'Fake token airdrop campaign targeting {chain} users. Contract contains hidden transfer hooks.',
];

function randomAddr() {
  const hex = '0123456789abcdef';
  let addr = '0x';
  for (let i = 0; i < 40; i++) addr += hex[Math.floor(Math.random() * 16)];
  return addr;
}

function randomAmount() {
  const amounts = ['$142K', '$1.2M', '$3.8M', '$890K', '$12.4M', '$520K', '$2.1M', '$67K', '$4.5M', '$950K'];
  return amounts[Math.floor(Math.random() * amounts.length)];
}

function randomTime() {
  const times = ['2h', '45m', '6h', '12h', '3 days', '1h', '30m', '15m'];
  return times[Math.floor(Math.random() * times.length)];
}

function generateDescription() {
  let desc = DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)];
  desc = desc.replace('{t}', randomTime());
  desc = desc.replace('{n}', String(Math.floor(Math.random() * 200) + 5));
  desc = desc.replace('{a}', randomAmount());
  desc = desc.replace('{chain}', CHAINS[Math.floor(Math.random() * CHAINS.length)]);
  return desc;
}

function generateEnrichment(chain) {
  const balances = { ETH: ['12.4 ETH', '0.89 ETH', '345.2 ETH', '1,203.5 ETH'], SOL: ['890 SOL', '12,400 SOL', '45.6 SOL'], BSC: ['234 BNB', '12.1 BNB', '1,890 BNB'] };
  const chainBalances = balances[chain] || ['Unknown'];
  return {
    balance: chainBalances[Math.floor(Math.random() * chainBalances.length)],
    txCount: Math.floor(Math.random() * 500) + 10,
    firstTx: new Date(Date.now() - Math.random() * 90 * 86400000).toISOString(),
    lastTx: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    tokenHoldings: Math.floor(Math.random() * 15) + 1,
    riskFlags: Math.random() > 0.3 ? ['Mixer interaction', 'Tornado Cash', 'New contract deployer'].slice(0, Math.floor(Math.random() * 3) + 1) : ['None detected'],
    contractVerified: Math.random() > 0.6,
    fundingSource: Math.random() > 0.5 ? 'Tornado Cash' : Math.random() > 0.5 ? 'FixedFloat' : 'Direct from CEX',
  };
}

// ===== DATA SERVICE (API-backed, Neon Postgres) =====

class DataService {
  constructor() {
    this._cache = {};
    this._team = { id: 't3', name: 'SwapKit' };
  }

  async _fetch(url, opts) {
    const res = await fetch(url, opts);
    return res.json();
  }

  async getAlerts(filters = {}) {
    const params = new URLSearchParams();
    if (filters.chain) params.set('chain', filters.chain);
    if (filters.severity) params.set('severity', filters.severity);
    if (filters.status) params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);
    const qs = params.toString();
    const alerts = await this._fetch('/api/alerts' + (qs ? '?' + qs : ''));
    // Normalize field names from DB (snake_case) to frontend (camelCase)
    return alerts.map(a => ({
      ...a,
      reporterId: a.reporter_id,
      evidenceUrl: a.evidence_url,
      createdAt: new Date(a.created_at).getTime(),
      attackType: a.attack_type,
      enrichment: typeof a.enrichment === 'string' ? JSON.parse(a.enrichment) : a.enrichment,
      decisions: (a.decisions || []).map(d => ({
        ...d,
        alertId: d.alert_id,
        teamId: d.team_id,
        teamName: d.team_name,
        decidedAt: new Date(d.decided_at).getTime(),
      })),
    }));
  }

  async getAlert(id) {
    const alerts = await this.getAlerts();
    return alerts.find(a => a.id === id);
  }

  async createAlert(data) {
    const result = await this._fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reporter_id: data.reporterId,
        address: data.address,
        chain: data.chain,
        evidence_url: data.evidenceUrl,
        description: data.description,
        severity: data.severity,
      }),
    });
    return result;
  }

  async getDecisions(alertId) {
    const decisions = await this._fetch('/api/decisions?alert_id=' + alertId);
    return decisions.map(d => ({
      ...d,
      alertId: d.alert_id,
      teamId: d.team_id,
      teamName: d.team_name,
      decidedAt: new Date(d.decided_at).getTime(),
    }));
  }

  async submitDecision(alertId, teamId, action) {
    const team = TEAMS.find(t => t.id === teamId);
    return this._fetch('/api/decisions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alert_id: alertId, team_id: teamId, team_name: team?.name, action }),
    });
  }

  async getAuditLog(filters = {}) {
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.search) params.set('search', filters.search);
    const qs = params.toString();
    const log = await this._fetch('/api/audit' + (qs ? '?' + qs : ''));
    return log.map(e => ({
      ...e,
      alertId: e.alert_id,
      timestamp: new Date(e.created_at).getTime(),
    }));
  }

  async getWebhooks() {
    return this._fetch('/api/webhooks');
  }

  async toggleWebhook(id) {
    const wh = await this.getWebhooks();
    const hook = wh.find(w => w.id === id);
    if (hook) {
      return this._fetch('/api/webhooks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled: !hook.enabled }),
      });
    }
  }

  getTeam() { return this._team; }
}

const db = new DataService();

// ===== UTILITIES =====

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return Math.floor(diff / 86400000) + 'd ago';
}

function truncAddr(addr) {
  if (!addr || addr.length < 12) return addr;
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function getReporter(id) { return REPORTERS.find(r => r.id === id) || { handle: 'Unknown', color: '#888' }; }

function accuracy(r) {
  if (!r.totalAlerts) return '0.0';
  return ((r.confirmedAlerts / r.totalAlerts) * 100).toFixed(1);
}

function toast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const icons = { success: '\u2713', error: '\u2717', info: '\u2139' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type] || ''}</span> ${message}`;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }, 3500);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard', 'success'));
}

// ===== ROUTER =====

async function route() {
  const hash = window.location.hash || '#/dashboard';
  const [path, param] = hash.slice(2).split('/');

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.route === path);
  });

  const app = document.getElementById('app');
  app.innerHTML = '<div class="empty-state"><p>Loading...</p></div>';

  try {
    switch (path) {
      case 'dashboard': app.innerHTML = await renderDashboard(); initDashboard(); break;
      case 'submit': app.innerHTML = await renderSubmit(); initSubmit(); break;
      case 'alert': app.innerHTML = await renderAlertDetail(param); initAlertDetail(param); break;
      case 'reporters': app.innerHTML = await renderReporters(); break;
      case 'reporter': app.innerHTML = await renderReporterDetail(param); break;
      case 'audit': app.innerHTML = await renderAudit(); initAudit(); break;
      case 'settings': app.innerHTML = await renderSettings(); initSettings(); break;
      default: app.innerHTML = await renderDashboard(); initDashboard();
    }
  } catch (err) {
    app.innerHTML = `<div class="empty-state"><h3>Error loading data</h3><p>${err.message}</p><p>If this is a fresh deploy, <button class="btn btn-primary" onclick="seedDatabase()">Seed Database</button></p></div>`;
  }
}

async function seedDatabase() {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="empty-state"><p>Seeding database with real exploit data...</p></div>';
  try {
    const res = await fetch('/api/seed', { method: 'POST' });
    const data = await res.json();
    toast(data.message || 'Database seeded!', 'success');
    route();
  } catch (err) {
    toast('Seed failed: ' + err.message, 'error');
  }
}

window.addEventListener('hashchange', route);

// ===== DASHBOARD =====

async function renderDashboard() {
  const alerts = await db.getAlerts();
  const active = alerts.filter(a => a.status === 'active').length;
  const last24h = alerts.filter(a => Date.now() - a.createdAt < 86400000).length;
  const decisionEntries = await db.getAuditLog({ type: 'decision_made' });
  let avgMin = 0;
  if (decisionEntries.length > 0 && alerts.length > 0) {
    const alertMap = {};
    alerts.forEach(a => { alertMap[a.id] = a.createdAt; });
    let totalMs = 0, count = 0;
    decisionEntries.forEach(d => {
      const alertTime = alertMap[d.alertId || d.alert_id];
      if (alertTime) { totalMs += d.timestamp - alertTime; count++; }
    });
    avgMin = count > 0 ? Math.round(totalMs / count / 60000) : 0;
  }

  return `
    <div class="page-header">
      <h1>Alert Dashboard</h1>
      <p>Real-time exploit alerts from verified security researchers</p>
    </div>

    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-label">Alerts (24h)</div>
        <div class="stat-value red">${last24h}</div>
        <div class="stat-sub">${alerts.length} total</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Active Investigations</div>
        <div class="stat-value amber">${active}</div>
        <div class="stat-sub">Awaiting team response</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg Response Time</div>
        <div class="stat-value green">${avgMin}m</div>
        <div class="stat-sub">From alert to first decision</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Verified Reporters</div>
        <div class="stat-value blue">${REPORTERS.length}</div>
        <div class="stat-sub">${REPORTERS.reduce((s, r) => s + r.totalAlerts, 0).toLocaleString()} lifetime alerts</div>
      </div>
    </div>

    <div id="analytics-section" style="margin-bottom:24px">
      <div style="text-align:center;color:#888;padding:20px">Loading analytics...</div>
    </div>

    <div class="filter-bar">
      <input class="form-input" id="dash-search" type="search" placeholder="Search address or description..." style="min-width:240px" />
      <select class="form-select" id="dash-chain"><option value="">All Chains</option>${CHAINS.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
      <select class="form-select" id="dash-severity"><option value="">All Severities</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
      <select class="form-select" id="dash-status"><option value="">All Status</option><option value="active">Active</option><option value="investigating">Investigating</option><option value="resolved">Resolved</option></select>
    </div>

    <div class="alert-list" id="alert-list">
      ${renderAlertList(alerts)}
    </div>
  `;
}

function renderAlertList(alerts) {
  if (!alerts.length) return '<div class="empty-state"><h3>No alerts match your filters</h3><p>Try broadening your search</p></div>';

  return alerts.map(a => {
    const reporter = getReporter(a.reporterId);
    const decisions = a.decisions || [];
    const chainClass = a.chain.toLowerCase();

    return `
      <div class="alert-card" onclick="window.location.hash='#/alert/${a.id}'">
        <div class="severity-dot ${a.severity}"></div>
        <div class="alert-body">
          <div class="alert-title">${a.description}</div>
          <div class="alert-meta">
            <span class="chain-tag ${chainClass}">${a.chain}</span>
            <span class="address">${truncAddr(a.address)}</span>
            <span>${reporter.handle}</span>
            <span class="severity-badge ${a.severity}">${a.severity}</span>
            <span class="status-pill ${a.status}">${a.status}</span>
          </div>
        </div>
        <div class="alert-consensus" title="${decisions.length}/${TEAMS.length} teams responded">
          ${TEAMS.map(team => {
            const d = decisions.find(dd => dd.teamId === team.id);
            return `<div class="consensus-pip ${d ? d.action : ''}" title="${team.name}: ${d ? d.action : 'pending'}"></div>`;
          }).join('')}
        </div>
        <div class="alert-time">${timeAgo(a.createdAt)}</div>
      </div>
    `;
  }).join('');
}

function initDashboard() {
  const applyFilters = async () => {
    const filters = {
      search: document.getElementById('dash-search')?.value || '',
      chain: document.getElementById('dash-chain')?.value || '',
      severity: document.getElementById('dash-severity')?.value || '',
      status: document.getElementById('dash-status')?.value || '',
    };
    const alerts = await db.getAlerts(filters);
    const list = document.getElementById('alert-list');
    if (list) list.innerHTML = renderAlertList(alerts);
  };

  ['dash-search', 'dash-chain', 'dash-severity', 'dash-status'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(id === 'dash-search' ? 'input' : 'change', applyFilters);
  });

  // Load analytics section
  loadAnalyticsSection();
}

async function loadAnalyticsSection() {
  const section = document.getElementById('analytics-section');
  if (!section) return;

  try {
    const res = await fetch('/api/analytics');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load analytics');

    const maxChainCount = Math.max(...Object.values(data.byChain), 1);
    const chainBars = Object.entries(data.byChain)
      .sort(([,a], [,b]) => b - a)
      .map(([chain, count]) => {
        const pct = Math.round(count / maxChainCount * 100);
        const colors = { ETH: '#627eea', SOL: '#9945ff', BSC: '#f0b90b', ARB: '#28a0f0', BASE: '#0052ff', POLY: '#8247e5', AVAX: '#e84142' };
        const color = colors[chain] || '#888';
        return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span style="width:40px;font-size:12px;color:#ccc;text-align:right">${chain}</span>
          <div style="flex:1;background:#1a1a2e;border-radius:4px;height:22px;overflow:hidden">
            <div style="width:${pct}%;height:100%;background:${color};border-radius:4px;display:flex;align-items:center;padding-left:6px">
              <span style="font-size:11px;color:#fff;font-weight:600">${count}</span>
            </div>
          </div>
        </div>`;
      }).join('');

    const attrClusters = (data.correlations?.attributionClusters || []);
    const dprkCount = attrClusters.filter(c => c.attribution.toLowerCase().includes('dprk') || c.attribution.toLowerCase().includes('lazarus') || c.attribution.toLowerCase().includes('north korea')).reduce((s, c) => s + c.alertCount, 0);
    const unknownCount = data.totalAlerts - attrClusters.reduce((s, c) => s + c.alertCount, 0);
    const otherAttrCount = attrClusters.filter(c => {
      const l = c.attribution.toLowerCase();
      return !l.includes('dprk') && !l.includes('lazarus') && !l.includes('north korea');
    }).reduce((s, c) => s + c.alertCount, 0);

    const attrRows = attrClusters.slice(0, 8).map(c => {
      const isDprk = c.attribution.toLowerCase().includes('dprk') || c.attribution.toLowerCase().includes('lazarus') || c.attribution.toLowerCase().includes('north korea');
      const tagColor = isDprk ? '#ff4444' : '#666';
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #1a1a2e">
        <span style="font-size:13px;color:#ccc">${c.attribution}</span>
        <span style="font-size:12px;font-weight:700;color:${tagColor};background:${tagColor}22;padding:2px 8px;border-radius:10px">${c.alertCount}</span>
      </div>`;
    }).join('');

    section.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">
        <div class="card" style="text-align:center;padding:24px">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:8px">Total Stolen</div>
          <div style="font-size:36px;font-weight:800;color:#ff4444;line-height:1">${data.totalStolenFormatted}</div>
          <div style="font-size:12px;color:#666;margin-top:6px">${data.totalAlerts} alerts tracked</div>
          <div style="display:flex;justify-content:center;gap:12px;margin-top:12px">
            <span style="font-size:11px;color:#ff6b6b"><span style="font-weight:700">${data.bySeverity.critical}</span> critical</span>
            <span style="font-size:11px;color:#ffa500"><span style="font-weight:700">${data.bySeverity.high}</span> high</span>
            <span style="font-size:11px;color:#f5c542"><span style="font-weight:700">${data.bySeverity.medium}</span> med</span>
            <span style="font-size:11px;color:#888"><span style="font-weight:700">${data.bySeverity.low}</span> low</span>
          </div>
        </div>

        <div class="card" style="padding:16px">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:12px">Alerts by Chain</div>
          ${chainBars}
        </div>

        <div class="card" style="padding:16px">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:12px">Attribution</div>
          ${attrRows || '<div style="color:#666;font-size:13px">No attribution data yet</div>'}
          <div style="display:flex;gap:12px;margin-top:10px;padding-top:8px;border-top:1px solid #1a1a2e">
            <span style="font-size:11px;color:#ff4444"><span style="font-weight:700">${dprkCount}</span> DPRK-linked</span>
            <span style="font-size:11px;color:#666"><span style="font-weight:700">${unknownCount}</span> unattributed</span>
            <span style="font-size:11px;color:#888"><span style="font-weight:700">${otherAttrCount}</span> other</span>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    section.innerHTML = `<div style="text-align:center;color:#666;padding:12px;font-size:13px">Analytics unavailable: ${err.message}</div>`;
  }
}

// ===== SUBMIT ALERT =====

async function renderSubmit() {
  return `
    <div class="page-header">
      <h1>Submit Alert</h1>
      <p>Report a suspected exploit or malicious address</p>
    </div>

    <div style="max-width:640px">
      <div class="card">
        <div class="form-group">
          <label class="form-label">Reporter</label>
          <select class="form-select" id="submit-reporter">
            ${REPORTERS.map(r => `<option value="${r.id}">${r.handle} (${accuracy(r)}% accuracy)</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Flagged Address</label>
          <input class="form-input mono" id="submit-address" placeholder="0x..." />
        </div>

        <div class="form-group">
          <label class="form-label">Chain</label>
          <select class="form-select" id="submit-chain">
            ${CHAINS.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Evidence URL</label>
          <input class="form-input" id="submit-evidence" placeholder="https://etherscan.io/tx/..." />
        </div>

        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-textarea" id="submit-desc" placeholder="Describe the threat — what you observed, how much is at risk, urgency..."></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Severity</label>
          <div class="form-radio-group">
            <div class="radio-option"><input type="radio" name="severity" id="sev-critical" value="critical"><label for="sev-critical">Critical</label></div>
            <div class="radio-option"><input type="radio" name="severity" id="sev-high" value="high" checked><label for="sev-high">High</label></div>
            <div class="radio-option"><input type="radio" name="severity" id="sev-medium" value="medium"><label for="sev-medium">Medium</label></div>
            <div class="radio-option"><input type="radio" name="severity" id="sev-low" value="low"><label for="sev-low">Low</label></div>
          </div>
        </div>

        <button class="btn btn-danger" id="submit-btn" style="width:100%;margin-top:8px">
          \u26A0 Submit Alert &amp; Broadcast
        </button>

        <div id="dispatch-area"></div>
      </div>
    </div>
  `;
}

function initSubmit() {
  document.getElementById('submit-btn')?.addEventListener('click', async () => {
    const address = document.getElementById('submit-address').value.trim();
    const chain = document.getElementById('submit-chain').value;
    const evidenceUrl = document.getElementById('submit-evidence').value.trim();
    const description = document.getElementById('submit-desc').value.trim();
    const severity = document.querySelector('input[name="severity"]:checked')?.value || 'high';
    const reporterId = document.getElementById('submit-reporter').value;

    if (!address || !description) { toast('Address and description required', 'error'); return; }

    const area = document.getElementById('dispatch-area');
    area.innerHTML = '<div class="dispatch-log" id="dispatch-log"><div class="dispatch-item"><span class="dispatch-pending">\u25CF</span> Submitting alert and dispatching webhooks...</div></div>';

    const result = await db.createAlert({ reporterId, address, chain, evidenceUrl: evidenceUrl, description, severity });
    const log = document.getElementById('dispatch-log');

    if (result.success) {
      log.innerHTML = '<div class="dispatch-item"><span class="dispatch-check">\u2713</span> Alert saved to database</div>';
      log.innerHTML += '<div class="dispatch-item"><span class="dispatch-check">\u2713</span> Address enrichment attached</div>';

      // Show real webhook delivery results from the server
      if (result.webhooks && result.webhooks.length > 0) {
        result.webhooks.forEach(wh => {
          const icon = wh.status === 'delivered' ? '\u2713' : '\u2717';
          const cls = wh.status === 'delivered' ? 'dispatch-check' : '';
          log.innerHTML += `<div class="dispatch-item"><span class="${cls}">${icon}</span> ${wh.type}: ${wh.status}${wh.error ? ' — ' + wh.error : ''}</div>`;
        });
      } else {
        log.innerHTML += '<div class="dispatch-item" style="color:var(--text-muted)">No webhooks configured. Add channels in Settings.</div>';
      }

      log.innerHTML += '<div class="dispatch-item" style="color:var(--accent-green);font-weight:600">\u2713 Alert broadcast complete.</div>';
      toast('Alert submitted', 'success');

      setTimeout(() => { window.location.hash = '#/alert/' + result.id; }, 1500);
    } else {
      log.innerHTML = '<div class="dispatch-item" style="color:var(--accent-red)">\u2717 Failed: ' + (result.error || 'Unknown error') + '</div>';
      toast('Alert submission failed', 'error');
    }
  });
}

// ===== ALERT DETAIL =====

async function renderAlertDetail(id) {
  const alert = await db.getAlert(id);
  if (!alert) return '<div class="empty-state"><h3>Alert not found</h3></div>';

  const reporter = getReporter(alert.reporterId || alert.reporter_id);
  const decisions = alert.decisions || await db.getDecisions(id);
  const myTeam = db.getTeam();
  const myDecision = decisions.find(d => d.teamId === myTeam.id);

  const ackCount = decisions.filter(d => d.action === 'ack').length;
  const pauseCount = decisions.filter(d => d.action === 'pause').length;
  const ignoreCount = decisions.filter(d => d.action === 'ignore').length;
  const pendingCount = TEAMS.length - decisions.length;
  const total = TEAMS.length;

  const fullAudit = await db.getAuditLog();
  const auditEntries = fullAudit.filter(e => (e.alertId || e.alert_id) === id).slice(0, 20);

  return `
    <a href="#/dashboard" class="back-link">\u2190 Back to Dashboard</a>

    <div class="page-header" style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <span class="severity-badge ${alert.severity}">${alert.severity}</span>
      <h1 style="font-size:18px;margin-bottom:0">${alert.description}</h1>
    </div>

    <div class="detail-grid">
      <div class="detail-main">
        <!-- Address & Evidence -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Flagged Address</span>
            <span class="chain-tag ${alert.chain.toLowerCase()}">${alert.chain}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
            <span class="address-full">${alert.address}</span>
            <button class="copy-btn" onclick="copyToClipboard('${alert.address}')">copy</button>
          </div>
          ${alert.evidenceUrl ? `<div style="margin-top:8px"><span style="font-size:11px;color:var(--text-muted)">EVIDENCE</span><br><a href="${alert.evidenceUrl}" target="_blank" rel="noreferrer" style="font-size:12px;word-break:break-all">${alert.evidenceUrl}</a></div>` : ''}
        </div>

        <!-- Enrichment -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Auto-Enrichment</span>
            <span class="status-pill active">\u2713 Verified</span>
          </div>
          <div class="enrichment-grid">
            <div class="enrich-item"><div class="enrich-label">Amount Stolen</div><div class="enrich-value" style="color:var(--accent-red)">${alert.amount || 'Unknown'}</div></div>
            <div class="enrich-item"><div class="enrich-label">Transactions</div><div class="enrich-value">${alert.enrichment.txCount || 'N/A'}</div></div>
            <div class="enrich-item"><div class="enrich-label">Token Holdings</div><div class="enrich-value">${alert.enrichment.tokenHoldings} tokens</div></div>
            <div class="enrich-item"><div class="enrich-label">Funding Source</div><div class="enrich-value" style="color:${alert.enrichment.fundingSource === 'Tornado Cash' ? 'var(--accent-red)' : 'var(--text-primary)'}">${alert.enrichment.fundingSource}</div></div>
            <div class="enrich-item"><div class="enrich-label">Attack Type</div><div class="enrich-value">${alert.attack_type || alert.attackType || 'Unknown'}</div></div>
            <div class="enrich-item"><div class="enrich-label">Attribution</div><div class="enrich-value" style="color:${(alert.attribution||'').includes('DPRK') || (alert.attribution||'').includes('Lazarus') ? 'var(--accent-red)' : 'var(--text-primary)'}">${alert.attribution || 'Unknown'}</div></div>
            <div class="enrich-item" style="grid-column:span 2"><div class="enrich-label">Risk Flags</div><div class="enrich-value" style="color:${alert.enrichment.riskFlags[0] === 'None detected' ? 'var(--accent-green)' : 'var(--accent-red)'}">${alert.enrichment.riskFlags.join(', ')}</div></div>
          </div>
        </div>

        <!-- Decision Protocol -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Decision Protocol</span>
            <span style="font-size:11px;color:var(--text-muted)">${decisions.length}/${total} teams responded</span>
          </div>

          <div class="consensus-bar">
            <div class="segment ack" style="width:${(ackCount / total) * 100}%"></div>
            <div class="segment pause" style="width:${(pauseCount / total) * 100}%"></div>
            <div class="segment ignore" style="width:${(ignoreCount / total) * 100}%"></div>
          </div>

          <div class="consensus-legend">
            <span><div class="legend-dot ack"></div> Acknowledge (${ackCount})</span>
            <span><div class="legend-dot pause"></div> Pause (${pauseCount})</span>
            <span><div class="legend-dot ignore"></div> Ignore (${ignoreCount})</span>
            <span><div class="legend-dot pending"></div> Pending (${pendingCount})</span>
          </div>

          <div class="team-decisions">
            ${TEAMS.map(team => {
              const d = decisions.find(dd => dd.teamId === team.id);
              const isMe = team.id === myTeam.id;
              return `
                <div class="team-row" ${isMe ? 'style="border:1px solid var(--accent-blue)"' : ''}>
                  <div>
                    <div class="team-name">${team.name} ${isMe ? '<span style="font-size:10px;color:var(--accent-blue)">(you)</span>' : ''}</div>
                    <div style="font-size:10px;color:var(--text-muted)">${team.type}${d ? ' \u2022 ' + timeAgo(d.decidedAt) : ''}</div>
                  </div>
                  <div class="team-action ${d ? d.action : 'pending'}">${d ? d.action.toUpperCase() : 'PENDING'}</div>
                </div>
              `;
            }).join('')}
          </div>

          ${!myDecision ? `
          <div class="decision-buttons">
            <button class="btn btn-success" onclick="submitTeamDecision('${id}', 'ack')">\u2713 Acknowledge</button>
            <button class="btn btn-warning" onclick="submitTeamDecision('${id}', 'pause')">\u23F8 Pause Operations</button>
            <button class="btn btn-ghost" onclick="submitTeamDecision('${id}', 'ignore')">Ignore</button>
          </div>
          ` : '<div style="margin-top:12px;font-size:11px;color:var(--text-muted)">Your team has responded: ' + myDecision.action.toUpperCase() + '</div>'}
        </div>
      </div>

      <div class="detail-sidebar">
        <!-- Reporter -->
        <div class="card" style="cursor:pointer" onclick="window.location.hash='#/reporter/${reporter.id}'">
          <div class="card-title" style="margin-bottom:12px">REPORTED BY</div>
          <div class="reporter-header">
            <div class="reporter-avatar" style="background:${reporter.color}">${reporter.handle.slice(0, 2).toUpperCase()}</div>
            <div>
              <div class="reporter-handle">${reporter.handle} <span class="verified-badge">\u2713 Verified</span></div>
              <div class="reporter-role">${reporter.role}</div>
            </div>
          </div>
          <div class="reporter-stats">
            <div class="reporter-stat">
              <div class="reporter-stat-value green">${accuracy(reporter)}%</div>
              <div class="reporter-stat-label">Accuracy</div>
            </div>
            <div class="reporter-stat">
              <div class="reporter-stat-value">${reporter.totalAlerts}</div>
              <div class="reporter-stat-label">Alerts</div>
            </div>
            <div class="reporter-stat">
              <div class="reporter-stat-value" style="color:var(--accent-red)">${reporter.falsePositives}</div>
              <div class="reporter-stat-label">False +</div>
            </div>
          </div>
        </div>

        <!-- Timeline -->
        <div class="card">
          <div class="card-title" style="margin-bottom:12px">TIMELINE</div>
          <div class="timeline">
            ${auditEntries.map(entry => {
              const dotClass = entry.type === 'alert_created' ? 'alert' : entry.type === 'decision_made' ? 'decision' : entry.type === 'enrichment_done' ? 'enrich' : 'webhook';
              const icon = entry.type === 'alert_created' ? '\u26A0' : entry.type === 'decision_made' ? '\u2713' : entry.type === 'enrichment_done' ? '\u2139' : '\u2192';
              return `
                <div class="timeline-item">
                  <div class="timeline-dot ${dotClass}">${icon}</div>
                  <div class="timeline-content">
                    <div class="timeline-text"><strong>${entry.actor}</strong> ${entry.details}</div>
                    <div class="timeline-time">${timeAgo(entry.timestamp)}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function initAlertDetail() {}

window.submitTeamDecision = async function(alertId, action) {
  const team = db.getTeam();
  await db.submitDecision(alertId, team.id, action);
  toast(`Decision recorded: ${action.toUpperCase()}`, 'success');
  route();
};

// ===== REPORTERS =====

async function renderReporters() {
  return `
    <div class="page-header">
      <h1>Verified Reporters</h1>
      <p>Trusted security researchers with verified track records</p>
    </div>

    <div class="reporter-grid">
      ${REPORTERS.map(r => `
        <div class="reporter-card" onclick="window.location.hash='#/reporter/${r.id}'">
          <div class="reporter-header">
            <div class="reporter-avatar" style="background:${r.color}">${r.handle.slice(0, 2).toUpperCase()}</div>
            <div>
              <div class="reporter-handle">${r.handle} <span class="verified-badge">\u2713 Verified</span></div>
              <div class="reporter-role">${r.role}</div>
            </div>
          </div>
          <div class="reporter-stats">
            <div class="reporter-stat">
              <div class="reporter-stat-value green">${accuracy(r)}%</div>
              <div class="reporter-stat-label">Accuracy</div>
            </div>
            <div class="reporter-stat">
              <div class="reporter-stat-value">${r.totalAlerts}</div>
              <div class="reporter-stat-label">Alerts</div>
            </div>
            <div class="reporter-stat">
              <div class="reporter-stat-value" style="color:var(--accent-red)">${r.falsePositives}</div>
              <div class="reporter-stat-label">False +</div>
            </div>
          </div>
          <div style="margin-top:12px;font-size:10px;color:var(--text-muted)">Joined ${new Date(r.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
        </div>
      `).join('')}
    </div>
  `;
}

async function renderReporterDetail(id) {
  const r = REPORTERS.find(rr => rr.id === id);
  if (!r) return '<div class="empty-state"><h3>Reporter not found</h3></div>';

  const allAlerts = await db.getAlerts();
  const alerts = allAlerts.filter(a => (a.reporterId || a.reporter_id) === id);

  return `
    <a href="#/reporters" class="back-link">\u2190 Back to Reporters</a>

    <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
      <div class="reporter-avatar" style="background:${r.color};width:56px;height:56px;font-size:20px;border-radius:14px">${r.handle.slice(0, 2).toUpperCase()}</div>
      <div>
        <h1 style="font-size:22px;margin-bottom:2px">${r.handle} <span class="verified-badge">\u2713 Verified</span></h1>
        <p style="color:var(--text-muted);font-size:13px">${r.role} \u2022 Joined ${new Date(r.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
      </div>
    </div>

    <div class="stat-row" style="margin-bottom:24px">
      <div class="stat-card"><div class="stat-label">Accuracy</div><div class="stat-value green">${accuracy(r)}%</div></div>
      <div class="stat-card"><div class="stat-label">Total Alerts</div><div class="stat-value">${r.totalAlerts}</div></div>
      <div class="stat-card"><div class="stat-label">Confirmed</div><div class="stat-value green">${r.confirmedAlerts}</div></div>
      <div class="stat-card"><div class="stat-label">False Positives</div><div class="stat-value red">${r.falsePositives}</div></div>
    </div>

    <div class="section-divider"><span>Recent Alerts by ${r.handle}</span></div>

    <div class="alert-list">
      ${alerts.length ? renderAlertList(alerts) : '<div class="empty-state"><p>No alerts in demo data for this reporter</p></div>'}
    </div>
  `;
}

// ===== AUDIT LOG =====

async function renderAudit() {
  const log = await db.getAuditLog();

  return `
    <div class="page-header">
      <h1>Audit Log</h1>
      <p>Complete record of all alerts, decisions, and system events</p>
    </div>

    <div class="filter-bar">
      <input class="form-input" id="audit-search" type="search" placeholder="Search events..." style="min-width:240px" />
      <select class="form-select" id="audit-type">
        <option value="">All Events</option>
        <option value="alert_created">Alert Created</option>
        <option value="decision_made">Decision Made</option>
        <option value="enrichment_done">Enrichment</option>
        <option value="webhook_sent">Webhook Sent</option>
      </select>
      <button class="btn btn-ghost btn-sm" onclick="exportAuditCSV()">Export CSV</button>
    </div>

    <div class="card" style="padding:0;overflow:hidden">
      <table class="data-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Event</th>
            <th>Actor</th>
            <th>Alert</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody id="audit-tbody">
          ${renderAuditRows(log)}
        </tbody>
      </table>
    </div>
  `;
}

function renderAuditRows(log) {
  return log.slice(0, 100).map(entry => {
    const typeLabels = { alert_created: 'ALERT', decision_made: 'DECISION', enrichment_done: 'ENRICHMENT', webhook_sent: 'WEBHOOK', config_updated: 'CONFIG' };
    return `
      <tr>
        <td class="mono">${new Date(entry.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
        <td><span class="event-tag ${entry.type}">${typeLabels[entry.type] || entry.type}</span></td>
        <td>${entry.actor}</td>
        <td>${entry.alertId ? `<a href="#/alert/${entry.alertId}" class="mono">${entry.alertId}</a>` : '\u2014'}</td>
        <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${entry.details}</td>
      </tr>
    `;
  }).join('');
}

function initAudit() {
  const applyFilters = async () => {
    const filters = {
      search: document.getElementById('audit-search')?.value || '',
      type: document.getElementById('audit-type')?.value || '',
    };
    const log = await db.getAuditLog(filters);
    const tbody = document.getElementById('audit-tbody');
    if (tbody) tbody.innerHTML = renderAuditRows(log);
  };

  document.getElementById('audit-search')?.addEventListener('input', applyFilters);
  document.getElementById('audit-type')?.addEventListener('change', applyFilters);
}

window.exportAuditCSV = function() {
  const log = db.getAuditLog();
  const csv = 'timestamp,type,actor,alertId,details\n' + log.map(e =>
    `"${new Date(e.timestamp).toISOString()}","${e.type}","${e.actor}","${e.alertId || ''}","${e.details.replace(/"/g, '""')}"`
  ).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chain911-audit-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Audit log exported', 'success');
};

// ===== SETTINGS =====

async function renderSettings() {
  const team = db.getTeam();
  const webhooks = await db.getWebhooks();

  return `
    <div class="page-header">
      <h1>Team Settings</h1>
      <p>Configure your team identity and notification channels</p>
    </div>

    <div style="max-width:640px">
      <div class="card" style="margin-bottom:16px">
        <div class="card-title" style="margin-bottom:12px">TEAM IDENTITY</div>
        <div class="form-group">
          <label class="form-label">Team Name</label>
          <input class="form-input" id="team-name" value="${team.name || ''}" />
        </div>
        <div style="font-size:11px;color:var(--text-muted)">Your team name appears in decision protocol responses visible to other teams.</div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">WEBHOOK CHANNELS</span>
          <span style="font-size:11px;color:var(--text-muted)">${webhooks.filter(w => w.enabled).length} active</span>
        </div>

        ${webhooks.length === 0 ? '<div style="padding:16px 0;color:var(--text-muted);font-size:12px">No webhooks configured. Add one below to receive real-time alerts.</div>' : ''}
        ${webhooks.map(wh => `
          <div class="webhook-row">
            <span class="webhook-type">${wh.type}</span>
            <span class="webhook-url">${wh.url}</span>
            <button class="toggle ${wh.enabled ? 'on' : ''}" onclick="toggleWebhook('${wh.id}')"></button>
            <button class="btn btn-ghost btn-sm" onclick="testWebhookReal('${wh.id}')">Test</button>
            <button class="btn btn-danger btn-sm" onclick="deleteWebhook('${wh.id}')">x</button>
          </div>
        `).join('')}

        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
          <div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:8px">ADD NEW CHANNEL</div>
          <div style="display:flex;gap:8px;align-items:center">
            <select class="form-select" id="new-wh-type" style="width:120px">
              <option value="Slack">Slack</option>
              <option value="Telegram">Telegram</option>
              <option value="PagerDuty">PagerDuty</option>
              <option value="Generic">Generic</option>
            </select>
            <input class="form-input mono" id="new-wh-url" placeholder="Webhook URL" style="flex:1" />
            <button class="btn btn-primary btn-sm" onclick="addWebhook()">Add</button>
          </div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:6px">
            Slack: Incoming Webhook URL | Telegram: Bot API sendMessage endpoint | PagerDuty: Events API v2 URL
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:16px">
        <div class="card-title" style="margin-bottom:12px">NOTIFICATION RULES</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div class="webhook-row">
            <span style="font-size:12px;flex:1">Critical alerts</span>
            <span style="font-size:11px;color:var(--accent-green)">All channels</span>
          </div>
          <div class="webhook-row">
            <span style="font-size:12px;flex:1">High alerts</span>
            <span style="font-size:11px;color:var(--accent-green)">All channels</span>
          </div>
          <div class="webhook-row">
            <span style="font-size:12px;flex:1">Medium alerts</span>
            <span style="font-size:11px;color:var(--accent-amber)">Slack + Email only</span>
          </div>
          <div class="webhook-row">
            <span style="font-size:12px;flex:1">Low alerts</span>
            <span style="font-size:11px;color:var(--text-muted)">Email digest only</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function initSettings() {}

window.toggleWebhook = async function(id) {
  await db.toggleWebhook(id);
  toast('Webhook updated', 'success');
  route();
};

window.testWebhookReal = async function(id) {
  toast('Sending test...', 'info');
  try {
    const res = await fetch('/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'test', id })
    });
    const result = await res.json();
    if (result.status === 'delivered') {
      toast(`Test delivered to ${result.type}`, 'success');
    } else {
      toast(`Test failed: ${result.error || 'Unknown error'}`, 'error');
    }
  } catch (e) { toast('Test failed: ' + e.message, 'error'); }
};

window.addWebhook = async function() {
  const type = document.getElementById('new-wh-type').value;
  const url = document.getElementById('new-wh-url').value.trim();
  if (!url) { toast('URL required', 'error'); return; }
  try {
    await fetch('/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', type, url })
    });
    toast(`${type} webhook added`, 'success');
    route();
  } catch (e) { toast('Failed: ' + e.message, 'error'); }
};

window.deleteWebhook = async function(id) {
  try {
    await fetch('/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id })
    });
    toast('Webhook deleted', 'success');
    route();
  } catch (e) { toast('Failed: ' + e.message, 'error'); }
};

// ===== UTC CLOCK =====

function updateClock() {
  const el = document.getElementById('utc-clock');
  if (el) {
    const now = new Date();
    el.textContent = 'UTC ' + now.toISOString().slice(11, 19);
  }
}

setInterval(updateClock, 1000);
updateClock();

// ===== LIVE POLLING =====
// Poll for new alerts every 30 seconds
let lastAlertCount = 0;
let notificationsEnabled = false;

// Request browser notification permission
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission().then(p => { notificationsEnabled = p === 'granted'; });
} else if ('Notification' in window) {
  notificationsEnabled = Notification.permission === 'granted';
}

async function pollForAlerts() {
  try {
    const alerts = await db.getAlerts();
    if (lastAlertCount > 0 && alerts.length > lastAlertCount) {
      const newCount = alerts.length - lastAlertCount;
      const newest = alerts[0];
      const badge = document.getElementById('alert-badge');
      if (badge) { badge.style.display = 'inline'; badge.textContent = newCount; }
      toast(`${newCount} new alert(s) received`, newest?.severity === 'critical' ? 'error' : 'info');

      // Browser notification for critical/high alerts
      if (notificationsEnabled && newest && (newest.severity === 'critical' || newest.severity === 'high')) {
        new Notification('chain911 ' + newest.severity.toUpperCase() + ' Alert', {
          body: newest.description?.slice(0, 120),
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">%F0%9F%9A%A8</text></svg>',
          tag: 'chain911-' + newest.id,
        });
      }

      // Auto-refresh dashboard
      if (window.location.hash.includes('dashboard')) {
        const list = document.getElementById('alert-list');
        if (list) {
          list.innerHTML = renderAlertList(alerts);
          const firstCard = list.querySelector('.alert-card');
          if (firstCard) firstCard.classList.add('new-alert');
        }
      }
    }
    lastAlertCount = alerts.length;
  } catch (e) { /* silently retry */ }
}

setInterval(pollForAlerts, 15000); // Poll every 15s

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
  if (e.key === 'n') window.location.hash = '#/submit';
  if (e.key === 'd') window.location.hash = '#/dashboard';
  if (e.key === 'r') window.location.hash = '#/reporters';
  if (e.key === 'a') window.location.hash = '#/audit';
  if (e.key === 's') window.location.hash = '#/settings';
});

// ===== INIT =====

route();
