'use strict';
const { verifyAdmin } = require('./_auth');

exports.handler = async (event) => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ isAdmin: verifyAdmin(event) }),
});
