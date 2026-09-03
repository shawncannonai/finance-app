import { createClient } from "@supabase/supabase-js";

// The anon key is public by design. Row level security on every table only
// lets an authenticated user (Shawn, via magic link) read or write anything.
const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const configured = Boolean(url && anon);
export const supabase = createClient(url || "https://placeholder.supabase.co", anon || "placeholder");

export type Snapshot = {
  computed_at: string;
  cash_on_hand: number;
  weekly_pay: number;
  tax_reserve_weekly: number;
  rent_weekly: number;
  utilities_weekly: number;
  living_weekly: number;
  jane_weekly: number;
  work_weekly: number;
  float_target: number;
  float_funded: number;
  spent_today: number;
  spent_this_week: number;
  allowance_today: number;
  days_left_in_month: number;
  thailand_days_2026: number | null;
  next_payday: string;
  payload: {
    floor_monthly: number;
    spendable_monthly: number;
    spend_monthly: number;
    discretionary_monthly: number;
    cash_out_monthly: number;
    days_left_week: number;
    week_start: string;
    thb_per_usd: number;
  };
};

export type Tx = {
  transaction_id: string;
  date: string;
  name: string | null;
  merchant_name: string | null;
  counterparty: string | null;
  amount: number;
  pending: boolean;
  bucket: string;
  bucket_locked: boolean;
};

export const BUCKETS = [
  "bridge",
  "work",
  "reserve_obligations",
  "trading_capital",
  "future_goals",
  "discretionary",
  "cash_out",
  "transfer",
  "borrowed",
  "income",
  "uncategorized",
] as const;

export const BUCKET_LABEL: Record<string, string> = {
  bridge: "Living",
  work: "Work tools",
  reserve_obligations: "Obligations",
  trading_capital: "Trading",
  future_goals: "Future goals",
  discretionary: "Discretionary",
  cash_out: "Cash out",
  transfer: "Transfer",
  borrowed: "Borrowed",
  income: "Income",
  uncategorized: "Unsorted",
};

export const money = (v: number | null | undefined) => {
  const n = v ?? 0;
  const s = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (n < 0 ? "-$" : "$") + s;
};
