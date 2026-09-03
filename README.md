# Finance

A phone-first PWA that answers one question: **what can I spend today?**

Not a budgeting app that categorises the past. It takes a real bank feed, runs
it down a fixed priority order, and returns a single number for today.

## How it is put together

    Plaid ──> laptop (Python, SQLite) ──> Supabase ──> phone (React PWA)
                    ▲                                      │
                    └────── bucket overrides, cash logs ────┘

- **The bank token never leaves the laptop.** It lives in a Windows DPAPI vault.
  Supabase only ever holds derived data, so the hosted app can never move money.
- **The laptop decides, the phone displays.** All allocation logic is Python.
  The app renders a snapshot row and writes back only the two things a human
  decides: which bucket a transaction belongs to, and cash spent off-card.
- **Deterministic rules first, LLM only on the residue.** Regex and category
  rules settle most transactions for free; only what is left goes to a model.

## Ideas here that may be worth stealing

- **`borrowed` is not income.** A loan arriving in a bank feed looks exactly
  like income, and counting it as income made a large monthly shortfall read as
  break-even. It gets its own bucket so it can never flatter the numbers.
- **`cash_out` names the hole.** Money withdrawn is real money gone, but what
  it bought is unrecorded. Tracking the size of that hole is more useful than
  pretending it is categorised. The Log Cash screen exists to shrink it.
- **A human decision locks the row.** No automated pass, rule or model, may
  overwrite a bucket a person set.
- **Rules outrank the model, the model never outranks a person.**
- **The float buffer.** Paying for instant transfers because you cannot wait
  for the free one is a cost of being short. Holding one pay cycle back removes
  it permanently, which is a large guaranteed return on a small amount of money.

## Running it

The React app is generic. The Python side that feeds it is personal and lives
elsewhere; `06_push/push.py` in that project is the contract, and the Supabase
schema it expects is in this repo's `docs/schema.sql`.

    cp .env.example .env    # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
    npm install
    npm run dev

Deploys to GitHub Pages on push to `main`.

## Security

The anon key ships in the built JavaScript, which is normal for Supabase and
safe **only** because row level security decides everything. Policies are scoped
to a single owner email, tables use `force row level security`, and public
signup must be disabled. Any new table needs a policy at creation time or it is
readable the moment it exists.

MIT.
