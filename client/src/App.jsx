import { useState, useEffect, useRef } from "react";

// ── API ──────────────────────────────────────────────────────────────────────
const API = "http://localhost:3001/api";

async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(API + path, {
    ...opts,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Greška servera");
  return data;
}

// ── Tiny utilities ───────────────────────────────────────────────────────────
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("sr-Latn", { day: "2-digit", month: "short", year: "numeric" });
const fmtSize = (b) =>
  b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : b > 1e3 ? `${(b / 1e3).toFixed(0)} KB` : `${b} B`;

const EXT_ICONS = {
  pdf: "📄", zip: "📦", rar: "📦", py: "🐍", js: "🟨", ts: "🔷",
  html: "🌐", css: "🎨", jpg: "🖼", jpeg: "🖼", png: "🖼", gif: "🖼",
  mp4: "🎬", mp3: "🎵", doc: "📝", docx: "📝", xlsx: "📊", pptx: "📊",
  default: "📁",
};
const extIcon = (name) => {
  const ext = (name || "").split(".").pop().toLowerCase();
  return EXT_ICONS[ext] || EXT_ICONS.default;
};

// ── Design tokens ────────────────────────────────────────────────────────────
const G = {
  bg: "#0a0b0f",
  surface: "#111318",
  surfaceHi: "#181c24",
  border: "#1e2330",
  borderHi: "#2e3650",
  accent: "#4f8ef7",
  accentDim: "#1a2d55",
  accentGlow: "rgba(79,142,247,0.18)",
  green: "#22c55e",
  greenDim: "#0d3320",
  red: "#ef4444",
  redDim: "#3a1010",
  yellow: "#f59e0b",
  text: "#e2e8f0",
  textMuted: "#64748b",
  textDim: "#94a3b8",
  font: "'DM Mono', 'Fira Mono', 'Courier New', monospace",
  fontSans: "'DM Sans', 'Segoe UI', sans-serif",
};

// ── Global styles ────────────────────────────────────────────────────────────
const injectStyles = () => {
  if (document.getElementById("sp-styles")) return;
  const s = document.createElement("style");
  s.id = "sp-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:${G.bg};color:${G.text};font-family:${G.fontSans};overflow-x:hidden}
    ::-webkit-scrollbar{width:6px}
    ::-webkit-scrollbar-track{background:${G.bg}}
    ::-webkit-scrollbar-thumb{background:${G.border};border-radius:3px}
    ::-webkit-scrollbar-thumb:hover{background:${G.borderHi}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
    .fade-up{animation:fadeUp .45s cubic-bezier(.22,1,.36,1) both}
    .fade-in{animation:fadeIn .3s ease both}
    input,textarea,select{font-family:inherit}
    button{cursor:pointer;font-family:inherit}
  `;
  document.head.appendChild(s);
};

// ── Reusable UI ──────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant = "primary", size = "md", disabled, style = {} }) => {
  const [hov, setHov] = useState(false);
  const base = {
    display: "inline-flex", alignItems: "center", gap: 8, border: "none",
    borderRadius: 6, fontWeight: 600, letterSpacing: ".03em", transition: "all .18s",
    cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
    fontSize: size === "sm" ? 12 : size === "lg" ? 15 : 13,
    padding: size === "sm" ? "6px 14px" : size === "lg" ? "13px 28px" : "9px 20px",
  };
  const variants = {
    primary: { background: G.accent, color: "#fff", boxShadow: `0 0 20px ${G.accentGlow}` },
    ghost: { background: "transparent", color: G.textDim, border: `1px solid ${G.border}` },
    danger: { background: G.red, color: "#fff" },
  };
  const hoverStyle =
    variant === "primary" ? { filter: "brightness(1.15)" } :
    variant === "ghost" ? { borderColor: G.accent, color: G.accent } : {};
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ ...base, ...variants[variant], ...(hov ? hoverStyle : {}), ...style }}
    >{children}</button>
  );
};

const Input = ({ label, type = "text", value, onChange, placeholder, error, style = {} }) => (
  <div style={{ marginBottom: 18 }}>
    {label && (
      <div style={{ fontSize: 11, fontFamily: G.font, color: G.textMuted, marginBottom: 6, letterSpacing: ".08em", textTransform: "uppercase" }}>
        {label}
      </div>
    )}
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{
        width: "100%", background: G.surface, border: `1px solid ${error ? G.red : G.border}`,
        borderRadius: 6, padding: "10px 14px", color: G.text, fontSize: 14, outline: "none",
        transition: "border-color .18s", fontFamily: "inherit", ...style,
      }}
      onFocus={(e) => (e.target.style.borderColor = error ? G.red : G.accent)}
      onBlur={(e) => (e.target.style.borderColor = error ? G.red : G.border)}
    />
    {error && <div style={{ color: G.red, fontSize: 11, marginTop: 4 }}>{error}</div>}
  </div>
);

const Tag = ({ children, color = G.accent }) => (
  <span style={{
    display: "inline-block", padding: "2px 8px", borderRadius: 4,
    fontSize: 11, fontFamily: G.font, fontWeight: 500,
    background: color + "22", color, border: `1px solid ${color}44`,
  }}>{children}</span>
);

const Spinner = ({ size = 20 }) => (
  <div style={{
    width: size, height: size, border: `2px solid ${G.border}`, borderTopColor: G.accent,
    borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block", flexShrink: 0,
  }} />
);

// ── Auth Screen ──────────────────────────────────────────────────────────────
const AuthScreen = ({ onLogin }) => {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [err, setErr] = useState({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.email.includes("@")) e.email = "Unesite validan email";
    if (form.password.length < 6) e.password = "Minimalno 6 karaktera";
    if (tab === "register") {
      if (!form.name.trim()) e.name = "Ime je obavezno";
      if (form.password !== form.confirm) e.confirm = "Lozinke se ne poklapaju";
    }
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErr(e); return; }
    setErr({}); setLoading(true);
    try {
      const data = await apiFetch(tab === "login" ? "/login" : "/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      localStorage.setItem("token", data.token);
      if (tab === "register") {
        setMsg(`Nalog kreiran! Vaš folder: ${data.user.folder}`);
        setTimeout(() => { setTab("login"); setMsg(""); setForm({ name: "", email: "", password: "", confirm: "" }); }, 2200);
      } else {
        onLogin(data.user);
      }
    } catch (ex) {
      setErr({ email: ex.message });
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: `radial-gradient(ellipse 80% 60% at 50% -10%, ${G.accentDim}, transparent), ${G.bg}`,
      padding: 20,
    }}>
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", opacity: 0.04,
        backgroundImage: `linear-gradient(${G.accent} 1px,transparent 1px),linear-gradient(90deg,${G.accent} 1px,transparent 1px)`,
        backgroundSize: "60px 60px",
      }} />
      <div className="fade-up" style={{
        background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16,
        padding: "40px 44px", width: "100%", maxWidth: 420,
        boxShadow: `0 30px 80px rgba(0,0,0,.5)`,
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12, background: G.accentDim,
            border: `1px solid ${G.accent}44`, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 24, margin: "0 auto 16px",
          }}>🎓</div>
          <div style={{ fontFamily: G.font, fontSize: 11, color: G.textMuted, letterSpacing: ".14em", textTransform: "uppercase" }}>STUDENT</div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em" }}>ProjectHub</div>
        </div>

        <div style={{ display: "flex", borderRadius: 8, background: G.bg, padding: 3, marginBottom: 28, border: `1px solid ${G.border}` }}>
          {["login", "register"].map((t) => (
            <button key={t} onClick={() => { setTab(t); setErr({}); setMsg(""); }}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 6, border: "none",
                background: tab === t ? G.surfaceHi : "transparent",
                color: tab === t ? G.text : G.textMuted,
                fontSize: 13, fontWeight: 600, transition: "all .18s", cursor: "pointer",
              }}>
              {t === "login" ? "Prijava" : "Registracija"}
            </button>
          ))}
        </div>

        {msg && (
          <div style={{
            background: G.greenDim, border: `1px solid ${G.green}44`, borderRadius: 8,
            padding: "10px 14px", color: G.green, fontSize: 13, marginBottom: 20, fontFamily: G.font,
          }}>✓ {msg}</div>
        )}

        {tab === "register" && <Input label="Ime i prezime" value={form.name} onChange={f("name")} placeholder="Marko Marković" error={err.name} />}
        <Input label="Email" type="email" value={form.email} onChange={f("email")} placeholder="student@uni.rs" error={err.email} />
        <Input label="Lozinka" type="password" value={form.password} onChange={f("password")} placeholder="••••••••" error={err.password} />
        {tab === "register" && <Input label="Potvrdi lozinku" type="password" value={form.confirm} onChange={f("confirm")} placeholder="••••••••" error={err.confirm} />}

        <Btn onClick={submit} size="lg" disabled={loading} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
          {loading ? <Spinner /> : tab === "login" ? "Prijavi se →" : "Kreiraj nalog →"}
        </Btn>
      </div>
    </div>
  );
};

// ── Upload Modal ─────────────────────────────────────────────────────────────
const UploadModal = ({ user, onClose, onUploaded }) => {
  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [tags, setTags] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const addFiles = (fl) => {
    const arr = Array.from(fl).map((f) => ({ file: f, id: Math.random().toString(36).slice(2), name: f.name, size: f.size }));
    setFiles((p) => [...p, ...arr]);
  };

  const submit = async () => {
    if (!title.trim() || files.length === 0) return;
    setUploading(true); setError(""); setProgress(0);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", desc.trim());
    formData.append("tags", tags);
    files.forEach((f) => formData.append("files", f.file));

    try {
      // Simulate progress while uploading
      const progressInterval = setInterval(() => setProgress((p) => Math.min(p + 3, 90)), 80);

      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/projects`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      clearInterval(progressInterval);
      setProgress(100);

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setTimeout(() => { onUploaded(data); onClose(); }, 400);
    } catch (ex) {
      setError(ex.message);
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20,
    }} onClick={onClose}>
      <div className="fade-up" onClick={(e) => e.stopPropagation()} style={{
        background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16,
        width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto",
        padding: "32px 36px", boxShadow: "0 40px 100px rgba(0,0,0,.6)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>📤 Upload projekta</div>
            <div style={{ fontSize: 12, color: G.textMuted, marginTop: 3, fontFamily: G.font }}>{user.folder}/</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: G.textMuted, fontSize: 22, cursor: "pointer" }}>×</button>
        </div>

        <Input label="Naziv projekta *" value={title} onChange={setTitle} placeholder="Moj diplomski rad" />
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontFamily: G.font, color: G.textMuted, marginBottom: 6, letterSpacing: ".08em", textTransform: "uppercase" }}>Opis</div>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Kratki opis projekta..."
            style={{
              width: "100%", background: G.bg, border: `1px solid ${G.border}`, borderRadius: 6,
              padding: "10px 14px", color: G.text, fontSize: 14, outline: "none", resize: "vertical",
              minHeight: 80, fontFamily: "inherit",
            }}
            onFocus={(e) => (e.target.style.borderColor = G.accent)}
            onBlur={(e) => (e.target.style.borderColor = G.border)}
          />
        </div>
        <Input label="Tagovi (odvojeni zarezom)" value={tags} onChange={setTags} placeholder="python, machine-learning, AI" />

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
          onClick={() => fileRef.current.click()}
          style={{
            border: `2px dashed ${dragging ? G.accent : G.border}`, borderRadius: 10,
            padding: "28px 20px", textAlign: "center", cursor: "pointer", transition: "all .2s",
            background: dragging ? G.accentGlow : "transparent", marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
          <div style={{ fontSize: 14, color: G.textDim }}>
            Prevucite fajlove ovde ili <span style={{ color: G.accent }}>kliknite za izbor</span>
          </div>
          <input ref={fileRef} type="file" multiple style={{ display: "none" }} onChange={(e) => addFiles(e.target.files)} />
        </div>

        {files.length > 0 && (
          <div style={{ background: G.bg, borderRadius: 8, border: `1px solid ${G.border}`, marginBottom: 20, overflow: "hidden" }}>
            {files.map((f, i) => (
              <div key={f.id} style={{
                display: "flex", alignItems: "center", padding: "10px 14px", gap: 10,
                borderBottom: i < files.length - 1 ? `1px solid ${G.border}` : "none",
              }}>
                <span style={{ fontSize: 18 }}>{extIcon(f.name)}</span>
                <span style={{ flex: 1, fontSize: 13, color: G.textDim, fontFamily: G.font, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                <span style={{ fontSize: 11, color: G.textMuted }}>{fmtSize(f.size)}</span>
                <button onClick={() => setFiles((p) => p.filter((x) => x.id !== f.id))}
                  style={{ background: "none", border: "none", color: G.textMuted, cursor: "pointer", fontSize: 16 }}>×</button>
              </div>
            ))}
            <div style={{ padding: "8px 14px", fontSize: 11, color: G.textMuted, borderTop: `1px solid ${G.border}`, fontFamily: G.font }}>
              {files.length} fajl{files.length !== 1 ? "ova" : ""} · {fmtSize(files.reduce((s, f) => s + f.size, 0))} ukupno
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: G.redDim, border: `1px solid ${G.red}44`, borderRadius: 8, padding: "10px 14px", color: G.red, fontSize: 13, marginBottom: 16 }}>
            ⚠ {error}
          </div>
        )}

        {uploading && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: G.textMuted, marginBottom: 6, fontFamily: G.font }}>
              <span>Upload u toku...</span><span>{progress}%</span>
            </div>
            <div style={{ height: 4, background: G.border, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: G.accent, transition: "width .1s", borderRadius: 2 }} />
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={onClose}>Otkaži</Btn>
          <Btn onClick={submit} disabled={uploading || !title.trim() || files.length === 0}>
            {uploading ? <><Spinner size={16} /> Uploading...</> : "⬆ Upload projekat"}
          </Btn>
        </div>
      </div>
    </div>
  );
};

