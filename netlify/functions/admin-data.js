'use strict';
const { Client } = require('pg');
const { verifyAdmin } = require('./_auth');

exports.handler = async (event) => {
  if (!verifyAdmin(event)) {
    return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unauthorised' }) };
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const today = new Date().toISOString().slice(0, 10);

  try {
    const [vToday, vTotal, dlToday, dlTotal, pending, fbToday, dlByBook, visitsByDay, errors, feedback] = await Promise.all([
      client.query("SELECT COUNT(*) FROM page_visits WHERE visited_at::date::text = $1", [today]),
      client.query("SELECT COUNT(*) FROM page_visits"),
      client.query("SELECT COUNT(*) FROM downloads WHERE downloaded_at::date::text = $1", [today]),
      client.query("SELECT COUNT(*) FROM downloads"),
      client.query("SELECT COUNT(*) FROM error_reports WHERE status != 'complete'"),
      client.query("SELECT COUNT(*) FROM feedback WHERE submitted_at::date::text = $1", [today]),
      client.query("SELECT book, COUNT(*) as n FROM downloads GROUP BY book ORDER BY n DESC"),
      client.query("SELECT visited_at::date::text as day, COUNT(*) as n FROM page_visits WHERE visited_at >= NOW() - INTERVAL '14 days' GROUP BY day ORDER BY day"),
      client.query("SELECT * FROM error_reports ORDER BY id DESC"),
      client.query("SELECT * FROM feedback ORDER BY id DESC"),
    ]);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stats: {
          visitsToday:   parseInt(vToday.rows[0].count),
          visitsTotal:   parseInt(vTotal.rows[0].count),
          dlToday:       parseInt(dlToday.rows[0].count),
          dlTotal:       parseInt(dlTotal.rows[0].count),
          pendingErrors: parseInt(pending.rows[0].count),
          newFeedback:   parseInt(fbToday.rows[0].count),
        },
        dlByBook:    dlByBook.rows.map(r => ({ book: r.book, n: parseInt(r.n) })),
        visitsByDay: visitsByDay.rows.map(r => ({ day: r.day, n: parseInt(r.n) })),
        errors:      errors.rows,
        feedback:    feedback.rows,
      }),
    };
  } finally {
    await client.end();
  }
};
