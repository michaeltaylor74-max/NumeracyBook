'use strict';
const { query } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  const json = (type, body) => ({ statusCode: type, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    const { book, page_number, description, email } = JSON.parse(event.body || '{}');
    if (!description || description.trim().length < 10) {
      return json(400, { error: 'Please describe the error in at least 10 characters.' });
    }
    await query(
      'INSERT INTO error_reports (book, page_number, description, reporter_email) VALUES ($1, $2, $3, $4)',
      [
        (book || 'Unspecified').slice(0, 100),
        (page_number || '').slice(0, 20),
        description.trim().slice(0, 2000),
        (email || '').slice(0, 200),
      ]
    );
    return json(200, { ok: true });
  } catch {
    return json(500, { error: 'Server error' });
  }
};
