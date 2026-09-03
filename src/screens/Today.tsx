import { useEffect, useState } from "react";
import { supabase, money, type Snapshot } from "../lib/supabase";

export default function Today() {
  const [s, setS] = useState<Snapshot | null>(null);
  const [err, setErr] = useState("");

  const load = async () => {
    const { data, error } = await supabase.from("budget_snapshot").select("*").eq("id", 1).single();
    if (error) setErr(error.message);
    else setS(data as Snapshot);
  };
  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  if (err) return <p className="err">{err}</p>;
  if (!s) return <p className="muted">loading</p>;

  const p = s.payload;
  const left = Math.max(s.living_weekly - s.spent_this_week, 0);
  const pct = Math.min((s.spent_this_week / Math.max(s.living_weekly, 1)) * 100, 100);
  const floatPct = Math.min((s.float_funded / Math.max(s.float_target, 1)) * 100, 100);
  const age = Math.round((Date.now() - new Date(s.computed_at).getTime()) / 60000);
  const tone = s.allowance_today >= 20 ? "pos" : s.allowance_today >= 8 ? "warn" : "neg";

  return (
    <>
      <p className="eyebrow">You can spend today</p>
      <h1 className={"big " + tone}>{money(s.allowance_today)}</h1>
      <p className="muted">
        {money(left)} left this pay week, {p.days_left_week} day{p.days_left_week === 1 ? "" : "s"} to
        payday {s.next_payday.slice(5)}
      </p>

      <div className="bar"><div style={{ width: pct + "%" }} /></div>
      <p className="muted small">
        spent {money(s.spent_this_week)} of {money(s.living_weekly)} living this week · {money(s.spent_today)} today
      </p>

      <div className="cards">
        <div className="card"><div className="k">Cash</div><div className="v">{money(s.cash_on_hand)}</div></div>
        <div className="card">
          <div className="k">Float buffer</div>
          <div className="v">{money(s.float_funded)}</div>
          <div className="bar thin"><div style={{ width: floatPct + "%" }} /></div>
          <div className="muted small">of {money(s.float_target)}</div>
        </div>
      </div>

      <h2>Every Wednesday, in order</h2>
      <table>
        <tbody>
          <Row k="Tax reserve" v={s.tax_reserve_weekly} />
          <Row k="Rent" v={s.rent_weekly} />
          <Row k="Utilities" v={s.utilities_weekly} />
          <Row k="Household" v={s.jane_weekly} />
          <Row k="Work tools" v={s.work_weekly} />
          <Row k="Living, this is yours" v={s.living_weekly} strong />
          <Row k="Discretionary" v={0} muted />
        </tbody>
      </table>

      <h2>The month</h2>
      <table>
        <tbody>
          <Row k="Spendable pay" v={p.spendable_monthly} />
          <Row k="Floor" v={p.floor_monthly} />
          <Row k="Spending at current rate" v={p.spend_monthly} neg={p.spend_monthly > p.spendable_monthly} />
          <Row k="Cash out" v={p.cash_out_monthly} />
          <Row k="Discretionary, target $0" v={p.discretionary_monthly} neg={p.discretionary_monthly > 0} />
        </tbody>
      </table>

      {s.thailand_days_2026 != null && (
        <p className="muted small">Thailand days 2026: {s.thailand_days_2026} of 180</p>
      )}
      <p className="muted small">updated {age < 1 ? "just now" : age + " min ago"}</p>
    </>
  );
}

function Row({ k, v, strong, muted, neg }: { k: string; v: number; strong?: boolean; muted?: boolean; neg?: boolean }) {
  return (
    <tr className={(strong ? "strong " : "") + (muted ? "muted " : "")}>
      <td>{k}</td>
      <td className={"num " + (neg ? "neg" : "")}>{money(v)}</td>
    </tr>
  );
}
