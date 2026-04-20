'use strict';
const crypto = require('crypto');
const { query } = require('./_db');

const BOOKS = {
  student: { label: 'Student Workbook',         url: '/PDF/Nurmeracy%20Student%20Book.pdf' },
  teacher: { label: "Teacher's Resource Book",  url: '/PDF/Nurmeracy%20Teacher%20Book.pdf' },
};

function hashIP(ip) {
  return crypto.createHash('sha256')
    .update((ip || '') + (process.env.IP_SALT || 'default-salt'))
    .digest('hex').slice(0, 16);
}

exports.handler = async (event) => {
  const key = event.path.split('/').pop();
  const book = BOOKS[key];
  if (!book) return { statusCode: 404, body: 'Not found' };

  try {
    const ip = (event.headers['x-forwarded-for'] || '').split(',')[0].trim();
    await query(
      'INSERT INTO downloads (book, ip_hash) VALUES ($1, $2)',
      [book.label, hashIP(ip)]
    );
  } catch {}

  return { statusCode: 302, headers: { Location: book.url }, body: '' };
};
