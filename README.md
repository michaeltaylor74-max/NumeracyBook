# Senior Numeracy Short Course — Website

## First-time setup

1. Install Node.js (https://nodejs.org) if not already installed.

2. Open a terminal in this folder and install dependencies:
   ```
   npm install
   ```

3. Copy the example environment file:
   ```
   copy .env.example .env
   ```

4. Edit `.env` and set a long random SESSION_SECRET and IP_SALT (any random text).

5. Generate your admin password hash:
   ```
   node setup.js yourChosenPassword
   ```
   Copy the printed hash into `.env` as ADMIN_PASSWORD_HASH.

6. Start the server:
   ```
   npm start
   ```

7. Visit http://localhost:3000

## Admin dashboard

Go to http://localhost:3000/admin/login.html
Log in with the username and password you configured in `.env`.

## Folder structure

```
Website/
├── server.js          — Express server (all routes + database)
├── package.json
├── setup.js           — Run once to generate admin password hash
├── .env               — Your configuration (never share this file)
├── data.db            — SQLite database (created automatically on first run)
├── PDF/
│   ├── Nurmeracy Student Book.pdf
│   └── Nurmeracy Teacher Book.pdf
└── public/
    ├── index.html     — Main website
    ├── style.css
    ├── script.js
    ├── images/        — Put your images here (see below)
    └── admin/
        ├── login.html
        └── dashboard.html
```

## Images needed

Place these files in `public/images/`:

| File | What it is | How to get it |
|------|-----------|---------------|
| `cover-student.jpg` | Front cover of the Student Workbook | Export a screenshot of the first page of the student PDF, crop to the cover, save as JPG |
| `cover-teacher.jpg` | Front cover of the Teacher's Resource Book | Same — screenshot of the cover PDF page |
| `favicon.png` | Small icon shown in browser tab | A simple 32×32 or 64×64 PNG — use your initials or a small book icon |

If images are missing the site still works — it shows a green placeholder for the book covers.

## Deploying to a hosting provider

This is a standard Node.js app. Popular free/cheap options:

- **Railway** (railway.app) — drag and drop deploy, free tier available
- **Render** (render.com) — free tier, connects to GitHub
- **DigitalOcean App Platform** — $5/month, very straightforward

For any provider, set the same environment variables from your `.env` file in the provider's dashboard.
