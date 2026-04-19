'use strict';
const { query } = require('./_db');
const { verifyAdmin } = require('./_auth');

exports.handler = async (event) => {
  if (!verifyAdmin(event)) {
    return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unauthorised' }) };
  }
  if (event.httpMethod !== 'PATCH') return { statusCode: 405, body: 'Method Not Allowed' };

  const json = (type, body) => ({ statusCode: type, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  const id = parseInt(event.path.split('/').pop());
  const { status, admin_notes } = JSON.parse(event.body || '{}');

  if (!['new', 'in_progress', 'complete'].includes(status)) {
    return json(400, { error: 'Invalid status' });
  }

  await query(
    'UPDATE error_reports SET status = $1, admin_notes = $2 WHERE id = $3',
    [status, admin_notes || '', id]
  );
  return json(200, { ok: true });
};
