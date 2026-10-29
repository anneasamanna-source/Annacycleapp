# ANNA CYCLE

FOOD FLOWS. COMMUNITIES GROW.

A food resilience and recovery platform prototype (Next.js, TypeScript, Tailwind). No outside services are needed.

## Run it

Requires Node.js 20 or newer.

```bash
cp .env.example .env.local     # Windows: copy .env.example .env.local
npm install
npm run dev                    # open http://localhost:3000
npm test                       # automated tests
```

The first run downloads the Manrope and Noto Sans Bengali fonts, so it needs internet once.

## Two modes (set `ANNA_DATA_MODE` in `.env.local`)

| Mode | What it is |
|---|---|
| `demo` (default) | Sample data in memory. No accounts: a "Viewing as" dropdown switches between sample users. Resets when the server restarts. Best for a quick demonstration. |
| `local` | Real accounts (sign up / sign in) and everything people create is saved to `data/anna.json`, so it survives restarts. Starts with the same sample hubs and listings, clearly labelled as sample. |

Switching mode: stop the server, change `.env.local`, start again.

### Local mode: accounts
- Anyone can sign up as a **vendor** or **buyer** at `/register`.
- **Hub operator** and **administrator** accounts are never self-service. Create them from the terminal:
  1. Open the site once so `data/anna.json` exists, then **stop the server** (Ctrl+C).
  2. `npm run create-user -- --name "Rina" --email rina@example.com --role hub_operator --hub h-1`
     (use `--role admin` for an administrator; you are asked for the password if you leave out `--password`).
  3. Start the server again.
- `npm run reset-data` (server stopped) deletes everything saved and starts again from the sample data.

### Where local mode can be hosted
It saves to a file, so it needs a computer or host with a **disk that persists** and **one server process**:
your own PC or a spare laptop, a small VPS, or Render / Railway / Fly.io with a persistent volume
(point `ANNA_DATA_FILE` at the volume). It will **not** keep data on Vercel or Netlify, whose disks are temporary.
Use `demo` mode there. Keep `data/anna.json` private and backed up: it holds password hashes.
Serve it over HTTPS when it is on the internet (the sign-in cookie is only marked secure in production).

## Security notes
Passwords are stored as salted scrypt hashes, never in plain text. Sessions are random tokens kept in an
HttpOnly cookie, and only their hash is saved. Sign-in locks an email for 10 minutes after 5 wrong tries, and
gives the same message for unknown emails and wrong passwords. All rules (who may reserve, book, confirm,
release, withdraw) are enforced on the server. No security review by a third party has been done.

## Limits (honest)
- One server process only. Not built for many users at once or several servers.
- No password reset, email verification, photo upload, or hub registration form (hubs are sample data).
- No automated accessibility audit has been run. Bengali text needs a native speaker's review.
- Storage guidance per crop has not been reviewed by a food-safety or post-harvest expert.
- Recommendations are rule-based, not AI. Processor and recovery-partner routes are demonstrations.
- "Collected" is what the seller reports. Nothing is independently verified yet.

See `docs/DEMO_SCRIPT.md` for a 5-minute walkthrough (demo mode).
