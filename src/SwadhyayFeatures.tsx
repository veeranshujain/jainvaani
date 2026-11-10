import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

type SwadhyaySession = {
  id: string;
  session_key: string;
  title: string;
  schedule_time: string;
  zoom_url: string | null;
  session_info: string | null;
  is_active: boolean;
  allow_attendance: boolean;
};

const styles = `
.swz-wrap{display:grid;gap:16px;margin:20px 0}
.swz-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.swz-card{border:1px solid #eadfc9;border-radius:16px;background:#fffdf8;padding:20px;min-width:0}
.swz-top{display:flex;justify-content:space-between;align-items:center;gap:10px}
.swz-icon{font-size:22px}.swz-pill{font-size:10px;letter-spacing:1px;color:#55734a;background:#edf5e9;padding:6px 9px;border-radius:20px}
.swz-time{font-size:13px;color:#9b571f;font-weight:700;margin-top:18px}
.swz-card h3{margin:7px 0;color:#50351e;font-size:20px}.swz-card p{color:#786b5b;font-size:13px;margin:0 0 14px}
.swz-btn{display:inline-block;border:0;border-radius:9px;padding:10px 14px;background:#a65e20;color:white;text-decoration:none;font-weight:600;cursor:pointer}
.swz-muted{color:#817666;font-size:13px}.swz-error{background:#f9e9e4;color:#8a3425;padding:10px 12px;border-radius:9px;font-size:13px}
.swz-success{background:#edf5e9;color:#426b35;padding:10px 12px;border-radius:9px;font-size:13px}
.swz-admin{margin:22px 0 28px;padding:22px;border:1px solid #eadfc9;border-radius:18px;background:#fffdf8}
.swz-admin h2{margin:0 0 6px;color:#50351e;font-size:22px}.swz-admin>p{margin:0 0 18px;color:#786b5b;font-size:14px}
.swz-form{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.swz-form label{display:flex;flex-direction:column;gap:6px;color:#5d4934;font-size:13px;font-weight:600}
.swz-form input,.swz-form textarea{width:100%;box-sizing:border-box;border:1px solid #dfd3bf;border-radius:10px;padding:11px 12px;background:#fff;font:inherit;color:#33291f}
.swz-wide{grid-column:1/-1}.swz-actions{display:flex;gap:9px;flex-wrap:wrap}
.swz-primary,.swz-secondary{border:0;border-radius:9px;padding:10px 15px;cursor:pointer;font-weight:600}
.swz-primary{background:#a65e20;color:white}.swz-secondary{background:#eee6d9;color:#60462d}
.swz-admin-list{display:grid;gap:10px;margin-top:20px}
.swz-admin-row{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:14px;border:1px solid #eee4d5;border-radius:12px;background:#fff}
.swz-check{display:flex;gap:7px;align-items:center;color:#766958;font-size:13px}
@media(max-width:650px){.swz-grid{grid-template-columns:1fr}.swz-form{grid-template-columns:1fr}.swz-wide{grid-column:auto}.swz-admin-row{align-items:flex-start;flex-direction:column}}
`;

