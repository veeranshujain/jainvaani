import {
  AttendanceAdmin,
  MemberAttendance,
  SwadhyayCancellationBanner,
} from "./AttendanceFeatures";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "./lib/supabase";
import "./index.css";
import { SwadhyayManager, SwadhyaySessions } from "./SwadhyayFeatures";
import { JainGamesSection } from "./JainGames";
import { FeedbackSection } from "./FeedbackFeatures";
import {
  AdminCertificateHistory,
  AdminContent,
  AdminContentEditor,
  AdminDashboard,
  AdminMembers,
  Leaderboard,
  MemberNotices,
  MemberPravachan,
  MemberQuizzes,
  ProfilePage,
} from "./ContentFeatures";

type Tab =
  | "home"
  | "swadhyay"
  | "library"
  | "pravachan"
  | "quiz"
  | "games"
  | "notices"
  | "profile"
  | "admin";

type AuthScreen = "login" | "register" | "forgot";

type Granth = {
  id: string;
  name: string;
  description: string | null;
  resource_url: string | null;
  is_active: boolean;
};

const labels = {
  en: {
    home: "Home",
    swadhyay: "Swadhyay",
    library: "Granth Library",
    pravachan: "Previous Pravachan",
    quiz: "Quizzes & Certificates",
    games: "Jain Games",
    notices: "Notices",
    admin: "Admin Center",
    greeting: "Welcome to JainVaani",
    subtitle: "A sanctuary for study, reflection, and spiritual growth.",
    morning: "Morning Swadhyay",
    evening: "Evening Swadhyay",
    join: "Join Class",
    view: "Explore",
    upcoming: "Your Swadhyay Sessions",
    updates: "Latest Announcements",
    latest: "Continue Your Studies",
    dailySessions: "Daily Sessions",
    discovery: "Discovery",
    exploreArrow: "Explore →",
    libraryDesc: "Explore sacred Jain Granths and study materials.",
    pravachanDesc: "Revisit recorded pravachans through curated playlists.",
    quizDesc: "Attempt published quizzes and track your certificates.",
    gamesDesc: "Interactive Jain dharmik puzzle and maze games.",
    noticesDesc: "Important notices and circulars from administrators.",
    adminDesc: "Manage sessions, Granths, quizzes, and notices.",
    language: "हिन्दी",
    member: "Member",
    coming: "This section is securely connected to your cloud account.",
    welcome: "Jai Jinendra",
  },
  hi: {
    home: "होम",
    swadhyay: "स्वाध्याय",
    library: "ग्रंथालय",
    pravachan: "पूर्व प्रवचन",
    quiz: "परीक्षाएँ एवं प्रमाणपत्र",
    games: "जैन खेल",
    notices: "सूचनाएँ",
    admin: "एडमिन",
    greeting: "JainVaani में आपका स्वागत है",
    subtitle: "अध्ययन, चिंतन और स्वाध्याय का एक पवित्र स्थान।",
    morning: "प्रातःकालीन स्वाध्याय",
    evening: "सायंकालीन स्वाध्याय",
    join: "कक्षा से जुड़ें",
    view: "देखें",
    upcoming: "स्वाध्याय सत्र",
    updates: "नवीनतम सूचनाएँ",
    latest: "अपना अध्ययन जारी रखें",
    dailySessions: "दैनिक सत्र",
    discovery: "अन्वेषण",
    exploreArrow: "देखें →",
    libraryDesc: "पवित्र जैन ग्रंथ और अध्ययन सामग्री देखें।",
    pravachanDesc: "संग्रहित प्लेलिस्ट के माध्यम से प्रवचन सुनें।",
    quizDesc: "प्रकाशित परीक्षाएँ दें और अपने प्रमाणपत्र देखें।",
    gamesDesc: "रोचक जैन धार्मिक पहेली और भूलभुलैया खेल।",
    noticesDesc: "प्रशासकों की महत्वपूर्ण सूचनाएँ एवं संदेश।",
    adminDesc: "सत्र, ग्रंथ, परीक्षाएँ और सूचनाएँ प्रबंधित करें।",
    language: "English",
    member: "सदस्य",
    coming: "यह अनुभाग आपके क्लाउड खाते से सुरक्षित रूप से जुड़ा हुआ है।",
    welcome: "जय जिनेन्द्र",
  },
};

