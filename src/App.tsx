import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, configured } from "./lib/supabase";
import Today from "./screens/Today";
import LogCash from "./screens/LogCash";
import Transactions from "./screens/Transactions";
import Plan from "./screens/Plan";

type Tab = "today" | "log" | "tx" | "plan";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("today");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!configured) {
    return (
      <main className="wrap">
        <h1>Not configured</h1>
        <p className="muted">
          Build needs <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.
        </p>
      </main>
    );
  }
  if (!ready) return <main className="wrap muted">loading</main>;
  if (!session) return <SignIn />;

  return (
    <>
      <main className="wrap">
        {tab === "today" && <Today />}
        {tab === "log" && <LogCash onDone={() => setTab("today")} />}
        {tab === "tx" && <Transactions />}
        {tab === "plan" && <Plan />}
      </main>
      <nav className="tabs">
        <button className={tab === "today" ? "on" : ""} onClick={() => setTab("today")}>Today</button>
        <button className={tab === "log" ? "on" : ""} onClick={() => setTab("log")}>Log cash</button>
        <button className={tab === "tx" ? "on" : ""} onClick={() => setTab("tx")}>Activity</button>
        <button className={tab === "plan" ? "on" : ""} onClick={() => setTab("plan")}>Plan</button>
      </nav>
    </>
  );
}

function SignIn() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const send = async () => {
    setErr("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    });
    if (error) setErr(error.message);
    else setSent(true);
  };
  return (
    <main className="wrap">
      <h1>Finance</h1>
      {sent ? (
        <p className="muted">Check your email for the sign-in link.</p>
      ) : (
        <>
          <input
            type="email"
            inputMode="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="primary" onClick={send} disabled={!email}>Send sign-in link</button>
          {err && <p className="err">{err}</p>}
        </>
      )}
    </main>
  );
}