export function SwadhyaySessions() {
  const [items, setItems] = useState<SwadhyaySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    supabase.from("jainvaani_sessions")
      .select("id, session_key, title, schedule_time, zoom_url, session_info, is_active, allow_attendance")
      .eq("is_active", true)
      .order("session_key", { ascending: true })
      .then(({ data, error: loadError }) => {
        if (!alive) return;
        if (loadError) setError(loadError.message);
        else setItems((data || []) as SwadhyaySession[]);
        setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  return (
    <div className="swz-wrap">
      <style>{styles}</style>
      {loading ? <p className="swz-muted">सत्र लोड हो रहे हैं...</p> :
        error ? <div className="swz-error">{error}</div> :
        items.length === 0 ? <p className="swz-muted">अभी कोई सक्रिय सत्र उपलब्ध नहीं है।</p> :
        <div className="swz-grid">{items.map((item) => (
          <article className="swz-card" key={item.id}>
            <div className="swz-top">
              <span className="swz-icon">{item.session_key === "morning" ? "☀" : item.session_key === "evening" ? "☾" : "📖"}</span>
              <span className="swz-pill">{item.allow_attendance ? "ATTENDANCE ACTIVE" : "SESSION"}</span>
            </div>
            <div className="swz-time">{item.schedule_time || "नियत समय"}</div>
            <h3>{item.title}</h3>
            {item.session_info && <p>{item.session_info}</p>}
            {item.zoom_url ? (
              <a className="swz-btn" href={item.zoom_url} target="_blank" rel="noreferrer">कक्षा से जुड़ें ↗</a>
            ) : (
              <span className="swz-muted">जूम लिंक शीघ्र उपलब्ध होगा।</span>
            )}
          </article>
        ))}</div>}
    </div>
  );
}

export function SwadhyayManager() {
  const [items, setItems] = useState<SwadhyaySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Form state for creating/editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState("");
  const [title, setTitle] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [zoomUrl, setZoomUrl] = useState("");
  const [sessionInfo, setSessionInfo] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [allowAttendance, setAllowAttendance] = useState(false);

  async function loadSessions() {
    setLoading(true);
    setError("");
    const { data, error: loadError } = await supabase.from("jainvaani_sessions")
      .select("*")
      .order("session_key", { ascending: true });
    if (loadError) setError(loadError.message);
    else setItems((data || []) as SwadhyaySession[]);
    setLoading(false);
  }

  useEffect(() => { void loadSessions(); }, []);

  function resetForm() {
    setEditingId(null);
    setSessionKey("");
    setTitle("");
    setScheduleTime("");
    setZoomUrl("");
    setSessionInfo("");
    setIsActive(true);
    setAllowAttendance(false);
  }

  function startEdit(item: SwadhyaySession) {
    setEditingId(item.id);
    setSessionKey(item.session_key);
    setTitle(item.title);
    setScheduleTime(item.schedule_time || "");
    setZoomUrl(item.zoom_url || "");
    setSessionInfo(item.session_info || "");
    setIsActive(item.is_active);
    setAllowAttendance(item.allow_attendance);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !sessionKey.trim()) {
      setError("सत्र शीर्षक और कुंजी (Key) आवश्यक हैं।");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      session_key: sessionKey.trim().toLowerCase().replace(/\s+/g, '_'),
      title: title.trim(),
      schedule_time: scheduleTime.trim() || "08:15 AM",
      zoom_url: zoomUrl.trim() || null,
      session_info: sessionInfo.trim() || null,
      is_active: isActive,
      allow_attendance: allowAttendance,
    };

    const res = editingId
      ? await supabase.from("jainvaani_sessions").update(payload).eq("id", editingId)
      : await supabase.from("jainvaani_sessions").insert(payload);

    setSaving(false);
    if (res.error) {
      setError(res.error.message);
    } else {
      setNotice("सत्र सफलताيपूर्वक सहेज लिया गया।");
      resetForm();
      await loadSessions();
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("क्या आप इस सत्र को हटाना चाहते हैं?")) return;
    const { error: delErr } = await supabase.from("jainvaani_sessions").delete().eq("id", id);
    if (delErr) setError(delErr.message);
    else {
      setNotice("सत्र हटा दिया गया है।");
      await loadSessions();
    }
  }

  return (
    <section className="swz-admin">
      <style>{styles}</style>
      <h2>◷ स्वाध्याय सत्र प्रबंधन (Swadhyay Sessions)</h2>
      <p>प्रातः, सायं, गुरुदेव जी या विशेष स्वाध्याय सत्र बनाएं और प्रबंधित करें। (ध्यान दें: अटेंडेंस केवल सुबह और शाम के सत्रों पर लागू होती है।)</p>
      
      {error && <div className="swz-error">{error}</div>}
      {notice && <div className="swz-success">{notice}</div>}

      <form className="swz-form" onSubmit={handleSave} style={{ marginBottom: 24, background: "#fff", padding: 16, borderRadius: 12, border: "1px solid #eadfc9" }}>
        <label>Session Key (जैसे: morning, evening, gurudev, special)
          <input value={sessionKey} onChange={e => setSessionKey(e.target.value)} placeholder="morning" required />
        </label>
        <label>सत्र शीर्षक (Title)
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="परमात्मप्रकाश" required />
        </label>
        <label>समय (Schedule Time)
          <input value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} placeholder="08:15 AM" />
        </label>
        <label>Zoom Link
          <input type="url" value={zoomUrl} onChange={e => setZoomUrl(e.target.value)} placeholder="https://zoom.us/j/..." />
        </label>
        <label className="swz-wide">विवरण / जानकारी
          <textarea value={sessionInfo} onChange={e => setSessionInfo(e.target.value)} placeholder="विशेष जानकारी..." />
        </label>
        <label className="swz-check">
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
          सक्रिय रखें (Show to members)
        </label>
        <label className="swz-check">
          <input type="checkbox" checked={allowAttendance} onChange={e => setAllowAttendance(e.target.checked)} />
          अटेंडेंस सक्षम करें (केवल मॉर्निंग/इवनिंग के लिए)
        </label>
        <div className="swz-wide swz-actions">
          <button className="swz-primary" type="submit" disabled={saving}>
            {saving ? "सहेज रहा है..." : editingId ? "सत्र अपडेट करें" : "नया सत्र जोड़ें"}
          </button>
          {editingId && <button className="swz-secondary" type="button" onClick={resetForm}>रद्द करें</button>}
        </div>
      </form>

      {loading ? <p className="swz-muted">लोड हो रहा है...</p> : (
        <div className="swz-admin-list">
          {items.map(item => (
            <div className="swz-admin-row" key={item.id}>
              <div>
                <b>{item.title}</b> ({item.session_key}) — <span style={{color: '#9b571f'}}>{item.schedule_time}</span>
                <small>{item.is_active ? "🟢 सक्रिय" : "🔴 निष्क्रीय"} | अटेंडेंस: {item.allow_attendance ? "हाँ" : "ना"}</small>
              </div>
              <div className="swz-actions">
                <button className="swz-secondary" onClick={() => startEdit(item)}>संपादित करें</button>
                <button className="swz-secondary" style={{background: '#f9e9e4', color: '#8a3425'}} onClick={() => void handleDelete(item.id)}>हटाएं</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}