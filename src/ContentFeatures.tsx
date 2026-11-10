
import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { supabase } from "./lib/supabase";

const css = `
.jv-panel{background:#fffefa;border:1px solid #eee7dc;border-radius:14px;padding:20px;margin:18px 0}
.jv-panel h2{font-size:19px;color:#50351e;margin:0 0 12px}
.jv-form{display:grid;gap:9px;margin:12px 0}
.jv-form input,.jv-form textarea,.jv-form select{width:100%;padding:10px;border:1px solid #e5dac9;border-radius:8px;font:inherit}
.jv-form textarea{min-height:65px}
.jv-row{border:1px solid #eee5d8;border-radius:10px;padding:13px;margin:9px 0;background:white}
.jv-row h3{font-size:15px;margin:0 0 6px;color:#50351e}
.jv-btn{border:0;border-radius:8px;padding:9px 13px;background:#a65e20;color:white;font-weight:600;font-size:12px;cursor:pointer;margin:4px 6px 4px 0}
.jv-btn.alt{background:#eee6d9;color:#60462d}
.jv-btn.danger{background:#8a3425;color:white}
.jv-btn:disabled{opacity:.5;cursor:not-allowed}
.jv-error{padding:10px;background:#fff0ed;color:#963b2d;border-radius:8px;font-size:12px;margin:10px 0}
.jv-muted{color:#8e8578;font-size:12px}
.jv-question{padding:12px;background:#fbf7ef;border-radius:9px;margin:10px 0}
.jv-question label{display:block;font-size:13px;margin:8px 0}
.jv-question input{width:auto;margin-right:8px}
.jv-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}
.jv-grid label{font-size:12px;color:#60462d}
.jv-grid input{display:block;width:100%;padding:10px;border:1px solid #e5dac9;border-radius:8px;margin-top:5px}
.jv-stat{background:#fbf7ef;border-radius:9px;padding:12px;margin:8px 0}
.jv-table{width:100%;border-collapse:collapse;font-size:12px;margin-top:12px}
.jv-table th,.jv-table td{border:1px solid #eee5d8;padding:8px;text-align:left}
.jv-table th{background:#fbf7ef;color:#50351e}
`;

function Panel({ children }: { children: ReactNode }) {
  return <section className="jv-panel"><style>{css}</style>{children}</section>;
}

const CERT_TYPES = [
  { value: "weekly_quiz", label: "Weekly Quiz Achievement" },
  { value: "monthly_morning", label: "Monthly Morning Swadhyay Attendance" },
  { value: "monthly_evening", label: "Monthly Evening Swadhyay Attendance" },
];

function certLabel(value: any) {
  return CERT_TYPES.find(x => x.value === value)?.label || String(value ?? "");
}

function escapeHtml(value: any) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]!);
}

