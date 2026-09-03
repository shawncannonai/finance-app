import { useEffect, useState } from "react";
import { supabase, money, type Snapshot } from "../lib/supabase";

// The routing order, and what one paycheck does when it lands. Read only:
// the rules live on the laptop in SPENDING_ROUTING_RULES.md and allocate.py.
export default function Plan() {
  const [s, setS] = useState<Snapshot | null>(null);
  useEffect(() => {
    supabase.from("budget_snapshot").select("*").eq("id", 1).single().then(({ data }) => setS(data as Snapshot));
  }, []);
  if (!s) return <p className="muted">loading</p>;

  const steps: [string, number, string][] = [
    ["Tax reserve", s.tax_reserve_weekly, "Self-employment tax, 15.3%. The FEIE does not cover it."],
    ["Rent", s.rent_weekly, "Weekly until the term plus deposit are paid."],
    ["Utilities", s.utilities_weekly, "$125 a month, assumed until the first bill."],
    ["Household", s.jane_weekly, "Weekly household money."],
    ["Work tools", s.work_weekly, "Only what is tied to paid work."],
    ["Living", s.living_weekly, "Food, transport, everything day to day. This is the daily number."],
    ["Float buffer", s.float_target, "One week of pay held back. Ends the $2 instant-transfer fee for good."],
    ["Reserve", Math.round(s.payload.floor_monthly * 0.5 * 100) / 100, "Half a month of floor."],
    ["Debt", 4000, "Deferred until the floor and buffer are funded."],
  ];
  let left = s.weekly_pay;

  return (
    <>
      <h1>The order</h1>
      <p className="muted">One {money(s.weekly_pay)} Wednesday, top to bottom, until it runs out.</p>
      <ol className="steps">
        {steps.map(([k, need, why]) => {
          const isTotal = k === "Float buffer" || k === "Debt" || k === "Reserve";
          const give = Math.max(Math.min(left, need), 0);
          const state = give >= need - 0.005 ? "funded" : give > 0 ? "partial" : "none";
          left -= give;
          return (
            <li key={k} className={state}>
              <div className="row between">
                <b>{k}</b>
                <span className="num">{money(give)}{isTotal ? " of " + money(need) : ""}</span>
              </div>
              <div className="muted small">{why}</div>
            </li>
          );
        })}
      </ol>
      <p className="muted small">Discretionary: $0 until the floor is funded. That is the rule you wrote.</p>
      <h2>Rates</h2>
      <table><tbody>
        <tr><td>THB per USD</td><td className="num">{s.payload.thb_per_usd.toFixed(2)}</td></tr>
        <tr><td>Weekly pay, measured</td><td className="num">{money(s.weekly_pay)}</td></tr>
      </tbody></table>
    </>
  );
}
