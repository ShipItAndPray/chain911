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

// ===== DATA SERVICE =====

class DataService {
  constructor() {
    if (!localStorage.getItem('chain911_seeded')) {
      this.seed();
      localStorage.setItem('chain911_seeded', 'true');
    }
  }

  _get(key) { return JSON.parse(localStorage.getItem(key) || '[]'); }
  _set(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

  seed() {
    const now = Date.now();
    const alerts = [];
    const auditLog = [];
    const decisions = [];
    const severities = ['critical', 'high', 'high', 'medium', 'medium', 'medium', 'low'];

    for (let i = 0; i < 18; i++) {
      const reporter = REPORTERS[Math.floor(Math.random() * REPORTERS.length)];
      const chain = CHAINS[Math.floor(Math.random() * CHAINS.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const createdAt = now - (i * 3600000 * (1 + Math.random() * 2));
      const addr = randomAddr();
      const id = 'a' + (1000 + i);

      alerts.push({
        id,
        reporterId: reporter.id,
        address: addr,
        chain,
        evidenceUrl: `https://etherscan.io/address/${addr}`,
        description: generateDescription(),
        severity,
        status: i < 3 ? 'active' : i < 8 ? 'investigating' : 'resolved',
        enrichment: generateEnrichment(chain),
        createdAt,
      });

      auditLog.push({
        id: 'au' + (2000 + i * 3),
        type: 'alert_created',
        alertId: id,
        actor: reporter.handle,
        details: `Alert submitted: ${severity.toUpperCase()} on ${chain}`,
        timestamp: createdAt,
      });

      auditLog.push({
        id: 'au' + (2001 + i * 3),
        type: 'enrichment_done',
        alertId: id,
        actor: 'system',
        details: `Auto-enrichment complete for ${addr.slice(0, 10)}...`,
        timestamp: createdAt + 5000,
      });

      auditLog.push({
        id: 'au' + (2002 + i * 3),
        type: 'webhook_sent',
        alertId: id,
        actor: 'system',
        details: `Dispatched to ${Math.floor(Math.random() * 3) + 3} channels`,
        timestamp: createdAt + 8000,
      });

      // Generate decisions for older alerts
      if (i >= 2) {
        const actions = ['ack', 'pause', 'ignore'];
        TEAMS.forEach((team, ti) => {
          if (Math.random() > 0.25) {
            const action = i < 5 ? (Math.random() > 0.3 ? 'pause' : 'ack') : actions[Math.floor(Math.random() * actions.length)];
            decisions.push({
              id: `d${id}_${team.id}`,
              alertId: id,
              teamId: team.id,
              teamName: team.name,
              action,
              reason: '',
              decidedAt: createdAt + (ti + 1) * 120000 + Math.random() * 300000,
            });

            auditLog.push({
              id: `au_d_${id}_${team.id}`,
              type: 'decision_made',
              alertId: id,
              actor: team.name,
              details: `${action.toUpperCase()} — ${team.name}`,
              timestamp: createdAt + (ti + 1) * 120000 + Math.random() * 300000,
            });
          }
        });
      }
    }

    alerts.sort((a, b) => b.createdAt - a.createdAt);
    auditLog.sort((a, b) => b.timestamp - a.timestamp);

    this._set('chain911_alerts', alerts);
    this._set('chain911_audit', auditLog);
    this._set('chain911_decisions', decisions);
    this._set('chain911_webhooks', [
      { id: 'w1', type: 'Slack', url: 'https://hooks.slack.com/services/T0XXX/B0XXX/xxxx', enabled: true },
      { id: 'w2', type: 'Telegram', url: 'https://api.telegram.org/botXXX/sendMessage', enabled: true },
      { id: 'w3', type: 'PagerDuty', url: 'https://events.pagerduty.com/v2/enqueue', enabled: true },
      { id: 'w4', type: 'Email', url: 'security-ops [at] protocol.xyz', enabled: false },
    ]);
    this._set('chain911_team', { id: 't3', name: 'SwapKit' });
  }

  getAlerts(filters = {}) {
    let alerts = this._get('chain911_alerts');
    if (filters.chain) alerts = alerts.filter(a => a.chain === filters.chain);
    if (filters.severity) alerts = alerts.filter(a => a.severity === filters.severity);
    if (filters.status) alerts = alerts.filter(a => a.status === filters.status);
    if (filters.search) {
      const s = filters.search.toLowerCase();
      alerts = alerts.filter(a => a.address.toLowerCase().includes(s) || a.description.toLowerCase().includes(s));
    }
    return alerts;
  }

  getAlert(id) { return this._get('chain911_alerts').find(a => a.id === id); }

  createAlert(data) {
    const alerts = this._get('chain911_alerts');
    const reporter = REPORTERS.find(r => r.id === data.reporterId);
    const id = 'a' + Date.now();
    const alert = {
      id,
      ...data,
      enrichment: generateEnrichment(data.chain),
      status: 'active',
      createdAt: Date.now(),
    };
    alerts.unshift(alert);
    this._set('chain911_alerts', alerts);

    this.addAuditEntry('alert_created', id, reporter?.handle || 'Unknown', `Alert submitted: ${data.severity.toUpperCase()} on ${data.chain}`);
    this.addAuditEntry('enrichment_done', id, 'system', `Auto-enrichment complete for ${data.address.slice(0, 10)}...`);
    this.addAuditEntry('webhook_sent', id, 'system', 'Dispatched to 3 channels');

    return alert;
  }

  getDecisions(alertId) {
    return this._get('chain911_decisions').filter(d => d.alertId === alertId);
  }

  submitDecision(alertId, teamId, action) {
    const decisions = this._get('chain911_decisions');
    const team = TEAMS.find(t => t.id === teamId);
    const existing = decisions.findIndex(d => d.alertId === alertId && d.teamId === teamId);

    const decision = {
      id: `d${alertId}_${teamId}`,
      alertId,
      teamId,
      teamName: team?.name || 'Unknown',
      action,
      reason: '',
      decidedAt: Date.now(),
    };

    if (existing >= 0) decisions[existing] = decision;
    else decisions.push(decision);

    this._set('chain911_decisions', decisions);
    this.addAuditEntry('decision_made', alertId, team?.name || 'Unknown', `${action.toUpperCase()} — ${team?.name}`);
    return decision;
  }

  getAuditLog(filters = {}) {
    let log = this._get('chain911_audit');
    if (filters.type) log = log.filter(e => e.type === filters.type);
    if (filters.search) {
      const s = filters.search.toLowerCase();
      log = log.filter(e => e.details.toLowerCase().includes(s) || e.actor.toLowerCase().includes(s));
    }
    return log.sort((a, b) => b.timestamp - a.timestamp);
  }

  addAuditEntry(type, alertId, actor, details) {
    const log = this._get('chain911_audit');
    log.unshift({
      id: 'au' + Date.now() + Math.random().toString(36).slice(2, 6),
      type,
      alertId,
      actor,
      details,
      timestamp: Date.now(),
    });
    this._set('chain911_audit', log);
  }

  getWebhooks() { return this._get('chain911_webhooks'); }

  toggleWebhook(id) {
    const wh = this._get('chain911_webhooks');
    const hook = wh.find(w => w.id === id);
    if (hook) { hook.enabled = !hook.enabled; this._set('chain911_webhooks', wh); }
  }

  getTeam() { return JSON.parse(localStorage.getItem('chain911_team') || '{}'); }
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

function route() {
  const hash = window.location.hash || '#/dashboard';
  const [path, param] = hash.slice(2).split('/');

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.route === path);
  });

  const app = document.getElementById('app');

  switch (path) {
    case 'dashboard': app.innerHTML = renderDashboard(); initDashboard(); break;
    case 'submit': app.innerHTML = renderSubmit(); initSubmit(); break;
    case 'alert': app.innerHTML = renderAlertDetail(param); initAlertDetail(param); break;
    case 'reporters': app.innerHTML = renderReporters(); break;
    case 'reporter': app.innerHTML = renderReporterDetail(param); break;
    case 'audit': app.innerHTML = renderAudit(); initAudit(); break;
    case 'settings': app.innerHTML = renderSettings(); initSettings(); break;
    default: app.innerHTML = renderDashboard(); initDashboard();
  }
}

window.addEventListener('hashchange', route);

// ===== DASHBOARD =====

function renderDashboard() {
  const alerts = db.getAlerts();
  const active = alerts.filter(a => a.status === 'active').length;
  const last24h = alerts.filter(a => Date.now() - a.createdAt < 86400000).length;
  const decisions = db.getAuditLog({ type: 'decision_made' });
  const avgResponseMs = decisions.length > 0 ? decisions.reduce((sum, d) => {
    const alert = db.getAlert(d.alertId);
    return sum + (alert ? d.timestamp - alert.createdAt : 300000);
  }, 0) / decisions.length : 0;
  const avgMin = Math.round(avgResponseMs / 60000);

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
    const decisions = db.getDecisions(a.id);
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
  const applyFilters = () => {
    const filters = {
      search: document.getElementById('dash-search')?.value || '',
      chain: document.getElementById('dash-chain')?.value || '',
      severity: document.getElementById('dash-severity')?.value || '',
      status: document.getElementById('dash-status')?.value || '',
    };
    const alerts = db.getAlerts(filters);
    const list = document.getElementById('alert-list');
    if (list) list.innerHTML = renderAlertList(alerts);
  };

  ['dash-search', 'dash-chain', 'dash-severity', 'dash-status'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(id === 'dash-search' ? 'input' : 'change', applyFilters);
  });
}

