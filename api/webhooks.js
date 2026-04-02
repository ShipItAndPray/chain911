const { getDb } = require('./db.js');

// Actually deliver a webhook payload
async function deliverWebhook(webhook, payload) {
  const { type, url } = webhook;
  try {
    if (type === 'Slack') {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `*[chain911] ${payload.severity.toUpperCase()} Alert*\n*${payload.chain}* | \`${payload.address.slice(0, 12)}...\`\n${payload.description}`,
          blocks: [
            { type: 'header', text: { type: 'plain_text', text: `[chain911] ${payload.severity.toUpperCase()} Alert` } },
            { type: 'section', text: { type: 'mrkdwn', text: `*Chain:* ${payload.chain}\n*Address:* \`${payload.address}\`\n*Reporter:* ${payload.reporter}\n*Amount:* ${payload.amount || 'Unknown'}` } },
            { type: 'section', text: { type: 'mrkdwn', text: payload.description } },
            { type: 'actions', elements: [{ type: 'button', text: { type: 'plain_text', text: 'View Alert' }, url: `https://chain911.vercel.app/#/alert/${payload.id}` }] }
          ]
        })
      });
      return { type, status: 'delivered' };
    }

    if (type === 'Telegram') {
      const text = '\u{1F6A8} *chain911 ' + payload.severity.toUpperCase() + ' Alert*\n\n' +
        '*Chain:* ' + payload.chain + '\n' +
        '*Address:* `' + payload.address + '`\n' +
        '*Reporter:* ' + payload.reporter + '\n' +
        '*Amount:* ' + (payload.amount || 'Unknown') + '\n\n' +
        payload.description + '\n\n' +
        '[View Alert](https://chain911.vercel.app/#/alert/' + payload.id + ')';
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, parse_mode: 'Markdown', disable_web_page_preview: true })
      });
      return { type, status: 'delivered' };
    }

    if (type === 'PagerDuty') {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_action: 'trigger',
          payload: {
            summary: '[chain911] ' + payload.severity.toUpperCase() + ': ' + payload.description.slice(0, 120),
            severity: payload.severity === 'critical' ? 'critical' : payload.severity === 'high' ? 'error' : 'warning',
            source: 'chain911',
            component: payload.chain,
            custom_details: { address: payload.address, reporter: payload.reporter, amount: payload.amount }
          },
          links: [{ href: 'https://chain911.vercel.app/#/alert/' + payload.id, text: 'View in chain911' }]
        })
      });
      return { type, status: 'delivered' };
    }

    // Generic webhook
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return { type, status: 'delivered' };
  } catch (err) {
    return { type, status: 'failed', error: err.message };
  }
}

async function dispatchAlert(sql, alertPayload) {
  const webhooks = await sql`SELECT * FROM webhooks WHERE enabled = true`;
  const results = [];
  for (const wh of webhooks) {
    const result = await deliverWebhook(wh, alertPayload);
    results.push(result);
    await sql`INSERT INTO audit_log (type, alert_id, actor, details)
      VALUES ('webhook_sent', ${alertPayload.id}, 'system', ${result.type + ': ' + result.status + (result.error ? ' - ' + result.error : '')})`;
  }
  return results;
}

module.exports = async function(req, res) {
  const sql = getDb();

  if (req.method === 'GET') {
    const webhooks = await sql`SELECT * FROM webhooks ORDER BY id`;
    return res.status(200).json(webhooks);
  }

  if (req.method === 'PATCH') {
    const { id, enabled, url } = req.body;
    if (url !== undefined) {
      await sql`UPDATE webhooks SET url=${url}, enabled=${enabled !== undefined ? enabled : true} WHERE id=${id}`;
    } else if (enabled !== undefined) {
      await sql`UPDATE webhooks SET enabled=${enabled} WHERE id=${id}`;
    }
    return res.status(200).json({ success: true });
  }

  if (req.method === 'POST') {
    const { action, id: whId, type: whType, url, team_id } = req.body;

    if (action === 'test') {
      const webhooks = whId
        ? await sql`SELECT * FROM webhooks WHERE id=${whId}`
        : [{ type: whType || 'Generic', url }];
      if (!webhooks.length) return res.status(404).json({ error: 'Webhook not found' });
      const testPayload = {
        id: 'test-' + Date.now(), severity: 'low', chain: 'ETH',
        address: '0x' + '0'.repeat(40),
        description: 'Test alert from chain911. If you see this, your webhook is working.',
        reporter: 'chain911-system', amount: '$0 (test)',
        evidence_url: 'https://chain911.vercel.app'
      };
      const result = await deliverWebhook(webhooks[0], testPayload);
      return res.status(200).json(result);
    }

    if (action === 'add') {
      const newId = 'w' + Date.now();
      await sql`INSERT INTO webhooks (id, team_id, type, url, enabled) VALUES (${newId}, ${team_id || 't3'}, ${whType}, ${url}, true)`;
      return res.status(201).json({ id: newId, success: true });
    }

    if (action === 'delete') {
      await sql`DELETE FROM webhooks WHERE id=${whId}`;
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'action required: test, add, or delete' });
  }

  if (req.method === 'DELETE') {
    const { id: whId } = req.query;
    if (whId) { await sql`DELETE FROM webhooks WHERE id=${whId}`; return res.status(200).json({ success: true }); }
    return res.status(400).json({ error: 'id required' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

module.exports.dispatchAlert = dispatchAlert;
