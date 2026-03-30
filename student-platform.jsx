import { useState, useEffect, useRef } from "react";

// ── Persistent storage helpers ──────────────────────────────────────────────
const STORAGE_KEYS = { USERS: "sp_users", PROJECTS: "sp_projects", SESSION: "sp_session" };

async function loadData(key) {
  try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; }
  catch { return null; }
}
async function saveData(key, val) {
  try { await window.storage.set(key, JSON.stringify(val)); } catch {}
}

// ── Tiny utilities ───────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();
const fmtDate = (iso) => new Date(iso).toLocaleDateString("sr-Latn", { day: "2-digit", month: "short", year: "numeric" });
const fmtSize = (b) => b > 1e6 ? `${(b/1e6).toFixed(1)} MB` : b > 1e3 ? `${(b/1e3).toFixed(0)} KB` : `${b} B`;

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

// ── Global styles injection ──────────────────────────────────────────────────
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
    @keyframes scanline{0%{top:-60px}100%{top:100%}}
    .fade-up{animation:fadeUp .45s cubic-bezier(.22,1,.36,1) both}
    .fade-in{animation:fadeIn .3s ease both}
    input,textarea,select{font-family:inherit}
    button{cursor:pointer;font-family:inherit}
  `;
  document.head.appendChild(s);
};

// ── Reusable components ──────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant = "primary", size = "md", disabled, style = {} }) => {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 8, border: "none",
    borderRadius: 6, fontWeight: 600, letterSpacing: ".03em", transition: "all .18s",
    cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? .5 : 1,
    fontSize: size === "sm" ? 12 : size === "lg" ? 15 : 13,
    padding: size === "sm" ? "6px 14px" : size === "lg" ? "13px 28px" : "9px 20px",
  };
  const variants = {
    primary: { background: G.accent, color: "#fff", boxShadow: `0 0 20px ${G.accentGlow}` },
    ghost: { background: "transparent", color: G.textDim, border: `1px solid ${G.border}` },
    danger: { background: G.red, color: "#fff" },
    success: { background: G.green, color: "#fff" },
  };
  const hoverStyle = variant === "primary"
    ? { filter: "brightness(1.15)" }
    : variant === "ghost"
    ? { borderColor: G.accent, color: G.accent }
    : {};
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ ...base, ...variants[variant], ...(hov && hoverStyle), ...style }}
    >{children}</button>
  );
};

const Input = ({ label, type = "text", value, onChange, placeholder, error, style = {} }) => (
  <div style={{ marginBottom: 18 }}>
    {label && <div style={{ fontSize: 11, fontFamily: G.font, color: G.textMuted, marginBottom: 6, letterSpacing: ".08em", textTransform: "uppercase" }}>{label}</div>}
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{
        width: "100%", background: G.surface, border: `1px solid ${error ? G.red : G.border}`,
        borderRadius: 6, padding: "10px 14px", color: G.text, fontSize: 14, outline: "none",
        transition: "border-color .18s", fontFamily: "inherit", ...style,
      }}
      onFocus={e => e.target.style.borderColor = error ? G.red : G.accent}
      onBlur={e => e.target.style.borderColor = error ? G.red : G.border}
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

const Spinner = () => (
  <div style={{
    width: 20, height: 20, border: `2px solid ${G.border}`, borderTopColor: G.accent,
    borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block",
  }} />
);

// ── Auth Screen ──────────────────────────────────────────────────────────────
const AuthScreen = ({ onLogin, users, setUsers }) => {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [err, setErr] = useState({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

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
    await new Promise(r => setTimeout(r, 600));

    if (tab === "login") {
      const u = users.find(u => u.email === form.email && u.password === form.password);
      if (!u) { setErr({ email: "Pogrešan email ili lozinka" }); setLoading(false); return; }
      onLogin(u);
    } else {
      if (users.find(u => u.email === form.email)) {
        setErr({ email: "Email već postoji" }); setLoading(false); return;
      }
      const newUser = {
        id: uid(), name: form.name.trim(), email: form.email,
        password: form.password, folder: `/${form.name.toLowerCase().replace(/\s+/g, "_")}_${uid().slice(0,4)}`,
        createdAt: now(), avatar: form.name.slice(0, 2).toUpperCase(),
      };
      const updated = [...users, newUser];
      setUsers(updated);
      await saveData(STORAGE_KEYS.USERS, updated);
      setMsg(`Nalog kreiran! Vaš folder: ${newUser.folder}`);
      setTimeout(() => { setTab("login"); setMsg(""); setForm({ ...form, name: "", confirm: "" }); }, 2200);
    }
    setLoading(false);
  };

  const f = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: `radial-gradient(ellipse 80% 60% at 50% -10%, ${G.accentDim}, transparent), ${G.bg}`,
      padding: 20,
    }}>
      {/* Decorative grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", opacity: .04,
        backgroundImage: `linear-gradient(${G.accent} 1px, transparent 1px), linear-gradient(90deg, ${G.accent} 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }} />

      <div className="fade-up" style={{
        background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16,
        padding: "40px 44px", width: "100%", maxWidth: 420,
        boxShadow: `0 30px 80px rgba(0,0,0,.5), 0 0 0 1px ${G.border}`,
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12, background: G.accentDim,
            border: `1px solid ${G.accent}44`, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 24, margin: "0 auto 16px",
          }}>🎓</div>
          <div style={{ fontFamily: G.font, fontSize: 11, color: G.textMuted, letterSpacing: ".14em", textTransform: "uppercase" }}>STUDENT</div>
          <div style={{ fontFamily: G.fontSans, fontSize: 22, fontWeight: 700, color: G.text, letterSpacing: "-.02em" }}>ProjectHub</div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderRadius: 8, background: G.bg, padding: 3, marginBottom: 28, border: `1px solid ${G.border}` }}>
          {["login", "register"].map(t => (
            <button key={t} onClick={() => { setTab(t); setErr({}); setMsg(""); }}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 6, border: "none",
                background: tab === t ? G.surfaceHi : "transparent",
                color: tab === t ? G.text : G.textMuted,
                fontSize: 13, fontWeight: 600, transition: "all .18s", cursor: "pointer",
                boxShadow: tab === t ? `0 1px 3px rgba(0,0,0,.4)` : "none",
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
const UploadModal = ({ user, onClose, onUpload }) => {
  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [tags, setTags] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef();

  const addFiles = (fl) => {
    const arr = Array.from(fl).map(f => ({ file: f, id: uid(), name: f.name, size: f.size }));
    setFiles(p => [...p, ...arr]);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const submit = async () => {
    if (!title.trim() || files.length === 0) return;
    setUploading(true);
    for (let i = 1; i <= 100; i++) {
      await new Promise(r => setTimeout(r, 18));
      setProgress(i);
    }
    const project = {
      id: uid(), userId: user.id, userName: user.name, userFolder: user.folder,
      title: title.trim(), description: desc.trim(),
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      files: files.map(f => ({ id: f.id, name: f.name, size: f.size, icon: extIcon(f.name) })),
      totalSize: files.reduce((s, f) => s + f.size, 0),
      uploadedAt: now(), path: `${user.folder}/${title.trim().replace(/\s+/g, "_").toLowerCase()}`,
    };
    onUpload(project);
    setUploading(false);
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20,
    }} onClick={onClose}>
      <div className="fade-up" onClick={e => e.stopPropagation()} style={{
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
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Kratki opis projekta..."
            style={{
              width: "100%", background: G.bg, border: `1px solid ${G.border}`, borderRadius: 6,
              padding: "10px 14px", color: G.text, fontSize: 14, outline: "none", resize: "vertical",
              minHeight: 80, fontFamily: "inherit",
            }}
            onFocus={e => e.target.style.borderColor = G.accent}
            onBlur={e => e.target.style.borderColor = G.border}
          />
        </div>

        <Input label="Tagovi (odvojeni zarezom)" value={tags} onChange={setTags} placeholder="python, machine-learning, AI" />

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current.click()}
          style={{
            border: `2px dashed ${dragging ? G.accent : G.border}`, borderRadius: 10,
            padding: "28px 20px", textAlign: "center", cursor: "pointer", transition: "all .2s",
            background: dragging ? G.accentGlow : "transparent", marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
          <div style={{ fontSize: 14, color: G.textDim }}>Prevucite fajlove ovde ili <span style={{ color: G.accent }}>kliknite za izbor</span></div>
          <input ref={fileRef} type="file" multiple style={{ display: "none" }} onChange={e => addFiles(e.target.files)} />
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
                <button onClick={() => setFiles(p => p.filter(x => x.id !== f.id))}
                  style={{ background: "none", border: "none", color: G.textMuted, cursor: "pointer", fontSize: 16 }}>×</button>
              </div>
            ))}
            <div style={{ padding: "8px 14px", fontSize: 11, color: G.textMuted, borderTop: `1px solid ${G.border}`, fontFamily: G.font }}>
              {files.length} fajl{files.length !== 1 ? "ova" : ""} · {fmtSize(files.reduce((s, f) => s + f.size, 0))} ukupno
            </div>
          </div>
        )}

        {uploading && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: G.textMuted, marginBottom: 6, fontFamily: G.font }}>
              <span>Upload u toku...</span><span>{progress}%</span>
            </div>
            <div style={{ height: 4, background: G.border, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: G.accent, transition: "width .05s", borderRadius: 2 }} />
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={onClose}>Otkaži</Btn>
          <Btn onClick={submit} disabled={uploading || !title.trim() || files.length === 0}>
            {uploading ? <><Spinner /> Uploading...</> : "⬆ Upload projekat"}
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
        background: hov ? G.surfaceHi : G.surface,
        border: `1px solid ${hov ? G.borderHi : G.border}`,
        borderRadius: 12, padding: "20px 22px", transition: "all .22s",
        transform: hov ? "translateY(-2px)" : "none",
        boxShadow: hov ? `0 12px 40px rgba(0,0,0,.35)` : "none",
        animationDelay: `${delay}ms`, position: "relative",
      }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: G.text, marginBottom: 4, lineHeight: 1.3 }}>{project.title}</div>
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
            onMouseEnter={e => { e.currentTarget.style.background = G.redDim; e.currentTarget.style.color = G.red; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = G.textMuted; }}
          >🗑</button>
        )}
      </div>

      {project.description && (
        <div style={{ fontSize: 13, color: G.textDim, marginBottom: 12, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {project.description}
        </div>
      )}

      {/* Tags */}
      {project.tags?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {project.tags.map(t => <Tag key={t}>{t}</Tag>)}
        </div>
      )}

      {/* Files preview */}
      <div style={{
        background: G.bg, borderRadius: 8, border: `1px solid ${G.border}`,
        padding: "8px 12px", marginBottom: 14,
      }}>
        {project.files.slice(0, 3).map((f, i) => (
          <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: i < Math.min(project.files.length, 3) - 1 ? `1px solid ${G.border}` : "none" }}>
            <span style={{ fontSize: 14 }}>{f.icon}</span>
            <span style={{ fontSize: 12, color: G.textDim, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: G.font }}>{f.name}</span>
            <span style={{ fontSize: 11, color: G.textMuted }}>{fmtSize(f.size)}</span>
          </div>
        ))}
        {project.files.length > 3 && (
          <div style={{ fontSize: 11, color: G.textMuted, paddingTop: 4, fontFamily: G.font }}>+{project.files.length - 3} više fajlova</div>
        )}
      </div>

      {/* Footer */}
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

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = ({ user, users, projects, setProjects, onLogout }) => {
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const handleUpload = async (project) => {
    const updated = [project, ...projects];
    setProjects(updated);
    await saveData(STORAGE_KEYS.PROJECTS, updated);
  };

  const handleDelete = async (id) => {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    await saveData(STORAGE_KEYS.PROJECTS, updated);
  };

  const filtered = projects
    .filter(p => filter === "mine" ? p.userId === user.id : true)
    .filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.userName.toLowerCase().includes(search.toLowerCase()) ||
      p.tags?.some(t => t.toLowerCase().includes(search.toLowerCase())));

  const myCount = projects.filter(p => p.userId === user.id).length;

  return (
    <div style={{ minHeight: "100vh", background: G.bg }}>
      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: 60, background: G.surface,
        borderBottom: `1px solid ${G.border}`, position: "sticky", top: 0, zIndex: 50,
        backdropFilter: "blur(10px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🎓</span>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-.01em" }}>ProjectHub</span>
          <span style={{ fontFamily: G.font, fontSize: 11, color: G.textMuted, marginLeft: 4 }}>beta</span>
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
        {/* Stats bar */}
        <div className="fade-up" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 32 }}>
          {[
            { label: "Ukupno projekata", val: projects.length, icon: "📊", color: G.accent },
            { label: "Moji projekti", val: myCount, icon: "📁", color: G.green },
            { label: "Studenti", val: users.length, icon: "👥", color: G.yellow },
            { label: "Moj folder", val: user.folder, icon: "🗂", color: G.accent, mono: true },
          ].map(s => (
            <div key={s.label} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: s.mono ? 11 : 22, fontWeight: 700, color: s.color, fontFamily: s.mono ? G.font : "inherit", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.val}</div>
              <div style={{ fontSize: 11, color: G.textMuted, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="fade-up" style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", animationDelay: "80ms" }}>
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: G.textMuted, fontSize: 14 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pretraga projekata, studenata, tagova..."
              style={{
                width: "100%", background: G.surface, border: `1px solid ${G.border}`, borderRadius: 8,
                padding: "10px 14px 10px 36px", color: G.text, fontSize: 13, outline: "none",
                fontFamily: "inherit", transition: "border-color .18s",
              }}
              onFocus={e => e.target.style.borderColor = G.accent}
              onBlur={e => e.target.style.borderColor = G.border}
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

        {/* Sort info */}
        <div style={{ fontFamily: G.font, fontSize: 11, color: G.textMuted, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: G.green, display: "inline-block", animation: "pulse 2s infinite" }} />
          {filtered.length} projekat{filtered.length !== 1 ? "a" : ""} · sortirano po datumu uploada
          {search && <span> · filtriran{filtered.length !== 1 ? "o" : ""} za "<span style={{ color: G.accent }}>{search}</span>"</span>}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
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

      {showUpload && <UploadModal user={user} onClose={() => setShowUpload(false)} onUpload={handleUpload} />}
    </div>
  );
};

// ── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    injectStyles();
    (async () => {
      const [u, p, s] = await Promise.all([
        loadData(STORAGE_KEYS.USERS),
        loadData(STORAGE_KEYS.PROJECTS),
        loadData(STORAGE_KEYS.SESSION),
      ]);
      const loadedUsers = u || [];
      const loadedProjects = p || [];
      setUsers(loadedUsers);
      setProjects(loadedProjects);
      if (s) {
        const activeUser = loadedUsers.find(x => x.id === s.userId);
        if (activeUser) setSession(activeUser);
      }
      setReady(true);
    })();
  }, []);

  const handleLogin = async (user) => {
    setSession(user);
    await saveData(STORAGE_KEYS.SESSION, { userId: user.id });
  };

  const handleLogout = async () => {
    setSession(null);
    await saveData(STORAGE_KEYS.SESSION, null);
  };

  if (!ready) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: G.bg }}>
      <div style={{ textAlign: "center" }}>
        <Spinner />
        <div style={{ marginTop: 14, fontSize: 13, color: G.textMuted, fontFamily: G.font }}>učitavanje...</div>
      </div>
    </div>
  );

  if (!session) return (
    <AuthScreen onLogin={handleLogin} users={users} setUsers={setUsers} />
  );

  return (
    <Dashboard
      user={session} users={users} projects={projects}
      setProjects={setProjects} onLogout={handleLogout}
    />
  );
}
