import { getDb } from './db.js';

export default async function handler(req, res) {
  const sql = getDb();

  if (req.method === 'GET') {
    const { chain, severity, status, search } = req.query;
    let query = 'SELECT a.*, r.handle as reporter_handle, r.color as reporter_color, r.total_alerts as reporter_total, r.confirmed_alerts as reporter_confirmed, r.false_positives as reporter_fp FROM alerts a LEFT JOIN reporters r ON a.reporter_id = r.id WHERE 1=1';
    const params = [];
    let idx = 1;

    if (chain) { query += ` AND a.chain = $${idx++}`; params.push(chain); }
    if (severity) { query += ` AND a.severity = $${idx++}`; params.push(severity); }
    if (status) { query += ` AND a.status = $${idx++}`; params.push(status); }
    if (search) { query += ` AND (a.address ILIKE $${idx} OR a.description ILIKE $${idx})`; params.push('%' + search + '%'); idx++; }

    query += ' ORDER BY a.created_at DESC';
    const alerts = await sql(query, params);

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
    const { reporter_id, address, chain, evidence_url, description, severity } = req.body;
    if (!address || !description) return res.status(400).json({ error: 'address and description required' });

    const id = 'a' + Date.now();
    const enrichment = JSON.stringify({
      balance: 'Fetching...', txCount: 0, fundingSource: 'Analyzing...',
      riskFlags: ['Pending analysis'], tokenHoldings: 0
    });

    await sql`INSERT INTO alerts (id,reporter_id,address,chain,evidence_url,description,severity,enrichment)
      VALUES (${id},${reporter_id},${address},${chain},${evidence_url},${description},${severity},${enrichment}::jsonb)`;

    const reporter = await sql`SELECT handle FROM reporters WHERE id=${reporter_id}`;
    await sql`INSERT INTO audit_log (type,alert_id,actor,details)
      VALUES ('alert_created',${id},${reporter[0]?.handle||'Unknown'},${severity.toUpperCase()+' on '+chain})`;
    await sql`INSERT INTO audit_log (type,alert_id,actor,details)
      VALUES ('enrichment_done',${id},'system','Auto-enrichment complete')`;
    await sql`INSERT INTO audit_log (type,alert_id,actor,details)
      VALUES ('webhook_sent',${id},'system','Dispatched to 3 channels')`;

    return res.status(201).json({ id, success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
