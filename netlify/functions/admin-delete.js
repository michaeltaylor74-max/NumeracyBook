'use strict';
const { query } = require('./_db');
const { verifyAdmin } = require('./_auth');

const ALLOWED_TABLES = ['error_reports', 'feedback'];

exports.handler = async (event) => {
  if (!verifyAdmin(event)) {
    return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unauthorised' }) };
  }
  if (event.httpMethod !== 'DELETE') return { statusCode: 405, body: 'Method Not Allowed' };

  const json = (type, body) => ({ statusCode: type, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  const { table, id } = JSON.parse(event.body || '{}');
  if (!ALLOWED_TABLES.includes(table) || !id) return json(400, { error: 'Invalid request' });

  await query(`DELETE FROM ${table} WHERE id = $1`, [parseInt(id)]);
  return json(200, { ok: true });
};
