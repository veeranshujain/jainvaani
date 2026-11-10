import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

type Member = { id: string; full_name: string | null };
type SessionRow = {
  id: string; session_date: string; session_key: "morning" | "evening";
  status: "held" | "cancelled"; cancellation_message: string | null;
};

const label = (key: string) => key === "morning" ? "Morning – परमात्मप्रकाश" : "Evening – मोक्षमार्गप्रकाश";
const today = () => new Date().toLocaleDateString("en-CA");

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={{ background: "#fff", border: "1px solid #eadfce", borderRadius: 14, padding: 18, margin: "16px 0", color: "#33291f" }}>
    <h2 style={{ marginTop: 0, fontSize: 20 }}>{title}</h2>{children}
  </section>;
}
const inputStyle: React.CSSProperties = { padding: 10, border: "1px solid #d8c8b5", borderRadius: 8, maxWidth: "100%" };
const buttonStyle: React.CSSProperties = { padding: "10px 14px", border: 0, borderRadius: 8, background: "#a85b19", color: "white", cursor: "pointer" };

export function AttendanceAdmin() {
  const [members, setMembers] = useState<Member[]>([]);
  const [date, setDate] = useState(today());
  const [key, setKey] = useState<"morning" | "evening">("morning");
  const [status, setStatus] = useState<"held" | "cancelled">("held");
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [marks, setMarks] = useState<Record<string, "present" | "absent">>({});
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadMembers() {
    const { data, error } = await supabase.from("profiles").select("id,full_name").order("full_name");
    if (error) setNotice(error.message); else setMembers(data || []);
  }
  useEffect(() => { void loadMembers(); }, []);

  async function loadSession() {
    setNotice(""); setSessionId(""); setMarks({});
    const { data, error } = await supabase.from("attendance_sessions").select("*")
      .eq("session_date", date).eq("session_key", key).maybeSingle();
    if (error) { setNotice(error.message); return; }
    if (!data) return;
    setSessionId(data.id); setStatus(data.status); setMessage(data.cancellation_message || "");
    if (data.status === "held") {
      const { data: rows, error: e } = await supabase.from("attendance_records")
        .select("user_id,status").eq("attendance_session_id", data.id);
      if (e) setNotice(e.message);
      else setMarks(Object.fromEntries((rows || []).map((r: any) => [r.user_id, r.status])));
    }
  }
  useEffect(() => { void loadSession(); }, [date, key]);

  async function saveSession() {
    setBusy(true); setNotice("");
    const payload = { session_date: date, session_key: key, status, cancellation_message: status === "cancelled" ? (message.trim() || "Aaj Swadhyay nahi hoga.") : null };
    const { data, error } = await supabase.from("attendance_sessions").upsert(payload, { onConflict: "session_date,session_key" }).select("id").single();
    if (error) setNotice(error.message);
    else {
      setSessionId(data.id);
      if (status === "cancelled") {
        await supabase.from("attendance_records").delete().eq("attendance_session_id", data.id);
        setMarks({});
        setNotice("Cancellation notice publish ho gaya. Members ko app mein dikhega.");
      } else setNotice("Session save ho gaya. Ab attendance mark karo.");
    }
    setBusy(false);
  }

  async function saveAttendance() {
    if (!sessionId || status !== "held") { setNotice("Pehle session ko Held karke save karo."); return; }
    setBusy(true); setNotice("");
    const rows = members.map(m => ({
      attendance_session_id: sessionId, user_id: m.id,
      status: marks[m.id] || "absent"
    }));
    const { error } = await supabase.from("attendance_records").upsert(rows, { onConflict: "attendance_session_id,user_id" });
    setNotice(error ? error.message : "Attendance save ho gayi.");
    setBusy(false);
  }

  return <Panel title="Attendance & Swadhyay Cancellation">
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
      <label>Date <input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
      <label>Session <select style={inputStyle} value={key} onChange={e => setKey(e.target.value as any)}><option value="morning">Morning</option><option value="evening">Evening</option></select></label>
      <label>Status <select style={inputStyle} value={status} onChange={e => setStatus(e.target.value as any)}><option value="held">Held / Swadhyay hoga</option><option value="cancelled">Cancelled / Swadhyay nahi hoga</option></select></label>
    </div>
    {status === "cancelled" && <textarea style={{ ...inputStyle, width: "100%", minHeight: 70 }} placeholder="Members ke liye cancellation message" value={message} onChange={e => setMessage(e.target.value)} />}
    <p><button style={buttonStyle} disabled={busy} onClick={() => void saveSession()}>{busy ? "Saving..." : "Save Session / Publish Notice"}</button></p>
    {status === "held" && sessionId && <>
      <h3>Members ki attendance</h3>
      {members.map(m => <div key={m.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "8px 0", borderBottom: "1px solid #eee" }}>
        <span>{m.full_name || "Member"}</span>
        <select style={inputStyle} value={marks[m.id] || "absent"} onChange={e => setMarks(v => ({ ...v, [m.id]: e.target.value as any }))}>
          <option value="present">Present</option><option value="absent">Absent</option>
        </select>
      </div>)}
      <p><button style={buttonStyle} disabled={busy} onClick={() => void saveAttendance()}>Save Attendance</button></p>
    </>}
    {notice && <p role="status">{notice}</p>}
  </Panel>;
}