export default function App() {
  const [authScreen, setAuthScreen] = useState<AuthScreen>("login");
  const [sessionLoading, setSessionLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [admin, setAdmin] = useState(false);
  const [tab, setTab] = useState<Tab>("home");
  const [lang, setLang] = useState<"en" | "hi">(() => {
    return (localStorage.getItem("jv_lang") as "en" | "hi") || "hi";
  });

  useEffect(() => {
    localStorage.setItem("jv_lang", lang);
  }, [lang]);

  const t = labels[lang];

  async function loadProfile(userId: string, fallbackName = "") {
    try {
      const [profileResult, adminResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", userId)
          .maybeSingle(),
        supabase.rpc("is_admin"),
      ]);

      const profile = profileResult.data;

      setFullName(profile?.full_name || fallbackName || "");
      setAdmin(
        adminResult.data === true ||
          profile?.role?.trim().toLowerCase() === "admin"
      );
    } catch (error) {
      console.error("Account loading failed:", error);
      setFullName(fallbackName);
      setAdmin(false);
    }
  }

  useEffect(() => {
    let alive = true;

    supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) console.error("Session lookup failed:", error.message);
      if (!alive) return;

      const currentUser = data.session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await loadProfile(
          currentUser.id,
          currentUser.user_metadata?.full_name || currentUser.email || ""
        );
      }

      if (alive) setSessionLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (!currentUser) {
          setFullName("");
          setAdmin(false);
          setTab("home");
        } else {
          setTimeout(() => {
            if (alive) {
              loadProfile(
                currentUser.id,
                currentUser.user_metadata?.full_name ||
                  currentUser.email ||
                  ""
              );
            }
          }, 0);
        }
      }
    );

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const nav: { id: Tab; label: string; icon: string }[] = [
    { id: "home", label: t.home, icon: "⌂" },
    { id: "swadhyay", label: t.swadhyay, icon: "◷" },
    { id: "library", label: t.library, icon: "▤" },
    { id: "pravachan", label: t.pravachan, icon: "▶" },
    { id: "quiz", label: t.quiz, icon: "✎" },
    { id: "games", label: t.games, icon: "🎮" },
  ];

  const title =
    tab === "profile"
      ? lang === "hi" ? "मेरी प्रोफ़ाइल" : "My Profile"
      : nav.find((item) => item.id === tab)?.label ?? t.admin;

  if (sessionLoading) {
    return (
      <div className="auth-loading">
        JainVaani
        <br />
        <span>{lang === "hi" ? "खाता लोड हो रहा है..." : "Loading account..."}</span>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthPage
        screen={authScreen}
        setScreen={setAuthScreen}
        lang={lang}
        setLang={setLang}
      />
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img
            src="/jainvaani-logo.png"
            alt="JainVaani"
            className="sidebar-logo"
          />
          <div>
            <strong>JainVaani</strong>
            <span>{lang === "hi" ? "स्वाध्याय परिवार" : "Swadhyay Family"}</span>
          </div>
        </div>

        <div className="side-label">{lang === "hi" ? "मेनू" : "MENU"}</div>

        <nav>
          {nav.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${tab === item.id ? "active" : ""}`}
              onClick={() => setTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}

          {admin && (
            <button
              className={`nav-item ${tab === "admin" ? "active" : ""}`}
              onClick={() => setTab("admin")}
            >
              <span className="nav-icon">⚙</span>
              {t.admin}
            </button>
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-note">
            {lang === "hi" ? "ज्ञान • संयम • साधना" : "Knowledge • Restraint • Sadhana"}
          </div>

          <div className="role-toggle">
            <span className="avatar">{admin ? "A" : "M"}</span>
            <span>
              <b>{admin ? t.admin : t.member}</b>
              <small>{fullName || user.email}</small>
            </span>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand">
            <img
              src="/jainvaani-logo.png"
              alt=""
              className="mobile-logo"
            />
            <b>JainVaani</b>
          </div>

          <div className="crumb">
            JainVaani <span>/</span> {title}
          </div>

          <div className="top-actions">
            <button
              className="language-btn"
              onClick={() => setLang(lang === "hi" ? "en" : "hi")}
            >
              文&nbsp; {t.language}
            </button>

            <div className="profile" style={{ cursor: "pointer" }} onClick={() => setTab("profile")}>
              <div className="profile-avatar">
                {(fullName || user.email || "M").charAt(0).toUpperCase()}
              </div>

              <span>
                <b>{fullName || user.email}</b>
                <small>{admin ? (lang === "hi" ? "प्रशासक" : "Admin") : (lang === "hi" ? "सदस्य" : "Member")}</small>
              </span>
            </div>
          </div>
        </header>

        <div className="content">
          {tab === "home" && (
            <>
              <section className="hero">
                <div className="hero-pattern">ॐ</div>

                <div className="hero-content">
                  <div className="eyebrow">{t.welcome}</div>
                  <h1>{t.greeting}</h1>
                  <p>{t.subtitle}</p>

                  <button
                    className="hero-button"
                    onClick={() => setTab("swadhyay")}
                  >
                    {t.upcoming} <span>→</span>
                  </button>
                </div>

                <div className="hero-seal">
                  <span>{lang === "hi" ? "अहिंसा" : "Ahimsa"}</span>
                  <b>
                    {lang === "hi" ? "परमो" : "Parmo"}
                    <br />
                    {lang === "hi" ? "धर्मः" : "Dharmah"}
                  </b>
                  <i>✦</i>
                </div>
              </section>

              <div className="section-heading">
                <div>
                  <span className="eyebrow">{t.dailySessions}</span>
                  <h2>{t.upcoming}</h2>
                </div>

                <button
                  className="text-button"
                  onClick={() => setTab("swadhyay")}
                >
                  {t.view} →
                </button>
              </div>

              <SwadhyaySessions />

              {admin && (
  <div className="section-heading lower">
    <div>
      <span className="eyebrow">{t.discovery}</span>
      <h2>{t.latest}</h2>
    </div>
  </div>
)}
              {admin && <AdminDashboard />}

              <div className="home-notices">
  <div className="section-heading">
    <div>
      <span className="eyebrow">{t.updates}</span>
      <h2>{t.notices}</h2>
    </div>
    <button
      className="text-button"
      onClick={() => setTab("notices")}
    >
      {t.view} →
    </button>
  </div>

  <MemberNotices />
</div>

<FeedbackSection
  admin={admin}
  lang={lang}
  userId={user.id}
/>

            </>
          )}

          {tab === "swadhyay" && (
            <SectionPage
              eyebrow={lang === "hi" ? "दैनिक स्वाध्याय" : "Daily Swadhyay"}
              title={t.swadhyay}
              desc={t.coming}
            >
              <SwadhyayCancellationBanner />
              <SwadhyaySessions />
              <MemberAttendance />
            </SectionPage>
          )}

          {tab === "library" && (
            <SectionPage
              eyebrow={lang === "hi" ? "डिजिटल संग्रह" : "Digital Collection"}
              title={t.library}
              desc={t.libraryDesc}
            >
              <GranthLibrary />
            </SectionPage>
          )}

          {tab === "pravachan" && (
            <SectionPage
              eyebrow={lang === "hi" ? "प्रवचन संग्रह" : "Pravachan Collection"}
              title={t.pravachan}
              desc={t.pravachanDesc}
            >
              <MemberPravachan />
            </SectionPage>
          )}

          {tab === "quiz" && (
            <SectionPage
              eyebrow={lang === "hi" ? "ज्ञान और परीक्षा" : "Knowledge & Certification"}
              title={t.quiz}
              desc={t.quizDesc}
            >
              <MemberQuizzes />
              <Leaderboard />
            </SectionPage>
          )}

          {tab === "games" && (
            <SectionPage
              eyebrow={lang === "hi" ? "जैन धार्मिक खेल" : "Jain Dharmik Games"}
              title={t.games}
              desc={t.gamesDesc}
            >
              <JainGamesSection />
            </SectionPage>
          )}

          {tab === "notices" && (
            <SectionPage
              eyebrow={lang === "hi" ? "महत्वपूर्ण घोषणाएँ" : "Important Announcements"}
              title={t.notices}
              desc={t.noticesDesc}
            >
              <MemberNotices />
            </SectionPage>
          )}

          {tab === "profile" && (
            <SectionPage
              eyebrow={lang === "hi" ? "प्रोफाइल" : "Profile"}
              title={lang === "hi" ? "मेरी प्रोफ़ाइल" : "My Profile"}
              desc=""
            >
              <ProfilePage
                lang={lang}
                email={user.email}
                admin={admin}
                onNameSaved={setFullName}
              />
            </SectionPage>
          )}

          {tab === "admin" && admin && (
            <SectionPage
              eyebrow={lang === "hi" ? "कंट्रोल सेंटर" : "Control Center"}
              title={t.admin}
              desc={t.adminDesc}
            >
              <GranthManager />
              <SwadhyayManager />
              <AttendanceAdmin />
              <AdminContent />
              <AdminMembers />
              <AdminContentEditor />
              <AdminCertificateHistory />
            </SectionPage>
          )}
        </div>

        <footer>
  <div>
    © 2026 JainVaani
    <span>
      {lang === "hi"
        ? "ज्ञान • संयम • साधना"
        : "Knowledge • Restraint • Sadhana"}
    </span>
  </div>

  <small className="navin-attribution">
    {lang === "hi" ? "प्रस्तुति: Navin Jain" : "Presented by Navin Jain"}
  </small>
</footer>
      </main>

      <div className="bottom-nav">
        {nav.map((item) => (
          <button
            key={item.id}
            className={`bottom-item ${tab === item.id ? "active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            <span>{item.icon}</span>
            <small>{item.label}</small>
          </button>
        ))}

        {admin && (
          <button
            key="admin-tab"
            className={`bottom-item ${tab === "admin" ? "active" : ""}`}
            onClick={() => setTab("admin")}
          >
            <span>⚙</span>
            <small>{t.admin}</small>
          </button>
        )}
      </div>
    </div>
  );
}