// ===== SUBMIT ALERT =====

function renderSubmit() {
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
  document.getElementById('submit-btn')?.addEventListener('click', () => {
    const address = document.getElementById('submit-address').value.trim();
    const chain = document.getElementById('submit-chain').value;
    const evidenceUrl = document.getElementById('submit-evidence').value.trim();
    const description = document.getElementById('submit-desc').value.trim();
    const severity = document.querySelector('input[name="severity"]:checked')?.value || 'high';
    const reporterId = document.getElementById('submit-reporter').value;

    if (!address || !description) { toast('Address and description required', 'error'); return; }

    const alert = db.createAlert({ reporterId, address, chain, evidenceUrl, description, severity });

    // Dispatch animation
    const area = document.getElementById('dispatch-area');
    area.innerHTML = '<div class="dispatch-log" id="dispatch-log"></div>';
    const log = document.getElementById('dispatch-log');
    const webhooks = db.getWebhooks().filter(w => w.enabled);

    log.innerHTML = '<div class="dispatch-item"><span class="dispatch-pending">\u25CF</span> Enriching address data...</div>';

    setTimeout(() => {
      log.innerHTML = '<div class="dispatch-item"><span class="dispatch-check">\u2713</span> Enrichment complete — flagged address data attached</div>';

      webhooks.forEach((wh, i) => {
        setTimeout(() => {
          log.innerHTML += `<div class="dispatch-item"><span class="dispatch-check">\u2713</span> ${wh.type} — delivered</div>`;
          if (i === webhooks.length - 1) {
            setTimeout(() => {
              log.innerHTML += `<div class="dispatch-item" style="color:var(--accent-green);font-weight:600">\u2713 Alert broadcast to ${webhooks.length} channels. All teams notified.</div>`;
              toast('Alert submitted and broadcast', 'success');
              setTimeout(() => { window.location.hash = '#/alert/' + alert.id; }, 1500);
            }, 600);
          }
        }, 500 * (i + 1));
      });
    }, 800);
  });
}

