import { useState } from "react";
import { supabase, BUCKETS, BUCKET_LABEL } from "../lib/supabase";

// The ~$430/month that leaves as cash and buys nothing on record. Every entry
// here closes a piece of that hole. USD or THB; THB converts at the snapshot rate.
export default function LogCash({ onDone }: { onDone: () => void }) {
  const [amount, setAmount] = useState("");
  const [cur, setCur] = useState<"USD" | "THB">("THB");
  const [bucket, setBucket] = useState("bridge");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    setBusy(true);
    setErr("");
    let usd = parseFloat(amount);
    if (!isFinite(usd) || usd <= 0) { setErr("amount"); setBusy(false); return; }
    if (cur === "THB") {
      const { data } = await supabase.from("budget_snapshot").select("payload").eq("id", 1).single();
      const rate = (data?.payload as { thb_per_usd?: number } | null)?.thb_per_usd ?? 33.2;
      usd = usd / rate;
    }
    const { error } = await supabase.from("cash_log").insert({
      amount: Math.round(usd * 100) / 100,
      bucket,
      note: note || null,
    });
    setBusy(false);
    if (error) setErr(error.message);
    else onDone();
  };

  const quick = ["bridge", "discretionary", "cash_out", "work"];

  return (
    <>
      <h1>Log cash</h1>
      <p className="muted">Anything paid in cash, so it stops being invisible.</p>

      <div className="row">
        <input
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
        />
        <div className="seg">
          <button className={cur === "THB" ? "on" : ""} onClick={() => setCur("THB")}>THB</button>
          <button className={cur === "USD" ? "on" : ""} onClick={() => setCur("USD")}>USD</button>
        </div>
      </div>

      <div className="chips">
        {quick.map((b) => (
          <button key={b} className={bucket === b ? "on" : ""} onClick={() => setBucket(b)}>
            {BUCKET_LABEL[b]}
          </button>
        ))}
      </div>
      <select value={bucket} onChange={(e) => setBucket(e.target.value)}>
        {BUCKETS.filter((b) => !["income", "borrowed", "transfer"].includes(b)).map((b) => (
          <option key={b} value={b}>{BUCKET_LABEL[b]}</option>
        ))}
      </select>

      <input placeholder="what was it (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="primary" onClick={save} disabled={busy || !amount}>Save</button>
      {err && <p className="err">{err}</p>}
    </>
  );
}