function printCertificate(c: any) {
  const w = window.open("", "_blank");

  if (!w) {
    alert("Please allow pop-ups to view certificate.");
    return;
  }

  const name = escapeHtml(c.full_name || c.memberName || "JainVaani Member");
  const type = escapeHtml(c.achievement_title || c.achievement || certLabel(c.certificate_type));
  const number = escapeHtml(c.certificate_number || "JV-" + Math.floor(Math.random() * 1000000));
  const start = escapeHtml(c.period_start || c.issuedDate || new Date().toLocaleDateString("en-IN"));
  const end = escapeHtml(c.period_end || "");

  w.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>JainVaani Certificate</title>
      <style>
        @page { size: landscape; margin: 0; }
        body { font-family: Georgia, serif; background: #faf7ef; margin: 0; padding: 20px; color: #50351e; display: flex; justify-content: center; align-items: center; height: 100vh; box-sizing: border-box; }
        .box { width: 1000px; height: 562px; border: 8px double #b77a32; padding: 30px; text-align: center; background: white; position: relative; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; }
        .header { display: flex; align-items: center; justify-content: center; gap: 15px; }
        .logo { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #b77a32; }
        .brand { font-size: 16px; letter-spacing: 2px; color: #89501f; font-weight: bold; }
        .title { font-size: 28px; margin: 10px 0; color: #50351e; font-weight: bold; }
        .name { font-size: 26px; color: #9b5c20; margin: 10px 0; font-weight: bold; border-bottom: 2px solid #eee; display: inline-block; padding-bottom: 5px; }
        .type { font-size: 18px; font-weight: bold; margin: 8px 0; color: #50351e; }
        .details { font-size: 11px; line-height: 1.6; color: #776b5d; margin-top: 10px; }
        .footer-area { display: flex; justify-content: space-between; align-items: flex-end; padding: 0 40px; margin-top: 15px; }
        .signature { font-size: 13px; color: #50351e; border-top: 1px solid #dcd2c1; padding-top: 4px; font-weight: bold; }
        @media print { body { background: white; padding: 0; } .box { box-shadow: none; border: 8px double #b77a32; width: 100vw; height: 100vh; } }
      </style>
    </head>
    <body>
      <div class="box">
        <div class="header">
          <img src="/jainvaani-logo.jpeg" alt="Logo" class="logo" />
          <div class="brand">JAINVAANI · ज्ञान • संयम • साधना</div>
        </div>
        <div>
          <div class="title">Certificate of Achievement</div>
          <p style="margin:5px 0; font-size: 14px;">This certificate is proudly presented to</p>
          <div class="name">${name}</div>
          <p style="margin:5px 0; font-size: 13px;">For outstanding recognition, dedication, and study in</p>
          <div class="type">${type}</div>
        </div>
        <div class="details">
          ${start && end ? `Period: ${start} to ${end} &nbsp;|&nbsp; ` : `Date: ${start} &nbsp;|&nbsp; `}
          Certificate No.: ${number}
        </div>
        <div class="footer-area">
          <div style="text-align: left; font-size: 12px; color: #b77a32; font-weight: bold;">जय जिनेन्द्र</div>
          <div style="text-align: right;">
            <div class="signature">Navin Jain</div>
            <div style="font-size: 10px; color: #888;">Founder & Administrator</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);

  w.document.close();
  w.onload = () => w.print();
}

export function MemberPravachan() {
  const [rows, S] = useState<any[]>([]);
  const [err, E] = useState("");

  useEffect(() => {
    supabase.from("pravachan_playlists")
      .select("id,title,youtube_url,is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) E(error.message);
        else S(data || []);
      });
  }, []);

  return <Panel>
    <h2>▶ पूर्व प्रवचन (Previous Pravachan)</h2>
    {err && <div className="jv-error">{err}</div>}
    {rows.length === 0 && !err && <p className="jv-muted">No pravachan playlists available yet.</p>}
    {rows.map(x => <article className="jv-row" key={x.id}>
      <h3>{x.title}</h3>
      <a href={x.youtube_url} target="_blank" rel="noreferrer">Open YouTube Playlist ↗</a>
    </article>)}
  </Panel>;
}

export function MemberNotices() {
  const [rows, S] = useState<any[]>([]);
  const [err, E] = useState("");

  useEffect(() => {
    supabase.from("notices")
      .select("id,title,content,is_published,created_at,expires_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          E(error.message);
          return;
        }
        const now = new Date();
        const active = (data || []).filter((n: any) => {
          if (!n.expires_at) return true;
          return new Date(n.expires_at) > now;
        });
        S(active);
      });
  }, []);

  return <Panel>
    <h2>♧ सूचनाएँ (Notices)</h2>
    {err && <div className="jv-error">{err}</div>}
    {rows.length === 0 && !err && <p className="jv-muted">No active notices.</p>}
    {rows.map(x => <article className="jv-row" key={x.id}>
      <h3>{x.title}</h3>
      <p>{x.content}</p>
      <small className="jv-muted">Published: {new Date(x.created_at).toLocaleDateString("hi-IN")}</small>
    </article>)}
  </Panel>;
}

export function MemberFeedbackWidget() {
  const [message, M] = useState("");
  const [rows, S] = useState<any[]>([]);
  const [err, E] = useState("");
  const [msg, G] = useState("");
  const [busy, B] = useState(false);

  async function loadMyFeedback() {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data, error } = await supabase.from("member_feedback")
      .select("id,message,status,admin_reply,created_at")
      .eq("user_id", user.user.id)
      .order("created_at", { ascending: false });
    if (!error) S(data || []);
  }

  useEffect(() => { void loadMyFeedback(); }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    B(true); E(""); G("");
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) { E("Login required."); B(false); return; }

    const { error } = await supabase.from("member_feedback").insert({
      user_id: user.user.id,
      member_name: user.user.user_metadata?.full_name || user.user.email,
      message: message.trim(),
    });

    B(false);
    if (error) E(error.message);
    else {
      G("✅ Feedback submitted successfully.");
      M("");
      void loadMyFeedback();
    }
  }

  return <Panel>
    <h2>✍ Feedback & Suggestions</h2>
    <p className="jv-muted">Submit your feedback, bug report, or suggestion to admins.</p>
    <form className="jv-form" onSubmit={submit}>
      <textarea value={message} onChange={e => M(e.target.value)} placeholder="Write your message here..." required />
      <button className="jv-btn" disabled={busy}>Submit Feedback</button>
    </form>
    {err && <div className="jv-error">{err}</div>}
    {msg && <p><b>{msg}</b></p>}

    <h3 style={{marginTop: 20}}>My Previous Messages</h3>
    {rows.length === 0 ? <p className="jv-muted">No messages sent yet.</p> : rows.map(f => <div className="jv-row" key={f.id}>
      <p><b>Message:</b> {f.message}</p>
      <p><b>Status:</b> <span style={{color: f.status === 'Resolved' ? 'green' : '#a65e20'}}>{f.status}</span></p>
      {f.admin_reply && <p style={{background: '#fbf7ef', padding: 8, borderRadius: 6}}><b>Admin Reply:</b> {f.admin_reply}</p>}
      <small className="jv-muted">{new Date(f.created_at).toLocaleString()}</small>
    </div>)}
  </Panel>;
}

export function MemberQuizzes() {
  const [rows, S] = useState<any[]>([]);
  const [quiz, Q] = useState<any>(null);
  const [questions, QS] = useState<any[]>([]);
  const [answers, A] = useState<Record<string, string>>({});
  const [err, E] = useState("");
  const [busy, B] = useState(false);
  const [result, R] = useState<any>(null);

  const [certificates, CS] = useState<any[]>([]);
  const [verifyNumber, VN] = useState("");
  const [verifyResult, VR] = useState<any>(null);
  const [verifyError, VE] = useState("");

  async function load() {
    const { data, error } = await supabase.from("quizzes")
      .select("id,title,description,is_published")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) E(error.message);
    else S(data || []);
  }

  async function loadCertificates() {
    const { data, error } = await supabase.rpc("get_my_jainvaani_certificates");
    if (error) E(error.message);
    else CS(data || []);
  }

  useEffect(() => {
    void load();
    void loadCertificates();
  }, []);

  async function start(q: any) {
    B(true);
    E("");
    R(null);
    A({});

    const { data, error } = await supabase.from("quiz_questions")
      .select("id,question,points,position")
      .eq("quiz_id", q.id)
      .order("position");

    if (error) {
      E(error.message);
      B(false);
      return;
    }

    const list: any[] = [];

    for (const x of data || []) {
      const r = await supabase.from("quiz_options")
        .select("id,option_text,position")
        .eq("question_id", x.id)
        .order("position");

      if (r.error) {
        E(r.error.message);
        B(false);
        return;
      }

      list.push({ ...x, options: r.data || [] });
    }

    QS(list);
    Q(q);
    B(false);
  }

  async function submit() {
    if (!quiz) return;

    if (questions.some(q => !answers[q.id])) {
      E("Please answer all questions.");
      return;
    }

    B(true);

    const { data, error } = await supabase.rpc("submit_jainvaani_quiz", {
      p_quiz_id: quiz.id,
      p_answers: questions.map(q => ({
        question_id: q.id,
        selected_option_id: answers[q.id],
      })),
    });

    B(false);

    if (error) {
      E(error.message);
      return;
    }

    const r = Array.isArray(data) ? data[0] : data;
    R(r);
    Q(null);
    void loadCertificates();
  }

  async function verifyCertificate(e: FormEvent) {
    e.preventDefault();
    VE("");
    VR(null);

    if (!verifyNumber.trim()) {
      VE("Please enter certificate number.");
      return;
    }

    const { data, error } = await supabase.rpc("verify_jainvaani_certificate", {
      p_certificate_number: verifyNumber.trim(),
    });

    if (error) {
      VE(error.message);
      return;
    }

    const r = Array.isArray(data) ? data[0] : data;

    if (!r || !r.is_valid) {
      VE("Certificate not found. Check the number.");
      return;
    }

    VR(r);
  }

  return <Panel>
    <h2>✎ Quizzes & Exams</h2>

    {err && <div className="jv-error">{err}</div>}

    {result && <div className="jv-row">
      <h3>Quiz Result</h3>
      Score: {result.score}/{result.total_points}
      {result.certificate_number && <p style={{color: '#a65e20', fontWeight: 'bold'}}>Congratulations! Certificate Issued: {result.certificate_number}</p>}
    </div>}

    {quiz ? <>
      <h3>{quiz.title}</h3>
      {questions.map((q, i) => <div className="jv-question" key={q.id}>
        <b>{i + 1}. {q.question} ({q.points} Points)</b>
        {q.options.map((o: any) => <label key={o.id}>
          <input
            type="radio"
            name={q.id}
            checked={answers[q.id] === o.id}
            onChange={() => A(a => ({ ...a, [q.id]: o.id }))}
          />
          {o.option_text}
        </label>)}
      </div>)}
      <button className="jv-btn" disabled={busy} onClick={() => void submit()}>Submit Quiz</button>
      <button className="jv-btn alt" onClick={() => Q(null)}>Cancel</button>
    </> : rows.map(q => <article className="jv-row" key={q.id}>
      <h3>{q.title}</h3>
      <p>{q.description}</p>
      <button className="jv-btn" onClick={() => void start(q)}>Start Quiz</button>
    </article>)}

    <hr style={{margin: "24px 0"}} />
    <h2>🏅 My Certificates</h2>

    {certificates.length === 0
      ? <p className="jv-muted">No certificates issued yet.</p>
      : certificates.map(c => <article className="jv-row" key={c.certificate_id}>
        <h3>{c.achievement_title || certLabel(c.certificate_type)}</h3>
        <p>Period: {c.period_start} to {c.period_end}</p>
        <p>Cert No.: <b>{c.certificate_number}</b></p>
        <p className="jv-muted">Issued Date: {new Date(c.issued_at).toLocaleDateString()}</p>
        <button className="jv-btn" onClick={() => printCertificate(c)}>Print / Download (16:9 Landscape)</button>
      </article>)}

    <hr style={{margin: "24px 0"}} />
    <h2>🔎 Verify Certificate</h2>
    <form className="jv-form" onSubmit={verifyCertificate}>
      <input
        value={verifyNumber}
        onChange={e => VN(e.target.value)}
        placeholder="Enter certificate number (e.g. JV-123456)"
      />
      <button className="jv-btn">Verify</button>
    </form>

    {verifyError && <div className="jv-error">{verifyError}</div>}

    {verifyResult && <article className="jv-row">
      <h3>✓ Certificate is Valid</h3>
      <p>Name: {verifyResult.full_name}</p>
      <p>Type: {certLabel(verifyResult.certificate_type)}</p>
      <p>Number: {verifyResult.certificate_number}</p>
      <p>Period: {verifyResult.period_start} to {verifyResult.period_end}</p>
    </article>}
  </Panel>;
}


export function AdminContent() {
  const [quizzes, Q] = useState<any[]>([]);
  const [notices, N] = useState<any[]>([]);
  const [lists, L] = useState<any[]>([]);
  const [members, M] = useState<any[]>([]);

  const [question, QT] = useState("");
  const [opts, O] = useState(["", "", "", ""]);
  const [correct, C] = useState(0);
  const [publishing, PUB] = useState(false);

  const [nt, NT] = useState("");
  const [nb, NB] = useState("");
  const [expiry, EX] = useState("24h");
  const [customExpiry, CE_VAL] = useState("");

  const [pt, PT] = useState("");
  const [pu, PU] = useState("");

  const [err, E] = useState("");
  const [msg, G] = useState("");

  const [selectedMember, SM] = useState("");
  const [certType, SCT] = useState("weekly_quiz");
  const [customAchievementText, SCAT] = useState("");
  const [manualCertDate, MCD] = useState(new Date().toISOString().slice(0, 10));

  async function refresh() {
    const [a, b, c] = await Promise.all([
      supabase.from("quizzes").select("*").order("created_at", { ascending: false }),
      supabase.from("notices").select("*").order("created_at", { ascending: false }),
      supabase.from("pravachan_playlists").select("*").order("created_at", { ascending: false }),
    ]);

    Q(a.data || []);
    N(b.data || []);
    L(c.data || []);

    const { data: memList, error: memError } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .order("created_at", { ascending: true });

    if (memError) {
      E(memError.message);
      return;
    }

    M(memList || []);
  }

  useEffect(() => { void refresh(); }, []);

  async function publishQuiz(e: FormEvent) {
    e.preventDefault();
    E("");
    G("");

    if (!question.trim()) {
      E("Please enter a question.");
      return;
    }

    if (opts.some(x => !x.trim())) {
      E("Please fill all four options.");
      return;
    }

    PUB(true);

    try {
      // Automatically generate quiz title from the question.
      const quizTitle = question.trim().length > 60
        ? question.trim().slice(0, 57) + "..."
        : question.trim();

      // Create quiz as unpublished first.
      const quizResult = await supabase.from("quizzes").insert({
        title: quizTitle,
        description: null,
        is_published: false,
      }).select("id").single();

      if (quizResult.error) throw quizResult.error;

      const quizId = quizResult.data.id;

      // Add the question.
      const questionResult = await supabase.from("quiz_questions").insert({
        quiz_id: quizId,
        question: question.trim(),
        points: 1,
        position: 1,
      }).select("id").single();

      if (questionResult.error) throw questionResult.error;

      const questionId = questionResult.data.id;

      // Add four options.
      const optionsResult = await supabase.from("quiz_options").insert(
        opts.map((value, index) => ({
          question_id: questionId,
          option_text: value.trim(),
          position: index + 1,
        }))
      ).select("id,position");

      if (optionsResult.error) throw optionsResult.error;

      const correctOption = optionsResult.data?.find(
        option => option.position === correct + 1
      );

      if (!correctOption) {
        throw new Error("Correct option could not be saved.");
      }

      // Save correct answer.
      const answerResult = await supabase.from("quiz_answer_keys").insert({
        question_id: questionId,
        correct_option_id: correctOption.id,
      });

      if (answerResult.error) throw answerResult.error;

      // Publish only after all quiz data is saved.
      const publishResult = await supabase.from("quizzes")
        .update({ is_published: true })
        .eq("id", quizId);

      if (publishResult.error) throw publishResult.error;

      QT("");
      O(["", "", "", ""]);
      C(0);

      G("✅ Quiz published successfully!");
      await refresh();

    } catch (error: any) {
      E(error?.message || "Quiz publish failed.");
    } finally {
      PUB(false);
    }
  }

  async function deleteQuiz(quizId: string, quizTitle: string) {
    if (!window.confirm(`Delete quiz "${quizTitle}"? Student history will be preserved.`)) return;

    E("");
    G("");

    const { error } = await supabase.rpc("admin_delete_quiz", {
      p_quiz_id: quizId,
    });

    if (error) {
      E("Quiz delete failed: " + error.message);
      return;
    }

    G("🗑 Quiz deleted successfully. Student history preserved.");
    await refresh();
  }

  async function publish(id: string, v: boolean) {
    const r = await supabase.from("quizzes").update({ is_published: v }).eq("id", id);
    if (r.error) E(r.error.message);
    else {
      G(v ? "Quiz published." : "Quiz unpublished.");
      void refresh();
    }
  }

  async function addNotice(e: FormEvent) {
    e.preventDefault();
    let expiresAt: string | null = null;
    const now = new Date();

    if (expiry === "24h") now.setHours(now.getHours() + 24);
    else if (expiry === "2d") now.setDate(now.getDate() + 2);
    else if (expiry === "1w") now.setDate(now.getDate() + 7);
    else if (expiry === "1m") now.setMonth(now.getMonth() + 1);
    else if (expiry === "custom" && customExpiry) {
      expiresAt = new Date(customExpiry).toISOString();
    }

    if (expiry !== "custom") expiresAt = now.toISOString();

    const r = await supabase.from("notices").insert({
      title: nt.trim(),
      content: nb.trim(),
      is_published: true,
      expires_at: expiresAt,
    });

    if (r.error) E(r.error.message);
    else {
      NT("");
      NB("");
      G("Notice published successfully.");
      void refresh();
    }
  }

  async function deleteNotice(id: string) {
    if (!window.confirm("Delete this notice?")) return;
    await supabase.from("notices").delete().eq("id", id);
    void refresh();
  }

  async function addPlaylist(e: FormEvent) {
    e.preventDefault();
    try {
      new URL(pu);
    } catch {
      E("Please enter a valid URL.");
      return;
    }

    const r = await supabase.from("pravachan_playlists").insert({
      title: pt.trim(),
      youtube_url: pu.trim(),
      is_active: true,
    });

    if (r.error) E(r.error.message);
    else {
      PT("");
      PU("");
      G("Playlist added.");
      void refresh();
    }
  }

  async function issueManualCertificate() {
    if (!selectedMember) {
      E("Select a member first.");
      return;
    }

    let achievementText = certLabel(certType);

    if (certType === "custom") {
      if (!customAchievementText.trim()) {
        E("Enter custom achievement text.");
        return;
      }
      achievementText = customAchievementText.trim();
    }

    const memberObj = members.find(m => m.id === selectedMember);

    if (!memberObj) {
      E("Selected profile not found.");
      return;
    }

    const certNumber = "JV-MAN-" + Math.floor(100000 + Math.random() * 900000);

    const { error } = await supabase
      .from("jainvaani_certificates")
      .insert({
        user_id: selectedMember,
        certificate_type: certType === "custom" ? "custom_achievement" : certType,
        achievement_title: achievementText,
        period_start: manualCertDate,
        period_end: manualCertDate,
        certificate_number: certNumber,
      });

    if (error) {
      E("Certificate issue failed: " + error.message);
      return;
    }

    G(`Certificate issued successfully for ${memberObj.full_name || "Member"}!`);
    void refresh();
  }

  return <Panel>
    <h2>⚙ Admin Control Center</h2>

    {err && <div className="jv-error">{err}</div>}
    {msg && <p role="status"><b>{msg}</b></p>}

    <h3>1. Quiz Management & Deletion</h3>

    <form className="jv-form" onSubmit={publishQuiz}>
      <input
        value={question}
        onChange={e => QT(e.target.value)}
        placeholder="Enter Question"
        required
      />

      {opts.map((value, index) => (
  <div
    key={index}
    style={{
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) auto",
      alignItems: "center",
      gap: 12,
      width: "100%",
    }}
  >
    <input
      style={{
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",
      }}
      value={value}
      onChange={e => O(old =>
        old.map((x, i) => i === index ? e.target.value : x)
      )}
      placeholder={`Option ${index + 1}`}
      required
    />

    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        whiteSpace: "nowrap",
        cursor: "pointer",
      }}
    >
      <input
        type="radio"
        name="jv-correct"
        style={{
          width: "auto",
          margin: 0,
        }}
        checked={correct === index}
        onChange={() => C(index)}
      />
      Correct Answer
    </label>
  </div>
))}

      <button className="jv-btn" type="submit" disabled={publishing}>
        {publishing ? "Publishing..." : "Publish Quiz"}
      </button>
    </form>

    {quizzes.map(q => (
      <article className="jv-row" key={q.id}>
        <h3>{q.title}</h3>
        <p>{q.is_published ? "🟢 Published" : "⚪ Draft"}</p>

        <button
          className="jv-btn alt"
          onClick={() => void publish(q.id, !q.is_published)}
        >
          {q.is_published ? "Unpublish" : "Publish"}
        </button>

        <button
          className="jv-btn danger"
          onClick={() => void deleteQuiz(q.id, q.title)}
        >
          Delete Quiz
        </button>
      </article>
    ))}

    <hr style={{ margin: "24px 0" }} />
    <h3>2. Notice Management & Expiry</h3>

    <form className="jv-form" onSubmit={addNotice}>
      <input value={nt} onChange={e => NT(e.target.value)} placeholder="Notice Title" required />
      <textarea value={nb} onChange={e => NB(e.target.value)} placeholder="Notice Content" required />

      <label>Expiry Period:
        <select value={expiry} onChange={e => EX(e.target.value)}>
          <option value="24h">24 Hours</option>
          <option value="2d">2 Days</option>
          <option value="1w">1 Week</option>
          <option value="1m">1 Month</option>
          <option value="custom">Custom Date & Time</option>
        </select>
      </label>

      {expiry === "custom" && (
        <input
          type="datetime-local"
          value={customExpiry}
          onChange={e => CE_VAL(e.target.value)}
          required
        />
      )}

      <button className="jv-btn">Publish Notice</button>
    </form>

    {notices.map(n => (
      <article className="jv-row" key={n.id}>
        <h3>{n.title}</h3>
        <p>{n.content}</p>
        <small className="jv-muted">
          Expires: {n.expires_at ? new Date(n.expires_at).toLocaleString() : "Never"}
        </small>
        <button className="jv-btn danger" onClick={() => void deleteNotice(n.id)}>
          Delete
        </button>
      </article>
    ))}

    <hr style={{ margin: "24px 0" }} />
    <h3>3. Certificate Issuance (16:9 Landscape)</h3>
    <p className="jv-muted">
      Issue a certificate to any registered member with official title or custom text.
    </p>

    <div className="jv-form">
      <label>Select Member:
        <select value={selectedMember} onChange={e => SM(e.target.value)}>
          <option value="">-- Select Member ({members.length} available) --</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>
              {m.full_name || "Unnamed Profile"} ({m.role || "Profile"})
            </option>
          ))}
        </select>
      </label>

      <label>Certificate Achievement Title:
        <select value={certType} onChange={e => SCT(e.target.value)}>
          {CERT_TYPES.map(ct => (
            <option key={ct.value} value={ct.value}>{ct.label}</option>
          ))}
          <option value="custom">✍ Custom Achievement Text</option>
        </select>
      </label>

      {certType === "custom" && (
        <label>Enter Custom Title / Event Name:
          <input
            value={customAchievementText}
            onChange={e => SCAT(e.target.value)}
            placeholder="e.g. Special Recognition in Pravachan Swadhyay 2026"
          />
        </label>
      )}

      <label>Issue Date:
        <input
          type="date"
          value={manualCertDate}
          onChange={e => MCD(e.target.value)}
        />
      </label>

      <button
        className="jv-btn"
        type="button"
        onClick={() => void issueManualCertificate()}
      >
        Issue Certificate
      </button>
    </div>

    <hr style={{ margin: "24px 0" }} />
    <h3>4. Pravachan Playlists</h3>

    <form className="jv-form" onSubmit={addPlaylist}>
      <input value={pt} onChange={e => PT(e.target.value)} placeholder="Playlist Title" required />
      <input type="url" value={pu} onChange={e => PU(e.target.value)} placeholder="YouTube Playlist URL" required />
      <button className="jv-btn">Add Playlist</button>
    </form>

    {lists.map(p => (
      <article className="jv-row" key={p.id}>
        <h3>{p.title}</h3>
        <a href={p.youtube_url} target="_blank" rel="noreferrer">Watch ↗</a>
        <button
          className="jv-btn alt"
          onClick={() => void supabase.from("pravachan_playlists").delete().eq("id", p.id).then(refresh)}
        >
          Delete
        </button>
      </article>
    ))}
  </Panel>;
}


