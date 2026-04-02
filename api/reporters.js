const { getDb } = require('./db.js');

module.exports = async function(req, res) {
  const sql = getDb();
  const reporters = await sql`SELECT * FROM reporters ORDER BY total_alerts DESC`;
  return res.status(200).json(reporters);
}
