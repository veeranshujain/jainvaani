
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

type FeedbackItem = {
  id: string;
  user_id: string;
  message: string;
  status: string;
  admin_reply: string | null;
  created_at: string;
  member_name?: string;
};

export function FeedbackSection({
  admin,
  lang,
  userId,
}: {
  admin: boolean;
  lang: "hi" | "en";
  userId: string;
}) {
  const hi = lang === "hi";

  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [replies, setReplies] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState<string | null>(null);

  async function loadFeedback() {
    setLoading(true);
    setError("");

    const { data, error: loadError } = await supabase
      .from("jainvaani_feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (loadError) {
      setError(loadError.message);
      setLoading(false);
      return;
    }

    let feedback = (data || []) as FeedbackItem[];

    if (admin && feedback.length > 0) {
      const ids = [...new Set(feedback.map((item) => item.user_id))];

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);

      if (profileError) {
        setError(profileError.message);
      }

      feedback = feedback.map((item) => ({
        ...item,
        member_name:
          profiles?.find((p) => p.id === item.user_id)?.full_name ||
          "Unknown Member",
      }));
    }

    setItems(feedback);
    setLoading(false);
  }

  useEffect(() => {
    void loadFeedback();
  }, [admin, userId]);

  async function submitFeedback(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!message.trim()) {
      setError(hi ? "कृपया अपना सुझाव लिखें।" : "Please enter your feedback.");
      return;
    }

    setSaving(true);

    const { error: insertError } = await supabase
      .from("jainvaani_feedback")
      .insert({
        user_id: userId,
        message: message.trim(),
      });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setMessage("");
    setSuccess(
      hi
        ? "आपका सुझाव सफलतापूर्वक भेज दिया गया।"
        : "Your feedback has been submitted successfully."
    );

    await loadFeedback();
  }

  async function updateFeedback(item: FeedbackItem) {
    setError("");
    setSuccess("");
    setUpdating(item.id);

    const { error: updateError } = await supabase
      .from("jainvaani_feedback")
      .update({
        status: item.status,
        admin_reply: replies[item.id] ?? item.admin_reply ?? "",
      })
      .eq("id", item.id);

    setUpdating(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(hi ? "Feedback अपडेट हो गया।" : "Feedback updated.");
    await loadFeedback();
  }

  function changeStatus(id: string, status: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status } : item
      )
    );
  }

  return (
    <section className="jv-feedback">
      <style>{`
        .jv-feedback{margin:24px 0;padding:22px;background:#fffdf8;border:1px solid #eadfc9;border-radius:18px}
        .jv-feedback h2{margin:0 0 7px;color:#50351e;font-size:21px}
        .jv-feedback-sub{margin:0 0 18px;color:#786b5b;font-size:14px}
        .jv-feedback textarea{width:100%;box-sizing:border-box;min-height:105px;padding:13px;border:1px solid #dfd3bf;border-radius:11px;font:inherit;resize:vertical;background:white}
        .jv-feedback button{border:0;border-radius:9px;padding:10px 16px;background:#a65e20;color:white;font-weight:600;cursor:pointer}
        .jv-feedback button:disabled{opacity:.6;cursor:not-allowed}
        .jv-feedback-list{display:grid;gap:12px;margin-top:20px}
        .jv-feedback-item{padding:15px;border:1px solid #eee4d5;border-radius:12px;background:white}
        .jv-feedback-item p{white-space:pre-wrap;overflow-wrap:anywhere;color:#493a2b}
        .jv-feedback-meta{font-size:12px;color:#857766}
        .jv-feedback select,.jv-feedback input{box-sizing:border-box;width:100%;padding:10px;border:1px solid #dfd3bf;border-radius:9px;background:white;font:inherit}
        .jv-feedback-actions{display:grid;grid-template-columns:1fr auto;gap:9px;align-items:center;margin-top:12px}
        .jv-feedback-error{color:#a33125;margin-top:10px;font-size:13px}
        .jv-feedback-success{color:#426b35;margin-top:10px;font-size:13px}
        .jv-feedback-reply{padding:10px 12px;background:#f8f3e9;border-radius:9px;font-size:13px}
        @media(max-width:550px){.jv-feedback{padding:16px}.jv-feedback-actions{grid-template-columns:1fr}}
      `}</style>

      <h2>💬 {hi ? "अपना सुझाव दें" : "Share Your Feedback"}</h2>

      <p className="jv-feedback-sub">
        {hi
          ? "आपके सुझाव, विचार और प्रतिक्रियाएँ JainVaani को बेहतर बनाने में मदद करेंगे।"
          : "Your ideas, suggestions and feedback help us improve JainVaani."}
      </p>

      {!admin && (
        <form onSubmit={submitFeedback}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              hi
                ? "अपना सुझाव, समस्या या विचार यहाँ लिखें..."
                : "Write your suggestion, issue or idea here..."
            }
            maxLength={3000}
          />

          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 10 }}>
            <small className="jv-feedback-meta">
              {message.length}/3000
            </small>

            <button type="submit" disabled={saving}>
              {saving
                ? hi ? "भेज रहे हैं..." : "Submitting..."
                : hi ? "Feedback भेजें" : "Submit Feedback"}
            </button>
          </div>
        </form>
      )}

      {error && <div className="jv-feedback-error">{error}</div>}
      {success && <div className="jv-feedback-success">{success}</div>}

      <div className="jv-feedback-list">
        <h3 style={{ margin: "4px 0", color: "#50351e", fontSize: 16 }}>
          {admin
            ? hi ? "सभी सदस्यों का Feedback" : "Member Feedback"
            : hi ? "आपके भेजे गए सुझाव" : "Your Submitted Feedback"}
        </h3>

        {loading ? (
          <p className="jv-feedback-meta">
            {hi ? "लोड हो रहा है..." : "Loading..."}
          </p>
        ) : items.length === 0 ? (
          <p className="jv-feedback-meta">
            {hi ? "अभी कोई Feedback नहीं है।" : "No feedback yet."}
          </p>
        ) : (
          items.map((item) => (
            <article className="jv-feedback-item" key={item.id}>
              {admin && (
                <b>{item.member_name}</b>
              )}

              <p>{item.message}</p>

              <div className="jv-feedback-meta">
                {new Date(item.created_at).toLocaleString(
                  hi ? "hi-IN" : "en-IN"
                )}
              </div>

              {admin ? (
                <>
                  <div style={{ marginTop: 12 }}>
                    <label className="jv-feedback-meta">
                      {hi ? "स्थिति" : "Status"}
                    </label>

                    <select
                      value={item.status}
                      onChange={(e) =>
                        changeStatus(item.id, e.target.value)
                      }
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <label className="jv-feedback-meta">
                      {hi ? "Admin Reply" : "Admin Reply"}
                    </label>

                    <input
                      value={
                        replies[item.id] ?? item.admin_reply ?? ""
                      }
                      onChange={(e) =>
                        setReplies((current) => ({
                          ...current,
                          [item.id]: e.target.value,
                        }))
                      }
                      placeholder={
                        hi ? "अपना जवाब लिखें..." : "Write a reply..."
                      }
                    />
                  </div>

                  <button
                    style={{ marginTop: 10 }}
                    disabled={updating === item.id}
                    onClick={() => void updateFeedback(item)}
                  >
                    {updating === item.id
                      ? hi ? "सहेज रहे हैं..." : "Saving..."
                      : hi ? "अपडेट करें" : "Save Update"}
                  </button>
                </>
              ) : (
                <>
                  <p className="jv-feedback-meta">
                    {hi ? "स्थिति: " : "Status: "}
                    <b>{item.status}</b>
                  </p>

                  {item.admin_reply && (
                    <div className="jv-feedback-reply">
                      <b>{hi ? "Admin का जवाब:" : "Admin Reply:"}</b>
                      <p style={{ marginBottom: 0 }}>{item.admin_reply}</p>
                    </div>
                  )}
                </>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
