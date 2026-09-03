# Finance

What I can spend today, and where every Wednesday goes. Phone-first PWA.

- **Data**: Plaid -> laptop (`ops/personal-finance`, Plaid token in the DPAPI vault) -> Supabase. The phone never touches Plaid.
- **Writes from the phone**: bucket overrides and cash logs. Pulled down and applied on the next laptop sync, locked so no automated pass undoes them.
- **Hosting**: GitHub Pages, built by the workflow with the anon key. Row level security means the anon key alone reads nothing.
- **Rules**: the routing order lives in `ops/personal-finance/SPENDING_ROUTING_RULES.md` and `05_budget/allocate.py`. The app displays; it does not decide.

Local: `cp .env.example .env`, fill in, `npm run dev`.
