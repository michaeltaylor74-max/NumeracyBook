'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  const json = (type, body) => ({ statusCode: type, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  const { username, password } = JSON.parse(event.body || '{}');
  const hash = process.env.ADMIN_PASSWORD_HASH || '';

  if (!hash) return json(500, { error: 'Admin not configured.' });

  if (username === process.env.ADMIN_USERNAME && bcrypt.compareSync(password, hash)) {
    const token = jwt.sign({ isAdmin: true }, process.env.JWT_SECRET, { expiresIn: '8h' });
    return json(200, { ok: true, token });
  }

  return json(401, { error: 'Invalid credentials' });
};