export function AdminDashboard() {
  const [d, setD] = useState<any>(null);
  const [err, E] = useState("");

  useEffect(() => {
    supabase.rpc("get_admin_dashboard_stats").then(({ data, error }) => {
      if (error) E(error?.message || "Error");
      else setD(Array.isArray(data) ? data[0] : data);
    });
  }, []);

  return <Panel>
    <h2>📈 Admin Dashboard</h2>
    {err && <div className="jv-error">{err}</div>}
    {!d && !err && <p className="jv-muted">Loading...</p>}
    {d && <div className="jv-grid">
      <div className="jv-stat"><div style={{ fontSize: 22, fontWeight: 700, color: "#a65e20" }}>{d.members}</div><div className="jv-muted">Total Members</div></div>
      <div className="jv-stat"><div style={{ fontSize: 22, fontWeight: 700, color: "#a65e20" }}>{d.quizzes}</div><div className="jv-muted">Quizzes</div></div>
      <div className="jv-stat"><div style={{ fontSize: 22, fontWeight: 700, color: "#a65e20" }}>{d.notices}</div><div className="jv-muted">Notices</div></div>
      <div className="jv-stat"><div style={{ fontSize: 22, fontWeight: 700, color: "#a65e20" }}>{d.sessions_this_month}</div><div className="jv-muted">Sessions This Month</div></div>
    </div>}
  </Panel>;
}