export function SwadhyayCancellationBanner() {
  const [rows, setRows] = useState<SessionRow[]>([]);
  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("attendance_sessions").select("id,session_date,session_key,status,cancellation_message")
        .eq("session_date", today()).eq("status", "cancelled");
      setRows(data || []);
    }
    void load();
  }, []);
  if (!rows.length) return null;
  return <div style={{ border: "1px solid #e5a34c", background: "#fff4df", padding: 14, borderRadius: 12, margin: "12px 0" }}>
    <strong>आज स्वाध्याय नहीं होगा</strong>
    {rows.map(r => <p key={r.id} style={{ marginBottom: 4 }}><b>{label(r.session_key)}:</b> {r.cancellation_message || "आज की कक्षा स्थगित है।"}</p>)}
  </div>;
}

export function MemberAttendance() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(today().slice(0, 7));
  useEffect(() => {
    async function load() {
      setError("");
      const start = `${month}-01`;
      const endDate = new Date(Number(month.slice(0,4)), Number(month.slice(5,7)), 0).getDate();
      const end = `${month}-${String(endDate).padStart(2,"0")}`;
      const { data, error } = await supabase.from("attendance_sessions")
        .select("id,session_date,session_key,status,attendance_records(status,user_id)")
        .gte("session_date", start).lte("session_date", end).eq("status", "held").order("session_date");
      if (error) { setError(error.message); return; }
      const { data: user } = await supabase.auth.getUser();
      const uid = user.user?.id;
      setRows((data || []).map((s: any) => ({
        ...s, mine: (s.attendance_records || []).find((a: any) => a.user_id === uid)?.status || "not marked"
      })));
    }
    void load();
  }, [month]);
  const stats = useMemo(() => {
    return (["morning","evening"] as const).map(k => {
      const list = rows.filter(r => r.session_key === k);
      const present = list.filter(r => r.mine === "present").length;
      return { key: k, total: list.length, present, pct: list.length ? Math.round(present / list.length * 100) : 0 };
    });
  }, [rows]);
  return <Panel title="My Monthly Attendance">
    <label>Month <input style={inputStyle} type="month" value={month} onChange={e => setMonth(e.target.value)} /></label>
    {stats.map(s => <div key={s.key} style={{ margin: "14px 0" }}><b>{label(s.key)}</b><p>{s.present} / {s.total} sessions present — {s.pct}%</p></div>)}
    {error && <p>{error}</p>}
    <details><summary>Attendance history</summary>{rows.map(r => <p key={r.id}>{r.session_date} · {label(r.session_key)} · {r.mine}</p>)}</details>
  </Panel>;
}
