/* eslint-disable */
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, LineChart, Line
} from "recharts";

// ─── TURSO CONFIG ───
const TURSO_URL = "https://tai-alismt.aws-eu-west-1.turso.io";
const TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzU1MTA2MjYsImlkIjoiMDE5ZDY0YWQtN2MwMS03MTAwLWJlY2YtOWY3YWM2ZjBjNzRkIiwicmlkIjoiY2VjZjVlYzAtODJiYy00MTgwLTkwYmItZTM4OWViNjdmZWQ2In0.OAcpkuXM9_wcKP9yi2DqdfIF_oO-CQSVX7Mekak6oA3ctNJKcCnP0hCUka9dQAbkjM7kUDY12evKBf19U6rNCA";

// ─── Turso HTTP API helper ───
async function tursoExec(sql, args) {
  try {
    const body = {
      requests: [
        { type: "execute", stmt: { sql, args: args || [] } },
        { type: "close" }
      ]
    };
    const res = await fetch(TURSO_URL + "/v2/pipeline", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + TURSO_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.results && data.results[0] && data.results[0].response) {
      const resp = data.results[0].response;
      if (resp.type === "execute") {
        const cols = resp.result.cols.map(c => c.name);
        const rows = resp.result.rows.map(r => {
          const obj = {};
          r.forEach((cell, i) => { obj[cols[i]] = cell.value; });
          return obj;
        });
        return { ok: true, rows, affected: resp.result.affected_row_count };
      }
    }
    return { ok: true, rows: [], affected: 0 };
  } catch (err) {
    console.error("Turso error:", err);
    return { ok: false, rows: [], affected: 0 };
  }
}

// ─── Seed data (fallback if DB unreachable) ───
const SEED = [
  {"date":"2025-01-02","type":"duo"},{"date":"2025-01-10","type":"duo"},{"date":"2025-01-14","type":"duo"},
  {"date":"2025-01-19","type":"duo"},{"date":"2025-01-23","type":"duo"},{"date":"2025-01-29","type":"duo"},
  {"date":"2025-02-04","type":"duo"},{"date":"2025-02-09","type":"duo"},{"date":"2025-02-13","type":"duo"},
  {"date":"2025-02-20","type":"duo"},{"date":"2025-03-07","type":"duo"},{"date":"2025-03-07","type":"solo"},
  {"date":"2025-03-08","type":"solo"},{"date":"2025-03-15","type":"solo"},{"date":"2025-03-21","type":"duo"},
  {"date":"2025-03-27","type":"solo"},{"date":"2025-04-02","type":"solo"},{"date":"2025-04-02","type":"duo"},
  {"date":"2025-04-05","type":"solo"},{"date":"2025-04-11","type":"solo"},{"date":"2025-04-11","type":"duo"},
  {"date":"2025-04-19","type":"solo"},{"date":"2025-04-20","type":"duo"},{"date":"2025-04-27","type":"solo"},
  {"date":"2025-04-27","type":"solo"},{"date":"2025-04-29","type":"solo"},{"date":"2025-04-30","type":"duo"},
  {"date":"2025-05-04","type":"solo"},{"date":"2025-05-05","type":"duo"},{"date":"2025-05-11","type":"duo"},
  {"date":"2025-05-16","type":"solo"},{"date":"2025-05-17","type":"solo"},{"date":"2025-05-19","type":"duo"},
  {"date":"2025-05-30","type":"duo"},{"date":"2025-05-30","type":"solo"},{"date":"2025-06-04","type":"duo"},
  {"date":"2025-06-09","type":"duo"},{"date":"2025-06-13","type":"duo"},{"date":"2025-06-13","type":"solo"},
  {"date":"2025-06-15","type":"solo"},{"date":"2025-06-25","type":"duo"},{"date":"2025-06-25","type":"solo"},
  {"date":"2025-06-29","type":"duo"},{"date":"2025-06-29","type":"solo"},{"date":"2025-07-04","type":"duo"},
  {"date":"2025-07-04","type":"solo"},{"date":"2025-07-05","type":"solo"},{"date":"2025-07-18","type":"duo"},
  {"date":"2025-07-19","type":"solo"},{"date":"2025-07-23","type":"duo"},{"date":"2025-07-29","type":"solo"},
  {"date":"2025-08-03","type":"duo"},{"date":"2025-08-03","type":"solo"},{"date":"2025-08-09","type":"solo"},
  {"date":"2025-08-15","type":"duo"},{"date":"2025-08-19","type":"solo"},{"date":"2025-08-20","type":"solo"},
  {"date":"2025-08-21","type":"solo"},{"date":"2025-08-22","type":"duo"},{"date":"2025-08-22","type":"solo"},
  {"date":"2025-08-23","type":"solo"},{"date":"2025-08-30","type":"solo"},{"date":"2025-09-03","type":"solo"},
  {"date":"2025-09-03","type":"duo"},{"date":"2025-09-05","type":"solo"},{"date":"2025-09-12","type":"duo"},
  {"date":"2025-09-14","type":"solo"},{"date":"2025-09-19","type":"solo"},{"date":"2025-09-20","type":"solo"},
  {"date":"2025-09-21","type":"duo"},{"date":"2025-09-25","type":"solo"},{"date":"2025-09-27","type":"solo"},
  {"date":"2025-09-28","type":"duo"},{"date":"2025-09-30","type":"solo"},{"date":"2025-10-01","type":"duo"},
  {"date":"2025-10-08","type":"solo"},{"date":"2025-10-11","type":"solo"},{"date":"2025-10-17","type":"duo"},
  {"date":"2025-10-21","type":"duo"},{"date":"2025-10-25","type":"solo"},{"date":"2025-10-27","type":"solo"},
  {"date":"2025-10-29","type":"duo"},{"date":"2025-11-03","type":"solo"},{"date":"2025-11-05","type":"duo"},
  {"date":"2025-11-11","type":"solo"},{"date":"2025-11-15","type":"solo"},{"date":"2025-11-20","type":"solo"},
  {"date":"2025-11-20","type":"duo"},{"date":"2025-11-22","type":"solo"},{"date":"2025-11-23","type":"duo"},
  {"date":"2025-11-24","type":"solo"},{"date":"2025-11-28","type":"duo"},{"date":"2025-11-29","type":"solo"},
  {"date":"2025-12-01","type":"solo"},{"date":"2025-12-14","type":"solo"},{"date":"2025-12-17","type":"solo"},
  {"date":"2025-12-19","type":"duo"},{"date":"2025-12-24","type":"solo"},{"date":"2025-12-24","type":"duo"},
  {"date":"2025-12-29","type":"solo"},{"date":"2025-12-30","type":"duo"},{"date":"2026-01-07","type":"solo"},
  {"date":"2026-01-10","type":"solo"},{"date":"2026-01-11","type":"duo"},{"date":"2026-01-12","type":"solo"},
  {"date":"2026-01-14","type":"solo"},{"date":"2026-01-16","type":"duo"},{"date":"2026-01-18","type":"duo"},
  {"date":"2026-01-21","type":"solo"},{"date":"2026-02-04","type":"duo"},{"date":"2026-02-08","type":"solo"},
  {"date":"2026-02-22","type":"duo"},{"date":"2026-03-04","type":"duo"},{"date":"2026-03-11","type":"duo"},
  {"date":"2026-03-22","type":"duo"}
];

