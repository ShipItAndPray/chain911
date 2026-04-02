import { getDb } from './db.js';

export default async function handler(req, res) {
  const sql = getDb();
  const { type, search, limit } = req.query;
  const max = Math.min(parseInt(limit) || 100, 500);

  let query = 'SELECT * FROM audit_log WHERE 1=1';
  const params = [];
  let idx = 1;

  if (type) { query += ` AND type = $${idx++}`; params.push(type); }
  if (search) { query += ` AND (details ILIKE $${idx} OR actor ILIKE $${idx})`; params.push('%'+search+'%'); idx++; }
  query += ` ORDER BY created_at DESC LIMIT $${idx}`;
  params.push(max);

  const log = await sql(query, params);
  return res.status(200).json(log);
}
