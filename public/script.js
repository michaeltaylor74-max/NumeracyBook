'use strict';

// ── Year in footer ────────────────────────────────────────
document.getElementById('year').textContent = new Date().getFullYear();

// ── Track page visit ─────────────────────────────────────
fetch('/api/visit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ page: 'home' }),
}).catch(() => {});

// ── Mobile nav toggle ─────────────────────────────────────
const navToggle = document.getElementById('navToggle');
const navLinks  = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  // Close on link click
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

// ── Sticky nav shadow ─────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

// ── Form helper ───────────────────────────────────────────
async function submitForm(formEl, url, msgEl) {
  const btn  = formEl.querySelector('button[type="submit"]');
  const data = Object.fromEntries(new FormData(formEl));

  btn.disabled = true;
  btn.textContent = 'Sending…';
  msgEl.className = 'form-message';
  msgEl.textContent = '';

  try {
    const res  = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
    const json = await res.json();

    if (res.ok && json.ok) {
      msgEl.className   = 'form-message success';
      msgEl.textContent = 'Thank you! Your submission has been received.';
      formEl.reset();
    } else {
      throw new Error(json.error || 'Something went wrong. Please try again.');
    }
  } catch (err) {
    msgEl.className   = 'form-message error';
    msgEl.textContent = err.message;
  } finally {
    btn.disabled    = false;
    btn.textContent = btn.dataset.label || 'Submit';
  }
}

// ── Error report form ─────────────────────────────────────
const errorForm    = document.getElementById('errorForm');
const errorFormMsg = document.getElementById('errorFormMsg');
if (errorForm) {
  const btn = errorForm.querySelector('button[type="submit"]');
  btn.dataset.label = btn.textContent;
  errorForm.addEventListener('submit', e => {
    e.preventDefault();
    submitForm(errorForm, '/api/error-report', errorFormMsg);
  });
}

// ── Feedback form ─────────────────────────────────────────
const feedbackForm    = document.getElementById('feedbackForm');
const feedbackFormMsg = document.getElementById('feedbackFormMsg');
if (feedbackForm) {
  const btn = feedbackForm.querySelector('button[type="submit"]');
  btn.dataset.label = btn.textContent;
  feedbackForm.addEventListener('submit', e => {
    e.preventDefault();
    submitForm(feedbackForm, '/api/feedback', feedbackFormMsg);
  });
}
