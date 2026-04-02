const { protect } = require('./middleware.js');
const { getDb } = require('./db.js');

module.exports = protect(async function(req, res) {
  const sql = getDb();

  if (req.method === 'POST') {
    const { alert_id, team_id, team_name, action } = req.body;
    if (!alert_id || !team_id || !action) return res.status(400).json({ error: 'Missing fields' });

    const id = 'd_' + alert_id + '_' + team_id;
    await sql`INSERT INTO decisions (id,alert_id,team_id,team_name,action)
      VALUES (${id},${alert_id},${team_id},${team_name||'Unknown'},${action})
      ON CONFLICT (id) DO UPDATE SET action=EXCLUDED.action, decided_at=NOW()`;

    await sql`INSERT INTO audit_log (type,alert_id,actor,details)
      VALUES ('decision_made',${alert_id},${team_name||'Unknown'},${action.toUpperCase()+' - '+team_name})`;

    return res.status(200).json({ success: true });
  }

  if (req.method === 'GET') {
    const { alert_id } = req.query;
    const decisions = alert_id
      ? await sql`SELECT * FROM decisions WHERE alert_id=${alert_id} ORDER BY decided_at`
      : await sql`SELECT * FROM decisions ORDER BY decided_at DESC LIMIT 100`;
    return res.status(200).json(decisions);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
, { ratePerMinute: 10 });
