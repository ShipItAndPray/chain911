const { getDb } = require('./db.js');
const { protect } = require('./middleware.js');

module.exports = protect(async function(req, res) {
  const sql = getDb();
  const { type, search, limit } = req.query;
  const max = Math.min(parseInt(limit) || 100, 500);

  let where = [];
  let params = [];
  let idx = 1;

  if (type) { where.push('type = $' + idx++); params.push(type); }
  if (search) { where.push('(details ILIKE $' + idx + ' OR actor ILIKE $' + idx + ')'); params.push('%'+search+'%'); idx++; }

  const whereClause = where.length ? ' WHERE ' + where.join(' AND ') : '';
  const query = 'SELECT * FROM audit_log' + whereClause + ' ORDER BY created_at DESC LIMIT $' + idx;
  params.push(max);

  const log = await sql.query(query, params);
  return res.status(200).json(log);
}, { ratePerMinute: 30 });