// ===== ALERT DETAIL =====

function renderAlertDetail(id) {
  const alert = db.getAlert(id);
  if (!alert) return '<div class="empty-state"><h3>Alert not found</h3></div>';

  const reporter = getReporter(alert.reporterId);
  const decisions = db.getDecisions(id);
  const myTeam = db.getTeam();
  const myDecision = decisions.find(d => d.teamId === myTeam.id);

  const ackCount = decisions.filter(d => d.action === 'ack').length;
  const pauseCount = decisions.filter(d => d.action === 'pause').length;
  const ignoreCount = decisions.filter(d => d.action === 'ignore').length;
  const pendingCount = TEAMS.length - decisions.length;
  const total = TEAMS.length;

  const auditEntries = db.getAuditLog().filter(e => e.alertId === id).slice(0, 20);

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
            <div class="enrich-item"><div class="enrich-label">Balance</div><div class="enrich-value">${alert.enrichment.balance}</div></div>
            <div class="enrich-item"><div class="enrich-label">Transactions</div><div class="enrich-value">${alert.enrichment.txCount}</div></div>
            <div class="enrich-item"><div class="enrich-label">Token Holdings</div><div class="enrich-value">${alert.enrichment.tokenHoldings} tokens</div></div>
            <div class="enrich-item"><div class="enrich-label">Funding Source</div><div class="enrich-value" style="color:${alert.enrichment.fundingSource === 'Tornado Cash' ? 'var(--accent-red)' : 'var(--text-primary)'}">${alert.enrichment.fundingSource}</div></div>
            <div class="enrich-item"><div class="enrich-label">First Activity</div><div class="enrich-value">${new Date(alert.enrichment.firstTx).toLocaleDateString()}</div></div>
            <div class="enrich-item"><div class="enrich-label">Last Activity</div><div class="enrich-value">${timeAgo(new Date(alert.enrichment.lastTx).getTime())}</div></div>
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

window.submitTeamDecision = function(alertId, action) {
  const team = db.getTeam();
  db.submitDecision(alertId, team.id, action);
  toast(`Decision recorded: ${action.toUpperCase()}`, 'success');
  route();
};

// ===== REPORTERS =====

function renderReporters() {
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

function renderReporterDetail(id) {
  const r = REPORTERS.find(rr => rr.id === id);
  if (!r) return '<div class="empty-state"><h3>Reporter not found</h3></div>';

  const alerts = db.getAlerts().filter(a => a.reporterId === id);

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

function renderAudit() {
  const log = db.getAuditLog();

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
  const applyFilters = () => {
    const filters = {
      search: document.getElementById('audit-search')?.value || '',
      type: document.getElementById('audit-type')?.value || '',
    };
    const log = db.getAuditLog(filters);
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

function renderSettings() {
  const team = db.getTeam();
  const webhooks = db.getWebhooks();

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

        ${webhooks.map(wh => `
          <div class="webhook-row">
            <span class="webhook-type">${wh.type}</span>
            <span class="webhook-url">${wh.url}</span>
            <button class="toggle ${wh.enabled ? 'on' : ''}" data-webhook-id="${wh.id}" onclick="toggleWebhook('${wh.id}')"></button>
            <button class="btn btn-ghost btn-sm" onclick="testWebhook('${wh.type}')">Test</button>
          </div>
        `).join('')}

        <div style="margin-top:12px">
          <button class="btn btn-ghost btn-sm">\u002B Add Channel</button>
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

window.toggleWebhook = function(id) {
  db.toggleWebhook(id);
  route();
  toast('Webhook updated', 'success');
};

window.testWebhook = function(type) {
  toast(`Test sent to ${type} — delivered successfully`, 'success');
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

// ===== SIMULATED LIVE ALERTS =====

let alertCounter = 0;

function simulateNewAlert() {
  const reporter = REPORTERS[Math.floor(Math.random() * REPORTERS.length)];
  const chain = CHAINS[Math.floor(Math.random() * CHAINS.length)];
  const severities = ['critical', 'high', 'high', 'medium'];
  const severity = severities[Math.floor(Math.random() * severities.length)];

  db.createAlert({
    reporterId: reporter.id,
    address: randomAddr(),
    chain,
    evidenceUrl: `https://etherscan.io/address/${randomAddr()}`,
    description: generateDescription(),
    severity,
  });

  alertCounter++;
  const badge = document.getElementById('alert-badge');
  if (badge) {
    badge.style.display = 'inline';
    badge.textContent = alertCounter;
  }

  // If on dashboard, refresh alert list
  const list = document.getElementById('alert-list');
  if (list && window.location.hash.includes('dashboard')) {
    const alerts = db.getAlerts();
    list.innerHTML = renderAlertList(alerts);
    const firstCard = list.querySelector('.alert-card');
    if (firstCard) firstCard.classList.add('new-alert');
  }

  toast(`New ${severity.toUpperCase()} alert from ${reporter.handle}`, severity === 'critical' ? 'error' : 'info');
}

// Simulate a new alert every 30-90 seconds
function scheduleNextAlert() {
  const delay = 30000 + Math.random() * 60000;
  setTimeout(() => {
    simulateNewAlert();
    scheduleNextAlert();
  }, delay);
}

// Start simulation after 15 seconds
setTimeout(scheduleNextAlert, 15000);

// ===== INIT =====

route();
