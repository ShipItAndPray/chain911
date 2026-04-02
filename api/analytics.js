const { getDb } = require('./db.js');
const { protect } = require('./middleware.js');

function parseAmount(amountStr) {
  if (!amountStr) return 0;
  const cleaned = amountStr.replace(/[^0-9.KMBkmb]/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  const upper = amountStr.toUpperCase();
  if (upper.includes('B')) return num * 1e9;
  if (upper.includes('M')) return num * 1e6;
  if (upper.includes('K')) return num * 1e3;
  return num;
}

function formatUsd(n) {
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K';
  return '$' + n.toFixed(0);
}

module.exports = protect(async function(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sql = getDb();

  // Fetch all alerts
  const alerts = await sql`SELECT id, severity, chain, amount, attack_type, attribution, reporter_id, created_at FROM alerts ORDER BY created_at DESC`;

  // Fetch all decisions
  const decisions = await sql`SELECT alert_id, action, decided_at FROM decisions ORDER BY decided_at`;

  // Fetch reporters
  const reporters = await sql`SELECT id, handle, total_alerts FROM reporters ORDER BY total_alerts DESC`;

  // --- Severity breakdown ---
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const a of alerts) {
    const s = (a.severity || '').toLowerCase();
    if (s in bySeverity) bySeverity[s]++;
  }

  // --- Chain breakdown ---
  const byChain = {};
  for (const a of alerts) {
    const c = (a.chain || 'UNKNOWN').toUpperCase();
    byChain[c] = (byChain[c] || 0) + 1;
  }

  // --- Total stolen ---
  let totalStolen = 0;
  for (const a of alerts) {
    totalStolen += parseAmount(a.amount);
  }

  // --- Avg response time ---
  const alertTimeMap = {};
  for (const a of alerts) {
    alertTimeMap[a.id] = new Date(a.created_at).getTime();
  }
  // Find first decision per alert
  const firstDecision = {};
  for (const d of decisions) {
    const aid = d.alert_id;
    const dt = new Date(d.decided_at).getTime();
    if (!firstDecision[aid] || dt < firstDecision[aid]) {
      firstDecision[aid] = dt;
    }
  }
  let totalResponseMs = 0, responseCount = 0;
  for (const [aid, decTime] of Object.entries(firstDecision)) {
    if (alertTimeMap[aid]) {
      totalResponseMs += decTime - alertTimeMap[aid];
      responseCount++;
    }
  }
  const avgResponseMinutes = responseCount > 0 ? Math.round(totalResponseMs / responseCount / 60000) : 0;

  // --- Top reporters ---
  const reporterAlertCount = {};
  for (const a of alerts) {
    if (a.reporter_id) {
      reporterAlertCount[a.reporter_id] = (reporterAlertCount[a.reporter_id] || 0) + 1;
    }
  }
  const reporterMap = {};
  for (const r of reporters) {
    reporterMap[r.id] = r.handle;
  }
  const topReporters = Object.entries(reporterAlertCount)
    .map(([id, count]) => ({ id, handle: reporterMap[id] || id, alertCount: count }))
    .sort((a, b) => b.alertCount - a.alertCount)
    .slice(0, 10);

  // --- Decision distribution ---
  const decisionDist = { ack: 0, pause: 0, ignore: 0 };
  for (const d of decisions) {
    const action = (d.action || '').toLowerCase();
    if (action in decisionDist) decisionDist[action]++;
    else decisionDist[action] = (decisionDist[action] || 0) + 1;
  }

  // --- Alerts per month ---
  const byMonth = {};
  for (const a of alerts) {
    const d = new Date(a.created_at);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    byMonth[key] = (byMonth[key] || 0) + 1;
  }
  const alertsPerMonth = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  // --- Cross-alert correlations ---

  // Attribution clusters
  const byAttribution = {};
  for (const a of alerts) {
    const attr = (a.attribution || '').trim();
    if (attr && attr.toLowerCase() !== 'unknown' && attr !== '') {
      if (!byAttribution[attr]) byAttribution[attr] = [];
      byAttribution[attr].push(a.id);
    }
  }
  const attributionClusters = Object.entries(byAttribution)
    .filter(([, ids]) => ids.length >= 1)
    .map(([attribution, ids]) => ({ attribution, alertCount: ids.length, alertIds: ids }))
    .sort((a, b) => b.alertCount - a.alertCount);

  // Chain concentration
  const chainConcentration = Object.entries(byChain)
    .map(([chain, count]) => ({ chain, count, pct: alerts.length > 0 ? Math.round(count / alerts.length * 100) : 0 }))
    .sort((a, b) => b.count - a.count);

  // Attack type patterns
  const byAttackType = {};
  for (const a of alerts) {
    const at = (a.attack_type || '').trim();
    if (at) {
      if (!byAttackType[at]) byAttackType[at] = [];
      byAttackType[at].push(a.id);
    }
  }
  const attackTypePatterns = Object.entries(byAttackType)
    .filter(([, ids]) => ids.length >= 1)
    .map(([attackType, ids]) => ({ attackType, alertCount: ids.length, alertIds: ids }))
    .sort((a, b) => b.alertCount - a.alertCount);

  return res.status(200).json({
    totalAlerts: alerts.length,
    bySeverity,
    byChain,
    totalStolen,
    totalStolenFormatted: formatUsd(totalStolen),
    avgResponseMinutes,
    topReporters,
    decisionDistribution: decisionDist,
    alertsPerMonth,
    correlations: {
      attributionClusters,
      chainConcentration,
      attackTypePatterns,
    },
  });
}, { ratePerMinute: 30 });
