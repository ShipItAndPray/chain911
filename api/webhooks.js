import { getDb } from './db.js';

export default async function handler(req, res) {
  const sql = getDb();

  if (req.method === 'GET') {
    const webhooks = await sql`SELECT * FROM webhooks ORDER BY id`;
    return res.status(200).json(webhooks);
  }

  if (req.method === 'PATCH') {
    const { id, enabled } = req.body;
    await sql`UPDATE webhooks SET enabled=${enabled} WHERE id=${id}`;
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