export function Leaderboard() {
  const [rows, S] = useState<any[]>([]);
  const [err, E] = useState("");
  const [loading, L] = useState(true);

  useEffect(() => {
    supabase.rpc("get_jainvaani_leaderboard", { p_limit: 20 }).then(({ data, error }) => {
      if (error) E(error?.message || "Error");
      else S(data || []);
      L(false);
    });
  }, []);

  return <Panel>
    <h2>🏆 Leaderboard</h2>
    {err && <div className="jv-error">{err}</div>}
    {loading && <p className="jv-muted">Loading...</p>}
    {!loading && !err && rows.length === 0 && <p className="jv-muted">Leaderboard is empty.</p>}
    {rows.length > 0 && <table className="jv-table">
      <thead><tr><th>#</th><th>Name</th><th>Average Score</th><th>Quizzes Taken</th></tr></thead>
      <tbody>
        {rows.map((x, i) => <tr key={i}>
          <td>{x.rank}</td><td>{x.display_name}</td><td>{x.percentage}%</td><td>{x.quizzes_taken}</td>
        </tr>)}
      </tbody>
    </table>}
  </Panel>;
}

export function NotificationsBar() {
  const [items, S] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      let seen: string[] = [];
      try { seen = JSON.parse(localStorage.getItem("jv_seen_notifs") || "[]"); } catch { seen = []; }
      const since = new Date(Date.now() - 7 * 86400000).toISOString();
      const [n, q] = await Promise.all([
        supabase.from("notices").select("id,title,created_at,expires_at").eq("is_published", true)
          .gte("created_at", since).order("created_at", { ascending: false }).limit(5),
        supabase.from("quizzes").select("id,title,created_at").eq("is_published", true)
          .gte("created_at", since).order("created_at", { ascending: false }).limit(5),
      ]);
      const now = new Date();
      const validNotices = (n.data || []).filter((x: any) => !x.expires_at || new Date(x.expires_at) > now);

      const list = [
        ...validNotices.map((x: any) => ({ key: "n" + x.id, icon: "📢", text: "New Notice: " + x.title, at: x.created_at })),
        ...(q.data || []).map((x: any) => ({ key: "q" + x.id, icon: "✎", text: "New Quiz: " + x.title, at: x.created_at })),
      ].filter(x => !seen.includes(x.key)).sort((a, b) => String(b.at).localeCompare(String(a.at)));
      S(list);
    })();
  }, []);

  function dismiss(keys: string[]) {
    try {
      const old: string[] = JSON.parse(localStorage.getItem("jv_seen_notifs") || "[]");
      localStorage.setItem("jv_seen_notifs", JSON.stringify([...old, ...keys].slice(-200)));
    } catch { /* storage unavailable */ }
    S(list => list.filter(x => !keys.includes(x.key)));
  }

  if (items.length === 0) return null;

  return <Panel>
    <h2>🔔 Notifications ({items.length})</h2>
    {items.map(x => <article className="jv-row" key={x.key}>
      <p>{x.icon} {x.text}</p>
      <button className="jv-btn alt" onClick={() => dismiss([x.key])}>Dismiss</button>
    </article>)}
    <button className="jv-btn" onClick={() => dismiss(items.map(x => x.key))}>Dismiss All</button>
  </Panel>;
}