// ── Project Card ─────────────────────────────────────────────────────────────
const ProjectCard = ({ project, isOwn, onDelete, delay = 0 }) => {
  const [hov, setHov] = useState(false);
  return (
    <div className="fade-up" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? G.surfaceHi : G.surface, border: `1px solid ${hov ? G.borderHi : G.border}`,
        borderRadius: 12, padding: "20px 22px", transition: "all .22s",
        transform: hov ? "translateY(-2px)" : "none",
        boxShadow: hov ? "0 12px 40px rgba(0,0,0,.35)" : "none",
        animationDelay: `${delay}ms`,
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: G.text, marginBottom: 4 }}>{project.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%", background: G.accentDim,
              border: `1px solid ${G.accent}33`, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 9, fontWeight: 700, color: G.accent, fontFamily: G.font,
            }}>{project.userName.slice(0, 2).toUpperCase()}</div>
            <span style={{ fontSize: 12, color: G.textMuted }}>{project.userName}</span>
            {isOwn && <Tag color={G.green}>Moj</Tag>}
          </div>
        </div>
        {isOwn && (
          <button onClick={() => onDelete(project.id)}
            style={{
              background: "none", border: "none", color: G.textMuted, cursor: "pointer",
              fontSize: 15, padding: "2px 6px", borderRadius: 4, transition: "all .15s",
              opacity: hov ? 1 : 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = G.redDim; e.currentTarget.style.color = G.red; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = G.textMuted; }}
          >🗑</button>
        )}
      </div>

      {project.description && (
        <div style={{ fontSize: 13, color: G.textDim, marginBottom: 12, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {project.description}
        </div>
      )}

      {project.tags?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {project.tags.map((t) => <Tag key={t}>{t}</Tag>)}
        </div>
      )}

      <div style={{ background: G.bg, borderRadius: 8, border: `1px solid ${G.border}`, padding: "8px 12px", marginBottom: 14 }}>
        {project.files.slice(0, 3).map((f, i) => (
          <div key={f.id} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "4px 0",
            borderBottom: i < Math.min(project.files.length, 3) - 1 ? `1px solid ${G.border}` : "none",
          }}>
            <span style={{ fontSize: 14 }}>{extIcon(f.name)}</span>
            <a href={`http://localhost:3001${f.url}`} target="_blank" rel="noreferrer"
              style={{ fontSize: 12, color: G.accent, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: G.font, textDecoration: "none" }}
              onClick={(e) => e.stopPropagation()}>
              {f.name}
            </a>
            <span style={{ fontSize: 11, color: G.textMuted }}>{fmtSize(f.size)}</span>
          </div>
        ))}
        {project.files.length > 3 && (
          <div style={{ fontSize: 11, color: G.textMuted, paddingTop: 4, fontFamily: G.font }}>+{project.files.length - 3} više fajlova</div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: G.font, fontSize: 11, color: G.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "55%" }}>
          <span style={{ color: G.accent }}>~/</span>{project.path.replace("/", "")}
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 11, color: G.textMuted, fontFamily: G.font }}>
          <span>📁 {project.files.length}</span>
          <span>⚖ {fmtSize(project.totalSize)}</span>
          <span>{fmtDate(project.uploadedAt)}</span>
        </div>
      </div>
    </div>
  );
};

// ── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = ({ user, onLogout }) => {
  const [projects, setProjects] = useState([]);
  const [userCount, setUserCount] = useState(1);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    try {
      const data = await apiFetch("/projects");
      setProjects(data);
    } catch {}
    setLoading(false);
  };

  const loadUserCount = async () => {
    try {
      const data = await apiFetch("/users/count");
      setUserCount(data.count);
    } catch {}
  };

  useEffect(() => { loadProjects(); loadUserCount(); }, []);

  const handleUploaded = (project) => setProjects((p) => [project, ...p]);

  const handleDelete = async (id) => {
    try {
      await apiFetch(`/projects/${id}`, { method: "DELETE" });
      setProjects((p) => p.filter((x) => x.id !== id));
    } catch (ex) { alert(ex.message); }
  };

  const filtered = projects
    .filter((p) => (filter === "mine" ? p.userId === user.id : true))
    .filter((p) =>
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.userName.toLowerCase().includes(search.toLowerCase()) ||
      p.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    );

  const myCount = projects.filter((p) => p.userId === user.id).length;

  return (
    <div style={{ minHeight: "100vh", background: G.bg }}>
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: 60, background: G.surface,
        borderBottom: `1px solid ${G.border}`, position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🎓</span>
          <span style={{ fontWeight: 700, fontSize: 16 }}>ProjectHub</span>
          <span style={{ fontFamily: G.font, fontSize: 11, color: G.textMuted }}>v1.0</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</div>
            <div style={{ fontFamily: G.font, fontSize: 11, color: G.accent }}>{user.folder}</div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", background: G.accentDim,
            border: `1px solid ${G.accent}55`, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 13, fontWeight: 700, color: G.accent, fontFamily: G.font,
          }}>{user.avatar}</div>
          <Btn variant="ghost" size="sm" onClick={onLogout}>Odjava</Btn>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div className="fade-up" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 32 }}>
          {[
            { label: "Ukupno projekata", val: projects.length, icon: "📊", color: G.accent },
            { label: "Moji projekti", val: myCount, icon: "📁", color: G.green },
            { label: "Studenti", val: userCount, icon: "👥", color: G.yellow },
            { label: "Moj folder", val: user.folder, icon: "🗂", color: G.accent, mono: true },
          ].map((s) => (
            <div key={s.label} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: s.mono ? 11 : 22, fontWeight: 700, color: s.color, fontFamily: s.mono ? G.font : "inherit", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.val}</div>
              <div style={{ fontSize: 11, color: G.textMuted, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="fade-up" style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", animationDelay: "80ms" }}>
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: G.textMuted, fontSize: 14 }}>🔍</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pretraga projekata, studenata, tagova..."
              style={{
                width: "100%", background: G.surface, border: `1px solid ${G.border}`, borderRadius: 8,
                padding: "10px 14px 10px 36px", color: G.text, fontSize: 13, outline: "none",
                fontFamily: "inherit", transition: "border-color .18s",
              }}
              onFocus={(e) => (e.target.style.borderColor = G.accent)}
              onBlur={(e) => (e.target.style.borderColor = G.border)}
            />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[["all", "Svi projekti"], ["mine", "Moji projekti"]].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)}
                style={{
                  padding: "9px 16px", borderRadius: 8, border: `1px solid ${filter === v ? G.accent : G.border}`,
                  background: filter === v ? G.accentDim : G.surface, color: filter === v ? G.accent : G.textMuted,
                  fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all .18s",
                }}>{l}</button>
            ))}
          </div>
          <Btn onClick={() => setShowUpload(true)}>⬆ Upload projekat</Btn>
        </div>

        <div style={{ fontFamily: G.font, fontSize: 11, color: G.textMuted, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: G.green, display: "inline-block", animation: "pulse 2s infinite" }} />
          {filtered.length} projekat{filtered.length !== 1 ? "a" : ""} · sortirano po datumu uploada
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 80 }}><Spinner size={32} /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: G.textMuted }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗂</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: G.textDim, marginBottom: 8 }}>Nema projekata</div>
            <div style={{ fontSize: 13 }}>{search ? "Promenite kriterijume pretrage" : "Budite prvi koji će uploadovati projekat!"}</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {filtered.map((p, i) => (
              <ProjectCard key={p.id} project={p} isOwn={p.userId === user.id} onDelete={handleDelete} delay={i * 40} />
            ))}
          </div>
        )}
      </div>

      {showUpload && <UploadModal user={user} onClose={() => setShowUpload(false)} onUploaded={handleUploaded} />}
    </div>
  );
};

// ── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    injectStyles();
    const token = localStorage.getItem("token");
    if (!token) { setChecking(false); return; }
    apiFetch("/me").then((u) => { setUser(u); setChecking(false); }).catch(() => { localStorage.removeItem("token"); setChecking(false); });
  }, []);

  const handleLogout = () => { localStorage.removeItem("token"); setUser(null); };

  if (checking) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: G.bg }}>
      <div style={{ textAlign: "center" }}>
        <Spinner size={32} />
        <div style={{ marginTop: 14, fontSize: 13, color: G.textMuted, fontFamily: G.font }}>učitavanje...</div>
      </div>
    </div>
  );

  return user
    ? <Dashboard user={user} onLogout={handleLogout} />
    : <AuthScreen onLogin={setUser} />;
}
