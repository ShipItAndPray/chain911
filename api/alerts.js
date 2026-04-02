const { getDb } = require('./db.js');
const { dispatchAlert } = require('./webhooks.js');
const { protect } = require('./middleware.js');

// Import enrichment functions for async enrichment after alert creation
let enrichEthereum, enrichSolana;
try {
  const enrich = require('./enrich.js');
  enrichEthereum = enrich.enrichEthereum;
  enrichSolana = enrich.enrichSolana;
} catch (_) {
  // Gracefully handle if enrich module not available
  enrichEthereum = null;
  enrichSolana = null;
}

// Fire-and-forget enrichment: fetches real data and updates the alert row
async function asyncEnrich(alertId, address, chain) {
  try {
    const chainUpper = (chain || 'ETH').toUpperCase();
    let enrichment;

    if ((chainUpper === 'SOL' || chainUpper === 'SOLANA') && enrichSolana) {
      enrichment = await enrichSolana(address);
    } else if (enrichEthereum) {
      enrichment = await enrichEthereum(address);
    } else {
      return; // No enrichment functions available
    }

    enrichment.enrichedAt = new Date().toISOString();

    const sql = getDb();
    await sql.query(
      'UPDATE alerts SET enrichment = $1::jsonb WHERE id = $2',
      [JSON.stringify(enrichment), alertId]
    );
  } catch (err) {
    // Enrichment failure should never block alert creation — log and move on
    console.error('Async enrichment failed for alert ' + alertId + ':', err.message);
  }
}

module.exports = protect(async function(req, res) {
  const sql = getDb();

  if (req.method === 'GET') {
    const { chain, severity, status, search } = req.query;

    // Build simple query — neon() supports sql(queryString, paramsArray)
    let where = [];
    let params = [];
    let idx = 1;

    if (chain) { where.push('a.chain = $' + idx++); params.push(chain); }
    if (severity) { where.push('a.severity = $' + idx++); params.push(severity); }
    if (status) { where.push('a.status = $' + idx++); params.push(status); }
    if (search) { where.push('(a.address ILIKE $' + idx + ' OR a.description ILIKE $' + idx + ')'); params.push('%' + search + '%'); idx++; }

    const whereClause = where.length ? ' WHERE ' + where.join(' AND ') : '';
    const query = 'SELECT a.*, r.handle as reporter_handle, r.color as reporter_color, r.total_alerts as reporter_total, r.confirmed_alerts as reporter_confirmed, r.false_positives as reporter_fp FROM alerts a LEFT JOIN reporters r ON a.reporter_id = r.id' + whereClause + ' ORDER BY a.created_at DESC';
    const alerts = params.length ? await sql.query(query, params) : await sql.query(query);

    // Get decisions for each alert
    const decisions = await sql`SELECT * FROM decisions ORDER BY decided_at`;
    const decisionMap = {};
    for (const d of decisions) {
      if (!decisionMap[d.alert_id]) decisionMap[d.alert_id] = [];
      decisionMap[d.alert_id].push(d);
    }

    const result = alerts.map(a => ({
      ...a,
      enrichment: typeof a.enrichment === 'string' ? JSON.parse(a.enrichment) : a.enrichment,
      decisions: decisionMap[a.id] || [],
    }));

    return res.status(200).json(result);
  }

  if (req.method === 'POST') {
    try {
      const { reporter_id, address, chain, evidence_url, description, severity } = req.body;
      if (!address || !description) return res.status(400).json({ error: 'address and description required' });

      const id = 'a' + Date.now();
      const enrichment = JSON.stringify({
        balance: 'Fetching...', txCount: 0, fundingSource: 'Analyzing...',
        riskFlags: ['Pending analysis'], tokenHoldings: 0
      });

      await sql.query(
        'INSERT INTO alerts (id,reporter_id,address,chain,evidence_url,description,severity,enrichment) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb) ON CONFLICT (id) DO NOTHING',
        [id, reporter_id, address, chain, evidence_url, description, severity, enrichment]
      );

      const reporter = await sql`SELECT handle FROM reporters WHERE id=${reporter_id}`;
      const actorName = reporter[0]?.handle || 'Unknown';
      await sql`INSERT INTO audit_log (type,alert_id,actor,details) VALUES ('alert_created',${id},${actorName},${severity.toUpperCase()+' on '+chain})`;
      await sql`INSERT INTO audit_log (type,alert_id,actor,details) VALUES ('enrichment_done',${id},'system','Auto-enrichment started')`;

      // Dispatch to real webhooks
      const webhookResults = await dispatchAlert(sql, {
        id, severity, chain, address, description, amount: null,
        reporter: actorName, evidence_url
      });

      // Fire-and-forget: enrich asynchronously (don't await — response returns immediately)
      asyncEnrich(id, address, chain).catch(() => {});

      return res.status(201).json({ id, success: true, webhooks: webhookResults });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}, { ratePerMinute: 5 });