function GranthManager() {
  const [items, setItems] = useState<Granth[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadGranths() {
    setLoading(true);
    setError("");

    const { data, error: loadError } = await supabase
      .from("granths")
      .select("id, name, description, resource_url, is_active")
      .order("created_at", { ascending: false });

    if (loadError) setError(loadError.message);
    else setItems((data || []) as Granth[]);

    setLoading(false);
  }

  useEffect(() => {
    void loadGranths();
  }, []);

  function resetForm() {
    setName("");
    setDescription("");
    setResourceUrl("");
    setEditingId(null);
  }

  async function saveGranth(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setNotice("");

    if (!name.trim()) {
      setError("ग्रंथ का नाम जरूरी है।");
      return;
    }

    if (resourceUrl.trim()) {
      try {
        const parsed = new URL(resourceUrl.trim());
        if (
          parsed.protocol !== "https:" &&
          parsed.protocol !== "http:"
        ) {
          throw new Error();
        }
      } catch {
        setError("PDF या resource का valid URL डालें (https://...).");
        return;
      }
    }

    setSaving(true);

    const payload = {
      name: name.trim(),
      description: description.trim(),
      resource_url: resourceUrl.trim() || null,
    };

    const result = editingId
      ? await supabase
          .from("granths")
          .update(payload)
          .eq("id", editingId)
      : await supabase.from("granths").insert(payload);

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setNotice(
      editingId ? "ग्रंथ अपडेट हो गया।" : "नया ग्रंथ जोड़ दिया गया।"
    );

    resetForm();
    await loadGranths();
  }

  function startEdit(item: Granth) {
    setEditingId(item.id);
    setName(item.name);
    setDescription(item.description || "");
    setResourceUrl(item.resource_url || "");
    setError("");
    setNotice("");

    document
      .getElementById("granth-editor")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function toggleArchive(item: Granth) {
    const action = item.is_active ? "archive" : "restore";

    if (
      !window.confirm(
        `इस ग्रंथ को ${item.is_active ? "archive" : "restore"} करना है?`
      )
    ) {
      return;
    }

    setError("");
    setNotice("");

    const { error: updateError } = await supabase
      .from("granths")
      .update({ is_active: !item.is_active })
      .eq("id", item.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setNotice(
        action === "archive"
          ? "ग्रंथ archive हो गया।"
          : "ग्रंथ restore हो गया।"
      );

      await loadGranths();
    }
  }

  const visibleItems = items.filter(
    (item) => showArchived || item.is_active
  );

  return (
    <section className="granth-manager">
      <style>{`
        .granth-manager{margin:22px 0 30px;padding:22px;border:1px solid #eadfc9;border-radius:18px;background:#fffdf8}
        .granth-manager h2{margin:0 0 6px;color:#50351e;font-size:22px}
        .granth-sub{margin:0 0 18px;color:#786b5b;font-size:14px}
        .granth-form{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
        .granth-form label{display:flex;flex-direction:column;gap:6px;color:#5d4934;font-size:13px;font-weight:600}
        .granth-form input,.granth-form textarea{width:100%;box-sizing:border-box;border:1px solid #dfd3bf;border-radius:10px;padding:11px 12px;background:#fff;font:inherit;color:#33291f}
        .granth-form textarea{min-height:76px;resize:vertical}
        .granth-wide{grid-column:1/-1}
        .granth-actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap}
        .granth-primary,.granth-secondary,.granth-small{border:0;border-radius:9px;padding:10px 15px;cursor:pointer;font-weight:600}
        .granth-primary{background:#a65e20;color:white}.granth-secondary{background:#eee6d9;color:#60462d}
        .granth-small{padding:7px 10px;background:#f1e8da;color:#684522;font-size:12px}
        .granth-list{display:grid;gap:10px}
        .granth-row{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:14px;border:1px solid #eee4d5;border-radius:12px;background:#fff}
        .granth-row h3{margin:0 0 5px;font-size:16px;color:#4c3826}.granth-row p{margin:0;color:#766958;font-size:13px;white-space:pre-wrap}
        .granth-row a{display:inline-block;margin-top:7px;color:#9b571f;font-size:13px}
        .granth-row-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}
        .granth-muted{color:#817666;font-size:13px}.granth-alert{margin:10px 0;padding:10px 12px;border-radius:9px;font-size:13px;background:#f9e9e4;color:#8a3425}
        .granth-success{margin:10px 0;padding:10px 12px;border-radius:9px;font-size:13px;background:#edf5e9;color:#426b35}
        .granth-toolbar{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:14px 0}
        @media(max-width:650px){.granth-form{grid-template-columns:1fr}.granth-wide{grid-column:auto}.granth-row{align-items:flex-start;flex-direction:column}.granth-row-actions{justify-content:flex-start}}
      `}</style>

      <h2>▤ ग्रंथ प्रबंधन (Granth Management)</h2>
      <p className="granth-sub">
        नए जैन ग्रंथ जोड़ें, विवरण बदलें या archive/restore करें।
      </p>

      <form
        id="granth-editor"
        className="granth-form"
        onSubmit={saveGranth}
      >
        <label>
          ग्रंथ का नाम *
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="जैसे: परमात्मप्रकाश"
            required
          />
        </label>

        <label>
          PDF / external link
          <input
            value={resourceUrl}
            onChange={(e) => setResourceUrl(e.target.value)}
            placeholder="https://..."
            type="url"
          />
        </label>

        <label className="granth-wide">
          विवरण (Description)
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="ग्रंथ के बारे में छोटा सा विवरण..."
          />
        </label>

        <div className="granth-wide granth-actions">
          <button
            className="granth-primary"
            type="submit"
            disabled={saving}
          >
            {saving
              ? "सहेज रहा है..."
              : editingId
                ? "ग्रंथ अपडेट करें"
                : "ग्रंथ जोड़ें"}
          </button>

          {editingId && (
            <button
              className="granth-secondary"
              type="button"
              onClick={resetForm}
            >
              रद्द करें
            </button>
          )}
        </div>
      </form>

      {error && <div className="granth-alert">{error}</div>}
      {notice && <div className="granth-success">{notice}</div>}

      <div className="granth-toolbar">
        <b>सहेजे गए ग्रंथ ({visibleItems.length})</b>

        <label className="granth-muted">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />{" "}
          Archived दिखाएं
        </label>
      </div>

      {loading ? (
        <p className="granth-muted">ग्रंथ लोड हो रहे हैं...</p>
      ) : visibleItems.length === 0 ? (
        <p className="granth-muted">अभी कोई ग्रंथ नहीं जोड़ा गया।</p>
      ) : (
        <div className="granth-list">
          {visibleItems.map((item) => (
            <article className="granth-row" key={item.id}>
              <div>
                <h3>
                  {item.name} {!item.is_active && <small>(Archived)</small>}
                </h3>

                {item.description && <p>{item.description}</p>}

                {item.resource_url && (
                  <a
                    href={item.resource_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    PDF / संसाधन खोलें ↗
                  </a>
                )}
              </div>

              <div className="granth-row-actions">
                <button
                  className="granth-small"
                  onClick={() => startEdit(item)}
                >
                  संपादित करें
                </button>

                <button
                  className="granth-small"
                  onClick={() => void toggleArchive(item)}
                >
                  {item.is_active ? "Archive" : "Restore"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function GranthLibrary() {
  const [items, setItems] = useState<Granth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    supabase
      .from("granths")
      .select("id, name, description, resource_url, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data, error: loadError }) => {
        if (!alive) return;

        if (loadError) setError(loadError.message);
        else setItems((data || []) as Granth[]);

        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="granth-manager">
      <h2>▤ ग्रंथालय (Granth Library)</h2>

      {loading ? (
        <p className="granth-muted">ग्रंथ लोड हो रहे हैं...</p>
      ) : error ? (
        <div className="granth-alert">{error}</div>
      ) : items.length === 0 ? (
        <p className="granth-muted">अभी कोई ग्रंथ उपलब्ध नहीं है।</p>
      ) : (
        <div className="granth-list">
          {items.map((item) => (
            <article className="granth-row" key={item.id}>
              <div>
                <h3>{item.name}</h3>

                {item.description && <p>{item.description}</p>}

                {item.resource_url && (
                  <a
                    href={item.resource_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    PDF / ग्रंथ खोलें ↗
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function AuthPage({
  screen,
  setScreen,
  lang,
  setLang,
}: {
  screen: AuthScreen;
  setScreen: (s: AuthScreen) => void;
  lang: "en" | "hi";
  setLang: (l: "en" | "hi") => void;
}) {
  const hindi = lang === "hi";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const heading =
    screen === "register"
      ? hindi
        ? "नया सदस्य बनें"
        : "Create your account"
      : screen === "forgot"
        ? hindi
          ? "पासवर्ड रीसेट करें"
          : "Reset your password"
        : hindi
          ? "स्वाध्याय परिवार में आपका स्वागत है"
          : "Welcome back";

  const submitLabel = busy
    ? hindi
      ? "कृपया प्रतीक्षा करें..."
      : "Please wait..."
    : screen === "register"
      ? hindi
        ? "रजिस्टर करें"
        : "Create account"
      : screen === "forgot"
        ? hindi
          ? "रीसेट लिंक भेजें"
          : "Send reset link"
        : hindi
          ? "लॉगिन करें"
          : "Sign in";

  async function handleSubmit() {
    setError("");
    setMessage("");

    if (
      !email.trim() ||
      (screen !== "forgot" && !password) ||
      (screen === "register" && !name.trim())
    ) {
      setError(
        hindi
          ? "कृपया सभी जरूरी जानकारी भरें।"
          : "Please fill in all required fields."
      );
      return;
    }

    if (screen !== "forgot" && password.length < 6) {
      setError(
        hindi
          ? "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।"
          : "Password must be at least 6 characters."
      );
      return;
    }

    setBusy(true);

    try {
      if (screen === "register") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
          },
        });

        if (authError) throw authError;

        if (data.session) {
          setMessage(
            hindi
              ? "अकाउंट बन गया और आप लॉगिन हो गए हैं।"
              : "Account created and signed in successfully."
          );
        } else {
          setMessage(
            hindi
              ? "रजिस्ट्रेशन सफल! ईमेल में confirmation link खोलें, फिर लॉगिन करें।"
              : "Registration successful! Check your email for the confirmation link, then sign in."
          );
          setScreen("login");
        }
      } else if (screen === "forgot") {
        const { error: resetError } =
          await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: window.location.origin,
          });

        if (resetError) throw resetError;

        setMessage(
          hindi
            ? "यदि यह ईमेल registered है, तो reset link भेज दिया गया है।"
            : "If this email is registered, a password reset link has been sent."
        );
      } else {
        const { error: loginError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (loginError) throw loginError;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-art">
  <img
    src="/jainvaani-auth-banner.png"
    alt="JainVaani Swadhyay by Navin Jain"
    className="auth-banner-image"
  />
</div>
      <div className="auth-panel">
        <div className="auth-top">
          <span>JainVaani</span>

          <button
            className="language-btn"
            onClick={() => setLang(hindi ? "en" : "hi")}
          >
            {hindi ? "English" : "हिन्दी"}
          </button>
        </div>

        <div className="auth-card">
          <div className="auth-symbol">ज</div>

          <span className="eyebrow">
            {hindi ? "जय जिनेन्द्र" : "JAI JINENDRA"}
          </span>

          <h2>{heading}</h2>

          <p className="auth-intro">
            {hindi
              ? "आगे बढ़ने के लिए अपनी जानकारी दर्ज करें।"
              : "Enter your details to continue to your learning space."}
          </p>

          {screen === "register" && (
            <label>
              {hindi ? "पूरा नाम" : "Full name"}
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={hindi ? "अपना नाम लिखें" : "Your name"}
                autoComplete="name"
              />
            </label>
          )}

          <label>
            {hindi ? "ईमेल" : "Email address"}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
            />
          </label>

          {screen !== "forgot" && (
            <label>
              {hindi ? "पासवर्ड" : "Password"}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete={
                  screen === "login"
                    ? "current-password"
                    : "new-password"
                }
              />
            </label>
          )}

          {screen === "login" && (
            <button
              className="forgot-link"
              onClick={() => {
                setError("");
                setMessage("");
                setScreen("forgot");
              }}
            >
              {hindi ? "पासवर्ड भूल गए?" : "Forgot password?"}
            </button>
          )}

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          {message && (
            <div className="auth-message" role="status">
              {message}
            </div>
          )}

          <button
            className="auth-submit"
            disabled={busy}
            onClick={handleSubmit}
          >
            {submitLabel}
          </button>

          <div className="auth-switch">
            {screen === "login" ? (
              <>
                {hindi ? "नए सदस्य हैं?" : "New here?"}{" "}
                <button
                  onClick={() => {
                    setError("");
                    setMessage("");
                    setScreen("register");
                  }}
                >
                  {hindi ? "रजिस्टर करें" : "Create account"}
                </button>
              </>
            ) : (
              <>
                {hindi
                  ? "पहले से अकाउंट है?"
                  : "Already have an account?"}{" "}
                <button
                  onClick={() => {
                    setError("");
                    setMessage("");
                    setScreen("login");
                  }}
                >
                  {hindi ? "लॉगिन करें" : "Sign in"}
                </button>
              </>
            )}
          </div>

          <div className="auth-admin-note">
            {hindi
              ? "एडमिन अकाउंट केवल अधिकृत प्रशासकों के लिए है।"
              : "Administrator access is reserved for authorized admins."}
          </div>
        </div>

        <div className="auth-bottom">
          © 2026 JainVaani ·{" "}
          {hindi ? "सभी अधिकार सुरक्षित" : "All rights reserved"}
        </div>
      </div>
    </div>
  );
}


function SectionPage({
  eyebrow,
  title,
  desc,
  children,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>
      {children}
    </>
  );
}