// ─── Utils ───
const MFR = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const MFULL = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DFR = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
function fmtD(d) { return d.toISOString().slice(0, 10); }
function prsD(s) { const p = s.split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); }
function diffD(a, b) { return Math.round((b - a) / 86400000); }
function getMon(d) { const dt = new Date(d); const day = dt.getDay(); dt.setDate(dt.getDate() - (day === 0 ? 6 : day - 1)); return fmtD(dt); }
function clean(arr) { return (arr || []).filter(e => e && e.date && e.type); }
function cleanC(arr) { return (arr || []).filter(c => c && c.start && c.end_date); }

const NOW = new Date();
const NOW_S = fmtD(NOW);
const MON_S = getMon(NOW);
const sunD = new Date(prsD(MON_S)); sunD.setDate(sunD.getDate() + 6); const SUN_S = fmtD(sunD);
const CM_S = `${NOW.getFullYear()}-${String(NOW.getMonth() + 1).padStart(2, "0")}-01`;
const CM_E = fmtD(new Date(NOW.getFullYear(), NOW.getMonth() + 1, 0));

// ─── Theme ───
const C = {
  bg: "#0c0c0c", surface: "#141414", card: "#1a1a1a", border: "#262626",
  text: "#ece8e1", textSoft: "#a09890", textMuted: "#605850",
  solo: "#a78bfa", soloSoft: "rgba(167,139,250,0.12)",
  duo: "#f59e0b", duoSoft: "rgba(245,158,11,0.12)",
  total: "#38bdf8",
  period: "#ec4899", periodSoft: "rgba(236,72,153,0.1)", periodBorder: "rgba(236,72,153,0.25)",
  fertile: "rgba(34,197,94,0.15)", fertileBorder: "rgba(34,197,94,0.3)", fertileText: "#4ade80",
  accent: "#d4a574", accentSoft: "rgba(212,165,116,0.12)",
  danger: "#ef4444", success: "#22c55e",
};
const crd = { background: C.card, borderRadius: 16, padding: "18px 20px", border: `1px solid ${C.border}` };
function pill(on, col) { const c = col || C.accent; return { padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${on ? c : C.border}`, background: on ? c + "18" : "transparent", color: on ? c : C.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .2s", fontFamily: "inherit" }; }
const inp = { background: "#1e1e1e", border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" };

function TT({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (<div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 12 }}><div style={{ color: C.textMuted, marginBottom: 4 }}>{label}</div>{payload.map((p, i) => (<div key={i} style={{ color: p.fill || p.stroke, fontWeight: 600 }}>{p.name === "solo" ? "Solo" : p.name === "duo" ? "Duo" : "Total"}: {p.value}</div>))}</div>);
}
function Stat({ label, value, sub, color, big }) {
  return (<div style={{ ...crd, flex: "1 1 120px", minWidth: big ? 150 : 110, padding: big ? "20px" : "14px 16px" }}><div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 600 }}>{label}</div><div style={{ fontSize: big ? 30 : 22, fontWeight: 700, color: color || C.text, marginTop: 4, lineHeight: 1 }}>{value}</div>{sub && <div style={{ fontSize: 11, color: C.textSoft, marginTop: 5 }}>{sub}</div>}</div>);
}
function Chips({ filter, setFilter }) {
  return (<div style={{ display: "flex", gap: 6 }}><button onClick={() => setFilter("all")} style={pill(filter === "all", C.total)}>Tout</button><button onClick={() => setFilter("solo")} style={pill(filter === "solo", C.solo)}>Solo</button><button onClick={() => setFilter("duo")} style={pill(filter === "duo", C.duo)}>Duo</button></div>);
}

// ─── PIN LOCK ───
const PIN_CODE = "1312";
function PinLock({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const handleDigit = (d) => { const next = pin + d; setError(false); if (next.length === 4) { if (next === PIN_CODE) { sessionStorage.setItem("tai_unlocked", "1"); onUnlock(); } else { setError(true); setPin(""); } } else { setPin(next); } };
  const handleDelete = () => { setPin(p => p.slice(0, -1)); setError(false); };
  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: C.bg, color: C.text, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, padding: 20 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
      <div style={{ width: 44, height: 44, borderRadius: 12, background: C.accentSoft, border: `2px solid ${C.accent}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: C.accent }}>T</div>
      <div style={{ fontSize: 14, color: C.textSoft }}>Entrez le code</div>
      <div style={{ display: "flex", gap: 12 }}>{[0, 1, 2, 3].map(i => (<div key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: i < pin.length ? C.accent : "transparent", border: `2px solid ${error ? C.danger : i < pin.length ? C.accent : C.border}`, transition: "all .2s" }} />))}</div>
      {error && <div style={{ fontSize: 12, color: C.danger }}>Code incorrect</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 8 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "del"].map((d, i) => {
          if (d === null) return <div key={i} />;
          if (d === "del") return <button key={i} onClick={handleDelete} style={{ width: 64, height: 64, borderRadius: 32, background: "transparent", border: "none", color: C.textSoft, fontSize: 16, cursor: "pointer", fontFamily: "inherit" }}>←</button>;
          return <button key={i} onClick={() => handleDigit(String(d))} style={{ width: 64, height: 64, borderRadius: 32, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 22, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{d}</button>;
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
export default function App() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("tai_unlocked") === "1");
  if (!unlocked) return <PinLock onUnlock={() => setUnlocked(true)} />;
  return <MainApp />;
}

function MainApp() {
  const [entries, setEntries] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [tab, setTab] = useState("home");
  const [filter, setFilter] = useState("all");
  const [selYear, setSelYear] = useState(NOW.getFullYear());
  const [selMonth, setSelMonth] = useState(NOW.getMonth());
  const [modal, setModal] = useState(null);
  const [addDate, setAddDate] = useState(NOW_S);
  const [addType, setAddType] = useState("duo");
  const [pStart, setPStart] = useState(NOW_S);
  const [pEnd, setPEnd] = useState(NOW_S);
  const [calMonth, setCalMonth] = useState(NOW.getMonth());
  const [calYear, setCalYear] = useState(NOW.getFullYear());
  const [sync, setSync] = useState("loading");
  const loaded = useRef(false);

  // ─── Load ───
  const loadData = useCallback(async () => {
    const [sRes, cRes] = await Promise.all([
      tursoExec("SELECT date, type FROM sessions ORDER BY date ASC"),
      tursoExec("SELECT start, end_date FROM cycles ORDER BY start ASC"),
    ]);
    if (sRes.ok) {
      setEntries(clean(sRes.rows));
      // Map end_date to end for the app
      setPeriods((cRes.ok ? cRes.rows : []).map(c => ({ start: c.start, end: c.end_date })).filter(c => c.start && c.end));
      setSync("ok");
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    (async () => {
      setSync("loading");
      const ok = await loadData();
      if (!ok) { setEntries(SEED); setSync("offline"); }
    })();
  }, [loadData]);

  // Timeout fallback
  useEffect(() => { if (sync === "loading" && entries.length === 0) { const t = setTimeout(() => { setEntries(SEED); setSync("offline"); }, 5000); return () => clearTimeout(t); } }, [sync, entries.length]);

  // ─── CRUD ───
  const addEntry = async () => {
    const ne = { date: addDate, type: addType };
    setEntries(prev => [...prev, ne].sort((a, b) => (a.date || "").localeCompare(b.date || "")));
    setModal(null);
    const r = await tursoExec("INSERT INTO sessions (date, type) VALUES (?, ?)", [{ type: "text", value: addDate }, { type: "text", value: addType }]);
    setSync(r.ok ? "ok" : "error");
  };

  const delEntry = async (idx) => {
    const entry = entries[idx];
    setEntries(prev => prev.filter((_, i) => i !== idx));
    setModal(null);
    const r = await tursoExec("DELETE FROM sessions WHERE id = (SELECT id FROM sessions WHERE date = ? AND type = ? LIMIT 1)", [{ type: "text", value: entry.date }, { type: "text", value: entry.type }]);
    setSync(r.ok ? "ok" : "error");
    setTimeout(loadData, 500);
  };

  const addPeriodFn = async () => {
    const np = { start: pStart, end: pEnd };
    setPeriods(prev => [...prev, np].sort((a, b) => (a.start || "").localeCompare(b.start || "")));
    setModal(null);
    const r = await tursoExec("INSERT INTO cycles (start, end_date) VALUES (?, ?)", [{ type: "text", value: pStart }, { type: "text", value: pEnd }]);
    setSync(r.ok ? "ok" : "error");
  };

  const delPeriod = async (idx) => {
    const p = periods[idx];
    setPeriods(prev => prev.filter((_, i) => i !== idx));
    setModal(null);
    const r = await tursoExec("DELETE FROM cycles WHERE id = (SELECT id FROM cycles WHERE start = ? AND end_date = ? LIMIT 1)", [{ type: "text", value: p.start }, { type: "text", value: p.end }]);
    setSync(r.ok ? "ok" : "error");
    setTimeout(loadData, 500);
  };

  // ─── Filtered ───
  const fE = useMemo(() => filter === "all" ? entries : entries.filter(e => e.type === filter), [entries, filter]);

  // ─── Stats ───
  const stats = useMemo(() => {
    const valid = fE.filter(e => e && e.date && e.type);
    if (valid.length === 0) return null;
    const sorted = [...valid].sort((a, b) => a.date.localeCompare(b.date));
    const first = prsD(sorted[0].date), last = prsD(sorted[sorted.length - 1].date);
    const totalDays = Math.max(1, diffD(first, last));
    const totalWeeks = Math.max(1, totalDays / 7);
    const thisWeek = valid.filter(e => e.date >= MON_S && e.date <= SUN_S).length;
    const thisMonth = valid.filter(e => e.date >= CM_S && e.date <= CM_E).length;
    const tm = new Date(NOW); tm.setMonth(tm.getMonth() - 3); const tmS = fmtD(tm);
    const l3 = valid.filter(e => e.date >= tmS && e.date <= NOW_S).length;
    const uD = [...new Set(sorted.map(e => e.date))].sort();
    let maxStr = 1, cur = 1;
    for (let i = 1; i < uD.length; i++) { if (diffD(prsD(uD[i - 1]), prsD(uD[i])) === 1) { cur++; maxStr = Math.max(maxStr, cur); } else cur = 1; }
    let maxGap = 0;
    for (let i = 1; i < uD.length; i++) maxGap = Math.max(maxGap, diffD(prsD(uD[i - 1]), prsD(uD[i])));
    const dSince = diffD(prsD(uD[uD.length - 1]), NOW);
    const dDist = Array(7).fill(0);
    sorted.forEach(e => dDist[prsD(e.date).getDay()]++);
    const fDI = dDist.indexOf(Math.max(...dDist));
    const solo = entries.filter(e => e.type === "solo").length;
    const duo = entries.filter(e => e.type === "duo").length;
    return { total: valid.length, solo, duo, thisWeek, thisMonth, a3w: (l3 / 13).toFixed(1), a3m: (l3 / 3).toFixed(1), maxStr, maxGap, dSince, favDay: DFR[fDI], dDist, pw: (valid.length / totalWeeks).toFixed(1) };
  }, [fE, entries]);

  // ─── Charts ───
  const mChart = useMemo(() => { const m = {}; fE.forEach(e => { if (!e.date) return; const k = e.date.slice(0, 7); if (!m[k]) m[k] = { m: k, solo: 0, duo: 0 }; m[k][e.type]++; }); return Object.values(m).sort((a, b) => a.m.localeCompare(b.m)); }, [fE]);
  const wChart = useMemo(() => { const mk = `${selYear}-${String(selMonth + 1).padStart(2, "0")}`; const f = fE.filter(e => e.date && e.date.startsWith(mk)); const m = {}; f.forEach(e => { const w = getMon(prsD(e.date)); if (!m[w]) m[w] = { w, solo: 0, duo: 0 }; m[w][e.type]++; }); return Object.values(m).sort((a, b) => a.w.localeCompare(b.w)).map((x, i) => ({ ...x, label: `S${i + 1}` })); }, [fE, selMonth, selYear]);
  const dowC = useMemo(() => stats ? DFR.map((d, i) => ({ day: d, count: stats.dDist[i] })) : [], [stats]);
  const trend = useMemo(() => { const m = {}; fE.forEach(e => { if (!e.date) return; const k = e.date.slice(0, 7); m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort(([a], [b]) => a.localeCompare(b)).map(([k, c]) => ({ month: k, count: c, label: MFR[parseInt(k.split("-")[1]) - 1] + " " + k.slice(2, 4) })); }, [fE]);

  // ─── Periods ───
  const pInfo = useMemo(() => {
    const valid = periods.filter(p => p && p.start && p.end);
    if (valid.length === 0) return null;
    const s = [...valid].sort((a, b) => a.start.localeCompare(b.start));
    const last = s[s.length - 1];
    let avgC = 28, avgD = 5;
    if (s.length >= 2) { let tc = 0; for (let i = 1; i < s.length; i++) tc += diffD(prsD(s[i - 1].start), prsD(s[i].start)); avgC = Math.round(tc / (s.length - 1)); }
    avgD = Math.round(s.reduce((a, p) => a + Math.max(1, diffD(prsD(p.start), prsD(p.end))), 0) / s.length);
    const preds = []; let ref = prsD(last.start);
    for (let i = 0; i < 6; i++) { const ns = new Date(ref); ns.setDate(ns.getDate() + avgC); const ne = new Date(ns); ne.setDate(ne.getDate() + avgD); const fs = new Date(ns); fs.setDate(fs.getDate() - 19); const fe = new Date(ns); fe.setDate(fe.getDate() - 13); preds.push({ start: fmtD(ns), end: fmtD(ne), fs: fmtD(fs), fe: fmtD(fe) }); ref = ns; }
    return { avgC, avgD, preds };
  }, [periods]);

  // ─── Calendar ───
  const calD = useMemo(() => {
    const dIM = new Date(calYear, calMonth + 1, 0).getDate();
    const fDay = new Date(calYear, calMonth, 1).getDay(); const off = fDay === 0 ? 6 : fDay - 1;
    const pf = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
    const eM = {}; entries.forEach(e => { if (e.date && e.date.startsWith(pf)) { if (!eM[e.date]) eM[e.date] = { solo: 0, duo: 0 }; eM[e.date][e.type]++; } });
    const chkP = (d) => { if (periods.some(p => d >= p.start && d <= p.end)) return "period"; if (pInfo && pInfo.preds.some(p => d >= p.start && d <= p.end)) return "predicted"; return false; };
    const chkF = (d) => pInfo ? pInfo.preds.some(p => d >= p.fs && d <= p.fe) : false;
    const days = []; for (let i = 0; i < off; i++) days.push(null);
    for (let d = 1; d <= dIM; d++) { const k = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`; days.push({ day: d, key: k, en: eM[k] || null, per: chkP(k), fer: chkF(k), today: k === NOW_S }); }
    return days;
  }, [calYear, calMonth, entries, periods, pInfo]);

  // ─── Export ───
  const exportCSV = () => { let csv = "Date,Type\n"; entries.filter(e => e.date).sort((a, b) => a.date.localeCompare(b.date)).forEach(e => { csv += e.date + "," + e.type + "\n"; }); csv += "\nCycles\nDebut,Fin,Duree\n"; periods.forEach(p => { csv += p.start + "," + p.end + "," + diffD(prsD(p.start), prsD(p.end)) + "j\n"; }); const b = new Blob([csv], { type: "text/csv" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "tai-export.csv"; a.click(); };
  const exportJSON = () => { const d = JSON.stringify({ sessions: entries, cycles: periods }, null, 2); const b = new Blob([d], { type: "application/json" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "tai-export.json"; a.click(); };

  const years = useMemo(() => [...new Set(entries.filter(e => e.date).map(e => parseInt(e.date.slice(0, 4))))].filter(y => !isNaN(y)).sort(), [entries]);
  const prevCal = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); };
  const nextCal = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); };

  // ─── Loading ───
  if (sync === "loading" && entries.length === 0) {
    return (<div style={{ fontFamily: "'DM Sans',sans-serif", background: C.bg, color: C.text, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
      <div style={{ width: 40, height: 40, borderRadius: 10, background: C.accentSoft, border: `2px solid ${C.accent}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: C.accent }}>T</div>
      <div style={{ fontSize: 14, color: C.textSoft }}>Chargement...</div>
    </div>);
  }

  return (
    <div style={{ fontFamily: "'DM Sans',-apple-system,sans-serif", background: C.bg, color: C.text, minHeight: "100vh", maxWidth: 480, margin: "0 auto", position: "relative", paddingBottom: 76 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`*{-webkit-tap-highlight-color:transparent;box-sizing:border-box}::-webkit-scrollbar{display:none}input[type=date]{color-scheme:dark}`}</style>

      {/* Header */}
      <div style={{ padding: "18px 16px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.bg, zIndex: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${C.accent}44, ${C.accent}22)`, border: `1.5px solid ${C.accent}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: C.accent }}>T</div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}><span style={{ color: C.accent }}>TAI</span></h1>
          <div style={{ width: 7, height: 7, borderRadius: "50%", marginLeft: 4, background: sync === "ok" ? C.success : sync === "offline" ? C.duo : sync === "error" ? C.danger : C.textMuted }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={loadData} style={{ ...pill(false), padding: "6px 10px", fontSize: 14 }}>↻</button>
          <button onClick={() => { setAddDate(NOW_S); setModal("add"); }} style={{ ...pill(true, C.accent), padding: "7px 14px" }}>+ Session</button>
        </div>
      </div>

      <div style={{ padding: "14px 14px 0" }}>
        {/* HOME */}
        {tab === "home" && stats && (<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 8 }}><Stat label="Cette semaine" value={stats.thisWeek} sub={`sem. du ${prsD(MON_S).getDate()} ${MFR[prsD(MON_S).getMonth()]}`} color={C.accent} big /><Stat label="Ce mois-ci" value={stats.thisMonth} sub={MFULL[NOW.getMonth()]} color={C.total} big /></div>
          <div style={{ ...crd, background: `linear-gradient(135deg, ${C.card}, ${C.accentSoft})`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 600 }}>Moyenne (3 derniers mois)</div><div style={{ marginTop: 5, display: "flex", gap: 14, alignItems: "baseline" }}><span style={{ fontSize: 24, fontWeight: 700, color: C.accent }}>{stats.a3w}<span style={{ fontSize: 11, fontWeight: 400, color: C.textSoft }}>/sem</span></span><span style={{ fontSize: 16, fontWeight: 600, color: C.textSoft }}>{stats.a3m}<span style={{ fontSize: 11, fontWeight: 400 }}>/mois</span></span></div></div>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 10, color: C.textMuted }}>Dernière</div><div style={{ fontSize: 13, fontWeight: 600, color: stats.dSince === 0 ? C.accent : stats.dSince <= 2 ? C.text : C.textSoft }}>{stats.dSince === 0 ? "Auj." : stats.dSince + "j"}</div></div>
          </div>
          <Chips filter={filter} setFilter={setFilter} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><Stat label="Total" value={stats.total} color={C.total} /><Stat label="Record" value={stats.maxStr + "j"} sub="consécutifs" color={C.duo} /><Stat label="Gap max" value={stats.maxGap + "j"} color={C.textMuted} /></div>
          <div style={crd}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Activité mensuelle</div><ResponsiveContainer width="100%" height={190}><BarChart data={mChart} barGap={1}><CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" /><XAxis dataKey="m" tick={{ fill: C.textMuted, fontSize: 9 }} tickFormatter={v => MFR[parseInt(v.split("-")[1]) - 1]} /><YAxis tick={{ fill: C.textMuted, fontSize: 9 }} allowDecimals={false} width={20} /><Tooltip content={<TT />} />{(filter === "all" || filter === "solo") && <Bar dataKey="solo" fill={C.solo} radius={[3, 3, 0, 0]} name="solo" />}{(filter === "all" || filter === "duo") && <Bar dataKey="duo" fill={C.duo} radius={[3, 3, 0, 0]} name="duo" />}</BarChart></ResponsiveContainer></div>
          <div style={crd}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Tendance</div><ResponsiveContainer width="100%" height={150}><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" /><XAxis dataKey="label" tick={{ fill: C.textMuted, fontSize: 9 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 9 }} allowDecimals={false} width={20} /><Tooltip content={<TT />} /><Line type="monotone" dataKey="count" stroke={C.accent} strokeWidth={2} dot={{ r: 2.5, fill: C.accent }} name="count" /></LineChart></ResponsiveContainer></div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ ...crd, flex: "1 1 55%" }}><div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Jour favori : <span style={{ color: C.accent }}>{stats.favDay}</span></div><ResponsiveContainer width="100%" height={120}><BarChart data={dowC}><XAxis dataKey="day" tick={{ fill: C.textMuted, fontSize: 9 }} /><YAxis hide /><Bar dataKey="count" fill={C.accent} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
            <div style={{ ...crd, flex: "1 1 35%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}><div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2, alignSelf: "flex-start" }}>Ratio</div><ResponsiveContainer width="100%" height={100}><PieChart><Pie data={[{ name: "Solo", value: stats.solo }, { name: "Duo", value: stats.duo }]} cx="50%" cy="50%" innerRadius={25} outerRadius={42} paddingAngle={4} dataKey="value"><Cell fill={C.solo} /><Cell fill={C.duo} /></Pie></PieChart></ResponsiveContainer><div style={{ display: "flex", gap: 10, fontSize: 10, marginTop: 2 }}><span><span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: C.solo, marginRight: 3 }} />Solo {stats.solo + stats.duo > 0 ? Math.round(stats.solo / (stats.solo + stats.duo) * 100) : 0}%</span><span><span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: C.duo, marginRight: 3 }} />Duo {stats.solo + stats.duo > 0 ? Math.round(stats.duo / (stats.solo + stats.duo) * 100) : 0}%</span></div></div>
          </div>
        </div>)}

        {/* CALENDAR */}
        {tab === "calendar" && (<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ ...crd, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><button onClick={prevCal} style={{ background: "none", border: "none", color: C.textSoft, cursor: "pointer", fontSize: 20, padding: "4px 10px" }}>‹</button><div style={{ fontSize: 15, fontWeight: 600 }}>{MFULL[calMonth]} {calYear}</div><button onClick={nextCal} style={{ background: "none", border: "none", color: C.textSoft, cursor: "pointer", fontSize: 20, padding: "4px 10px" }}>›</button></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>{["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (<div key={i} style={{ textAlign: "center", fontSize: 10, color: C.textMuted, fontWeight: 600, padding: "3px 0" }}>{d}</div>))}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
              {calD.map((d, i) => {
                if (d === null) return <div key={i} />;
                const hS = d.en && d.en.solo > 0, hD = d.en && d.en.duo > 0;
                let bg = "transparent"; if (d.per === "period") bg = C.periodSoft; else if (d.per === "predicted") bg = "rgba(236,72,153,0.05)"; else if (d.fer) bg = C.fertile;
                let bdr = "1px solid transparent"; if (d.today) bdr = `2px solid ${C.accent}`; else if (d.per === "predicted") bdr = `1px dashed ${C.periodBorder}`; else if (d.fer) bdr = `1px solid ${C.fertileBorder}`;
                return (<div key={i} style={{ aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 10, background: bg, border: bdr, cursor: "default" }}><span style={{ fontSize: 11, color: d.today ? C.accent : (hS || hD) ? C.text : C.textMuted, fontWeight: d.today ? 700 : 400 }}>{d.day}</span>{(hS || hD) && (<div style={{ display: "flex", gap: 2, marginTop: 1 }}>{hD && <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.duo }} />}{hS && <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.solo }} />}</div>)}</div>);
              })}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 12, justifyContent: "center", fontSize: 9, color: C.textMuted, flexWrap: "wrap" }}><span style={{ display: "flex", alignItems: "center", gap: 2 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: C.duo }} />Duo</span><span style={{ display: "flex", alignItems: "center", gap: 2 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: C.solo }} />Solo</span><span style={{ display: "flex", alignItems: "center", gap: 2 }}><span style={{ width: 6, height: 6, borderRadius: 2, background: C.periodSoft, border: `1px solid ${C.periodBorder}` }} />Règles</span><span style={{ display: "flex", alignItems: "center", gap: 2 }}><span style={{ width: 6, height: 6, borderRadius: 2, border: `1px dashed ${C.periodBorder}` }} />Prévu</span>{pInfo && <span style={{ display: "flex", alignItems: "center", gap: 2 }}><span style={{ width: 6, height: 6, borderRadius: 2, background: C.fertile, border: `1px solid ${C.fertileBorder}` }} />Fertile</span>}</div>
          </div>
          {(() => { const pf = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`; const me = entries.filter(e => e.date && e.date.startsWith(pf)); if (me.length === 0) return null; const sc = me.filter(e => e.type === "solo").length, dc = me.filter(e => e.type === "duo").length; return (<div style={{ display: "flex", flexDirection: "column", gap: 10 }}><div style={{ display: "flex", gap: 8 }}><Stat label="Total" value={me.length} color={C.total} /><Stat label="Solo" value={sc} color={C.solo} /><Stat label="Duo" value={dc} color={C.duo} /></div><div style={crd}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Sessions</div>{[...me].sort((a, b) => b.date.localeCompare(a.date)).map((e, i) => { const dd = prsD(e.date); return (<div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < me.length - 1 ? `1px solid ${C.border}` : "none" }}><div style={{ display: "flex", alignItems: "center", gap: 7 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: e.type === "duo" ? C.duo : C.solo }} /><span style={{ fontSize: 12, color: C.textSoft }}>{DFR[dd.getDay()]} {dd.getDate()}</span><span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, fontWeight: 600, background: e.type === "duo" ? C.duoSoft : C.soloSoft, color: e.type === "duo" ? C.duo : C.solo }}>{e.type === "duo" ? "Duo" : "Solo"}</span></div><button onClick={() => setModal({ delete: entries.indexOf(e) })} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 14, padding: "2px 6px" }}>×</button></div>); })}</div></div>); })()}
        </div>)}

        {/* MONTHLY */}
        {tab === "monthly" && (<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Chips filter={filter} setFilter={setFilter} />
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{years.map(y => <button key={y} onClick={() => setSelYear(y)} style={pill(selYear === y)}>{y}</button>)}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>{MFULL.map((m, i) => { const k = `${selYear}-${String(i + 1).padStart(2, "0")}`; const c = fE.filter(e => e.date && e.date.startsWith(k)).length; return (<button key={i} onClick={() => setSelMonth(i)} style={{ ...pill(selMonth === i), padding: "10px 4px", display: "flex", flexDirection: "column", alignItems: "center", borderRadius: 10 }}><span style={{ fontSize: 10 }}>{MFR[i]}</span><span style={{ fontSize: 18, fontWeight: 700, color: c > 0 ? C.text : C.textMuted, marginTop: 2 }}>{c}</span></button>); })}</div>
          {(() => { const mk = `${selYear}-${String(selMonth + 1).padStart(2, "0")}`; const me = fE.filter(e => e.date && e.date.startsWith(mk)); if (me.length === 0) return null; const sc = me.filter(e => e.type === "solo").length, dc = me.filter(e => e.type === "duo").length, w = new Date(selYear, selMonth + 1, 0).getDate() / 7; return (<div style={{ display: "flex", flexDirection: "column", gap: 10 }}><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><Stat label="Total" value={me.length} sub={`${(me.length / w).toFixed(1)}/sem`} color={C.total} /><Stat label="Solo" value={sc} color={C.solo} /><Stat label="Duo" value={dc} color={C.duo} /></div>{wChart.length > 0 && <div style={crd}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Par semaine</div><ResponsiveContainer width="100%" height={170}><BarChart data={wChart} barGap={1}><CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" /><XAxis dataKey="label" tick={{ fill: C.textMuted, fontSize: 9 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 9 }} allowDecimals={false} width={20} /><Tooltip content={<TT />} />{(filter === "all" || filter === "solo") && <Bar dataKey="solo" fill={C.solo} radius={[3, 3, 0, 0]} name="solo" />}{(filter === "all" || filter === "duo") && <Bar dataKey="duo" fill={C.duo} radius={[3, 3, 0, 0]} name="duo" />}</BarChart></ResponsiveContainer></div>}</div>); })()}
        </div>)}

        {/* CYCLES */}
        {tab === "cycles" && (<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={() => setModal("period")} style={{ ...pill(true, C.period), padding: "10px 16px", alignSelf: "flex-start" }}>+ Enregistrer des règles</button>
          {pInfo && (<div style={{ ...crd, background: C.periodSoft, border: `1px solid ${C.periodBorder}` }}><div style={{ fontSize: 14, fontWeight: 600, color: C.period, marginBottom: 12 }}>Prévision prochain cycle</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><div><div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".08em" }}>Début</div><div style={{ fontSize: 17, fontWeight: 700, marginTop: 3 }}>{prsD(pInfo.preds[0].start).getDate()} {MFULL[prsD(pInfo.preds[0].start).getMonth()]}</div></div><div><div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".08em" }}>Fin</div><div style={{ fontSize: 17, fontWeight: 700, marginTop: 3 }}>{prsD(pInfo.preds[0].end).getDate()} {MFULL[prsD(pInfo.preds[0].end).getMonth()]}</div></div><div><div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".08em" }}>Cycle moy.</div><div style={{ fontSize: 17, fontWeight: 700, marginTop: 3 }}>{pInfo.avgC}j</div></div><div><div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".08em" }}>Durée moy.</div><div style={{ fontSize: 17, fontWeight: 700, marginTop: 3 }}>{pInfo.avgD}j</div></div></div><div style={{ marginTop: 10, padding: "8px 12px", background: C.fertile, borderRadius: 8, border: `1px solid ${C.fertileBorder}` }}><span style={{ fontSize: 11, color: C.fertileText, fontWeight: 600 }}>Fenêtre fertile : {prsD(pInfo.preds[0].fs).getDate()} {MFR[prsD(pInfo.preds[0].fs).getMonth()]} → {prsD(pInfo.preds[0].fe).getDate()} {MFR[prsD(pInfo.preds[0].fe).getMonth()]}</span></div></div>)}
          <div style={crd}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Historique</div>{periods.length === 0 && <p style={{ color: C.textMuted, fontSize: 12, margin: 0 }}>Aucun cycle enregistré.</p>}{[...periods].sort((a, b) => b.start.localeCompare(a.start)).map((p, i) => { const ds = prsD(p.start), de = prsD(p.end); return (<div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < periods.length - 1 ? `1px solid ${C.border}` : "none" }}><div style={{ display: "flex", alignItems: "center", gap: 7 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: C.period }} /><span style={{ fontSize: 12 }}>{ds.getDate()} {MFR[ds.getMonth()]} → {de.getDate()} {MFR[de.getMonth()]} {de.getFullYear()}</span><span style={{ fontSize: 10, color: C.textMuted }}>({diffD(ds, de)}j)</span></div><button onClick={() => setModal({ deletePeriod: i })} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 14, padding: "2px 6px" }}>×</button></div>); })}</div>
          {pInfo && pInfo.preds.length > 1 && <div style={crd}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>6 prochains cycles</div>{pInfo.preds.map((p, i) => { const ds = prsD(p.start); return (<div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 0", borderBottom: i < 5 ? `1px solid ${C.border}` : "none", opacity: .5 + .5 / (i + 1) }}><span style={{ fontSize: 10, color: C.period, fontWeight: 700 }}>#{i + 1}</span><span style={{ fontSize: 12 }}>{ds.getDate()} {MFULL[ds.getMonth()]} {ds.getFullYear()}</span><span style={{ fontSize: 10, color: C.textMuted }}>({pInfo.avgD}j)</span></div>); })}</div>}
        </div>)}

        {/* MORE */}
        {tab === "more" && (<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Synchronisation</div>
          <div style={{ ...crd, display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: sync === "ok" ? C.success : sync === "offline" ? C.duo : sync === "error" ? C.danger : C.textMuted }} /><span style={{ fontSize: 13, color: C.textSoft }}>{sync === "ok" ? "Connecté à Turso" : sync === "offline" ? "Mode hors ligne" : sync === "error" ? "Erreur" : "..."}</span><button onClick={loadData} style={{ ...pill(false), marginLeft: "auto", padding: "6px 12px" }}>Sync</button></div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>Exporter</div>
          <div style={{ ...crd, display: "flex", flexDirection: "column", gap: 8 }}><button onClick={exportCSV} style={{ ...pill(true, C.accent), padding: "12px", textAlign: "center", width: "100%", borderRadius: 10 }}>Exporter CSV</button><button onClick={exportJSON} style={{ ...pill(true, C.total), padding: "12px", textAlign: "center", width: "100%", borderRadius: 10 }}>Exporter JSON</button></div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>Résumé</div>
          {stats && (<div style={{ ...crd, fontSize: 12, lineHeight: 2.2, color: C.textSoft }}><div><strong style={{ color: C.text }}>{stats.total}</strong> sessions</div><div><strong style={{ color: C.solo }}>{stats.solo}</strong> solo · <strong style={{ color: C.duo }}>{stats.duo}</strong> duo</div><div>Fréquence : <strong style={{ color: C.accent }}>{stats.pw}/sem</strong></div><div>Jour favori : <strong style={{ color: C.text }}>{stats.favDay}</strong></div><div>Record : <strong style={{ color: C.duo }}>{stats.maxStr}j</strong> · Gap max : <strong style={{ color: C.textMuted }}>{stats.maxGap}j</strong></div>{pInfo && <div>Cycle moyen : <strong style={{ color: C.period }}>{pInfo.avgC}j</strong></div>}</div>)}
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>Installation</div>
          <div style={{ ...crd, fontSize: 12, color: C.textSoft, lineHeight: 1.8 }}><strong style={{ color: C.text }}>Android :</strong> Chrome → ⋮ → "Ajouter à l'écran d'accueil"<br /><strong style={{ color: C.text }}>iPhone :</strong> Safari → Partager → "Sur l'écran d'accueil"<br /><br /><span style={{ color: C.textMuted }}>Nom : "TAI". Données stockées sur Turso (SQLite cloud).</span></div>
        </div>)}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: C.surface + "ee", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-around", padding: "6px 0 env(safe-area-inset-bottom, 10px)", zIndex: 50, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
        {[{ id: "home", icon: "◉", l: "Accueil" }, { id: "calendar", icon: "▦", l: "Calendrier" }, { id: "monthly", icon: "▤", l: "Mensuel" }, { id: "cycles", icon: "◎", l: "Cycles" }, { id: "more", icon: "⋯", l: "Plus" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 1, color: tab === t.id ? C.accent : C.textMuted, transition: "color .2s", fontFamily: "inherit", padding: "4px 6px" }}><span style={{ fontSize: 17 }}>{t.icon}</span><span style={{ fontSize: 9, fontWeight: tab === t.id ? 600 : 400 }}>{t.l}</span></button>))}
      </div>

      {/* Modals */}
      {modal !== null && (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }} onClick={() => setModal(null)}>
        <div style={{ ...crd, width: "100%", maxWidth: 480, borderRadius: "20px 20px 0 0", padding: "20px 22px 28px" }} onClick={e => e.stopPropagation()}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 16px" }} />
          {modal === "add" && (<><h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>Nouvelle session</h3><div style={{ marginBottom: 12 }}><label style={{ fontSize: 11, color: C.textMuted, display: "block", marginBottom: 4 }}>Date</label><input type="date" value={addDate} onChange={e => setAddDate(e.target.value)} style={inp} /></div><div style={{ marginBottom: 18 }}><label style={{ fontSize: 11, color: C.textMuted, display: "block", marginBottom: 6 }}>Type</label><div style={{ display: "flex", gap: 8 }}>{["solo", "duo"].map(t => (<button key={t} onClick={() => setAddType(t)} style={{ flex: 1, padding: 13, borderRadius: 12, border: `2px solid ${addType === t ? (t === "duo" ? C.duo : C.solo) : C.border}`, background: addType === t ? (t === "duo" ? C.duoSoft : C.soloSoft) : "transparent", color: addType === t ? (t === "duo" ? C.duo : C.solo) : C.textMuted, cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: "inherit" }}>{t === "duo" ? "Duo" : "Solo"}</button>))}</div></div><button onClick={addEntry} style={{ ...pill(true, C.accent), width: "100%", padding: 13, fontSize: 14, borderRadius: 12 }}>Enregistrer</button></>)}
          {modal === "period" && (<><h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600, color: C.period }}>Enregistrer des règles</h3><div style={{ marginBottom: 12 }}><label style={{ fontSize: 11, color: C.textMuted, display: "block", marginBottom: 4 }}>Début</label><input type="date" value={pStart} onChange={e => setPStart(e.target.value)} style={inp} /></div><div style={{ marginBottom: 18 }}><label style={{ fontSize: 11, color: C.textMuted, display: "block", marginBottom: 4 }}>Fin</label><input type="date" value={pEnd} onChange={e => setPEnd(e.target.value)} style={inp} /></div><button onClick={addPeriodFn} style={{ ...pill(true, C.period), width: "100%", padding: 13, fontSize: 14, borderRadius: 12 }}>Enregistrer</button></>)}
          {modal && modal.delete !== undefined && (<><p style={{ fontSize: 14, textAlign: "center", margin: "0 0 18px" }}>Supprimer cette session ?</p><div style={{ display: "flex", gap: 8 }}><button onClick={() => setModal(null)} style={{ ...pill(false), flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${C.border}` }}>Annuler</button><button onClick={() => delEntry(modal.delete)} style={{ ...pill(true, C.danger), flex: 1, padding: 11, borderRadius: 10 }}>Supprimer</button></div></>)}
          {modal && modal.deletePeriod !== undefined && (<><p style={{ fontSize: 14, textAlign: "center", margin: "0 0 18px" }}>Supprimer ce cycle ?</p><div style={{ display: "flex", gap: 8 }}><button onClick={() => setModal(null)} style={{ ...pill(false), flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${C.border}` }}>Annuler</button><button onClick={() => delPeriod(modal.deletePeriod)} style={{ ...pill(true, C.danger), flex: 1, padding: 11, borderRadius: 10 }}>Supprimer</button></div></>)}
        </div>
      </div>)}
    </div>
  );
}
