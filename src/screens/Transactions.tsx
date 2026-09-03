import { useEffect, useState } from "react";
import { supabase, money, BUCKETS, BUCKET_LABEL, type Tx } from "../lib/supabase";

export default function Transactions() {
  const [rows, setRows] = useState<Tx[]>([]);
  const [filter, setFilter] = useState<"all" | "unsorted">("all");
  const [editing, setEditing] = useState<string | null>(null);

  const load = async () => {
    let q = supabase
      .from("transactions")
      .select("transaction_id,date,name,merchant_name,counterparty,amount,pending,bucket,bucket_locked")
      .order("date", { ascending: false })
      .limit(150);
    if (filter === "unsorted") q = q.eq("bucket", "uncategorized");
    const { data } = await q;
    setRows((data as Tx[]) ?? []);
  };
  useEffect(() => { load(); }, [filter]);

  const setBucket = async (id: string, bucket: string) => {
    // Optimistic locally; the laptop applies it to SQLite on the next push and
    // locks the row so no automated pass can undo a human decision.
    setRows((r) => r.map((t) => (t.transaction_id === id ? { ...t, bucket, bucket_locked: true } : t)));
    setEditing(null);
    await supabase.from("overrides").upsert({ transaction_id: id, bucket, applied: false });
    await supabase.from("transactions").update({ bucket, bucket_locked: true }).eq("transaction_id", id);
  };

  return (
    <>
      <div className="row between">
        <h1>Activity</h1>
        <div className="seg">
          <button className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>All</button>
          <button className={filter === "unsorted" ? "on" : ""} onClick={() => setFilter("unsorted")}>Unsorted</button>
        </div>
      </div>
      <ul className="list">
        {rows.map((t) => {
          const label = t.merchant_name || t.counterparty || t.name || "";
          return (
            <li key={t.transaction_id} onClick={() => setEditing(editing === t.transaction_id ? null : t.transaction_id)}>
              <div className="l">
                <div className="t">{label.slice(0, 40)}{t.pending && <span className="tag">pending</span>}</div>
                <div className="muted small">{t.date.slice(5)} · {BUCKET_LABEL[t.bucket] ?? t.bucket}{t.bucket_locked ? " · locked" : ""}</div>
              </div>
              <div className={"num " + (t.amount > 0 ? "neg" : "pos")}>{money(-t.amount)}</div>
              {editing === t.transaction_id && (
                <div className="chips full" onClick={(e) => e.stopPropagation()}>
                  {BUCKETS.map((b) => (
                    <button key={b} className={t.bucket === b ? "on" : ""} onClick={() => setBucket(t.transaction_id, b)}>
                      {BUCKET_LABEL[b]}
                    </button>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
