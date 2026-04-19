'use strict';
const crypto = require('crypto');
const { query } = require('./_db');

function hashIP(ip) {
  return crypto.createHash('sha256')
    .update((ip || '') + (process.env.IP_SALT || 'default-salt'))
    .digest('hex').slice(0, 16);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const body = JSON.parse(event.body || '{}');
    const ip = (event.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const ua = (event.headers['user-agent'] || '').slice(0, 250);
    await query(
      'INSERT INTO page_visits (page, ip_hash, user_agent) VALUES ($1, $2, $3)',
      [(body.page || 'home').slice(0, 100), hashIP(ip), ua]
    );
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) };
  } catch {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Server error' }) };
  }
};
