'use strict';
const jwt = require('jsonwebtoken');

function verifyAdmin(event) {
  const auth = event.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return false;
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

module.exports = { verifyAdmin };
