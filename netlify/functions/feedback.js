'use strict';
const { query } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  const json = (type, body) => ({ statusCode: type, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    const { name, email, message } = JSON.parse(event.body || '{}');
    if (!message || message.trim().length < 5) {
      return json(400, { error: 'Please provide a message.' });
    }
    await query(
      'INSERT INTO feedback (name, email, message) VALUES ($1, $2, $3)',
      [(name || '').slice(0, 100), (email || '').slice(0, 200), message.trim().slice(0, 2000)]
    );
    return json(200, { ok: true });
  } catch {
    return json(500, { error: 'Server error' });
  }
};