export function AdminMembers() {
  const [rows, S] = useState<any[]>([]);
  const [q, Q] = useState("");
  const [role, R] = useState("all");
  const [err, E] = useState("");
  const [loading, L] = useState(true);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) E(error.message);
        else S(data || []);
        L(false);
      });
  }, []);

  const roles = Array.from(new Set(rows.map(x => x.role).filter(Boolean)));

  const shown = rows.filter(x =>
    (role === "all" || x.role === role) &&
    (x.full_name || "").toLowerCase().includes(q.trim().toLowerCase())
  );

  return <Panel>
    <h2>👥 Member Search ({shown.length}/{rows.length})</h2>

    {err && <div className="jv-error">{err}</div>}
    {loading && <p className="jv-muted">Loading members...</p>}

    <div className="jv-form">
      <input
        value={q}
        onChange={e => Q(e.target.value)}
        placeholder="Search by member name"
      />

      <select value={role} onChange={e => R(e.target.value)}>
        <option value="all">All Roles</option>
        {roles.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
    </div>

    {!loading && shown.length === 0 && (
      <p className="jv-muted">No members found.</p>
    )}

    {shown.map(m => (
      <article className="jv-row" key={m.id}>
        <b>{m.full_name || "Member"}</b>
        <p className="jv-muted">Role: {m.role || "Member"}</p>
      </article>
    ))}
  </Panel>;
}

export function AdminContentEditor() {
  return null;
}

export function AdminCertificateHistory() {
  const [rows, S] = useState<any[]>([]);
  const [q, Q] = useState("");
  const [type, T] = useState("all");
  const [err, E] = useState("");
  const [loading, L] = useState(true);

  useEffect(() => {
    (async () => {
      const [c, p] = await Promise.all([
        supabase.from("jainvaani_certificates")
          .select("id,user_id,certificate_type,period_start,period_end,certificate_number,issued_at")
          .order("issued_at", { ascending: false }).limit(500),
        supabase.from("profiles").select("id,full_name"),
      ]);
      if (c.error) E(c.error.message);
      const names: Record<string, string> = {};
      (p.data || []).forEach((x: any) => {
        names[x.id] = x.full_name || "Member";
      });
      S((c.data || []).map((x: any) => ({ ...x, name: names[x.user_id] || "Unknown" })));
      L(false);
    })();
  }, []);

  const needle = q.trim().toLowerCase();
  const shown = rows.filter(x =>
    (type === "all" || x.certificate_type === type) &&
    (!needle || x.name.toLowerCase().includes(needle) || String(x.certificate_number).toLowerCase().includes(needle))
  );

  return <Panel>
    <h2>🗂 Certificate History ({shown.length}/{rows.length})</h2>
    {err && <div className="jv-error">{err}</div>}
    {loading && <p className="jv-muted">Loading history...</p>}
    <div className="jv-form">
      <input value={q} onChange={e => Q(e.target.value)} placeholder="Search by name or cert number" />
      <select value={type} onChange={e => T(e.target.value)}>
        <option value="all">All Types</option>
        {CERT_TYPES.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
        <option value="custom_achievement">Custom Achievement</option>
      </select>
    </div>
    {!loading && shown.length === 0 && <p className="jv-muted">No certificates found.</p>}
    <div style={{ overflowX: "auto" }}>
      {shown.length > 0 && <table className="jv-table">
        <thead><tr><th>Member</th><th>Type</th><th>Period</th><th>Number</th><th>Issue Date</th></tr></thead>
        <tbody>
          {shown.map(x => <tr key={x.id}>
            <td>{x.name}</td>
            <td>{certLabel(x.certificate_type)}</td>
            <td>{x.period_start} → {x.period_end}</td>
            <td>{x.certificate_number}</td>
            <td>{new Date(x.issued_at).toLocaleDateString()}</td>
          </tr>)}
        </tbody>
      </table>}
    </div>
  </Panel>;
}

const PROFILE_TEXT: Record<"hi" | "en", Record<string, string>> = {
  hi: {
    email: "ईमेल", role: "भूमिका", admin: "प्रशासक", member: "सदस्य",
    name: "पूरा नाम", namePh: "आपका नाम", save: "सेव करें", saving: "सेव हो रहा है...",
    saved: "✅ प्रोफ़ाइल अपडेट हो गई।", emptyName: "नाम खाली नहीं हो सकता।",
    myCerts: "मेरे प्रमाणपत्र", noCerts: "अभी कोई प्रमाणपत्र जारी नहीं हुआ है।", period: "अवधि",
    certNo: "प्रमाणपत्र क्रमांक", issued: "जारी", print: "प्रिंट / PDF सेव करें (16:9)",
    history: "मेरी परीक्षाओं का इतिहास", noHistory: "अभी तक कोई परीक्षा नहीं दी है।",
    score: "अंक", logout: "लॉग आउट", locale: "hi-IN",
  },
  en: {
    email: "Email", role: "Role", admin: "Administrator", member: "Member",
    name: "Full Name", namePh: "Your name", save: "Save Profile", saving: "Saving...",
    saved: "✅ Profile updated.", emptyName: "Name cannot be empty.",
    myCerts: "My Certificates", noCerts: "No certificate issued yet.", period: "Period",
    certNo: "Certificate No.", issued: "Issued", print: "Print / Save PDF (16:9)",
    history: "My Quiz History", noHistory: "No quizzes taken yet.",
    score: "Score", logout: "Log Out", locale: "en-IN",
  },
};

export function ProfilePage({ lang, email, admin, onNameSaved }: {
  lang: "hi" | "en";
  email: string;
  admin: boolean;
  onNameSaved: (name: string) => void;
}) {
  const x = PROFILE_TEXT[lang];
  const [uid, U] = useState("");
  const [name, N] = useState("");
  const [msg, G] = useState("");
  const [err, E] = useState("");
  const [busy, B] = useState(false);
  const [certs, CS] = useState<any[]>([]);
  const [history, H] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        const id = u.user?.id;
        if (!id) return;
        U(id);

        const pr = await supabase.from("profiles").select("full_name").eq("id", id).maybeSingle();
        if (pr.error) throw pr.error;
        N(pr.data?.full_name || "");

        if (admin) return;

        const hi = await supabase.rpc("get_my_jainvaani_quiz_history", { p_limit: 100 });
        if (!hi.error) H(hi.data || []);

        const ce = await supabase.rpc("get_my_jainvaani_certificates");
        if (!ce.error) CS(ce.data || []);
      } catch (e: any) {
        E(e?.message || "Error");
      }
    })();
  }, [admin]);

  async function saveName(e: FormEvent) {
    e.preventDefault();
    E(""); G("");
    if (!name.trim()) { E(x.emptyName); return; }
    B(true);
    const r = await supabase.from("profiles").update({ full_name: name.trim() }).eq("id", uid).select("id");
    B(false);
    if (r.error) E(errText(r.error));
    else { G(x.saved); onNameSaved(name.trim()); }
  }

  const initial = (name || email || "M").charAt(0).toUpperCase();

  return <>
    <Panel>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f4e8d6", color: "#a96522", display: "grid", placeItems: "center", fontSize: 28, fontWeight: 700 }}>{initial}</div>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0 }}>{name || email}</h2>
          <p className="jv-muted" style={{ margin: "4px 0 0", wordBreak: "break-all" }}>{x.email}: {email}</p>
          <p className="jv-muted" style={{ margin: "2px 0 0" }}>{x.role}: {admin ? x.admin : x.member}</p>
        </div>
      </div>

      <form className="jv-form" onSubmit={saveName}>
        <label>{x.name}
          <input value={name} onChange={e => N(e.target.value)} placeholder={x.namePh} />
        </label>
        <button className="jv-btn" disabled={busy || !uid}>{busy ? x.saving : x.save}</button>
      </form>
      {err && <div className="jv-error">{err}</div>}
      {msg && <p><b>{msg}</b></p>}
    </Panel>

    {!admin && <>
      <Panel>
        <h2>🏅 {x.myCerts}</h2>
        {certs.length === 0 && <p className="jv-muted">{x.noCerts}</p>}
        {certs.map(c => <article className="jv-row" key={c.certificate_id}>
          <h3>{certLabel(c.certificate_type)}</h3>
          <p>{x.period}: {c.period_start} → {c.period_end}</p>
          <p>{x.certNo}: <b>{c.certificate_number}</b></p>
          <p className="jv-muted">{x.issued}: {new Date(c.issued_at).toLocaleDateString(x.locale)}</p>
          <button className="jv-btn" onClick={() => printCertificate(c)}>{x.print}</button>
        </article>)}
      </Panel>

      <Panel>
        <h2>🕘 {x.history}</h2>
        {history.length === 0 && <p className="jv-muted">{x.noHistory}</p>}
        {history.map(h => <article className="jv-row" key={h.attempt_id}>
          <h3>{h.quiz_title}</h3>
          <p>{x.score}: <b>{h.score}/{h.total_points}</b></p>
          <p className="jv-muted">{h.completed_at ? new Date(h.completed_at).toLocaleString(x.locale) : ""}</p>
        </article>)}
      </Panel>
    </>}

    <Panel>
      <button className="jv-btn alt" onClick={() => void supabase.auth.signOut()}>⎋ {x.logout}</button>
    </Panel>
  </>;
}

function errText(e: any) {
  return e?.message || e?.details || "Error";
}
