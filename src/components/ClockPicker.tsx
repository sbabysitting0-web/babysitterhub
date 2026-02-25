import { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";

const TEAL = "#3DBEB5";
const DARK = "#0A1714";
const BORDER = "rgba(255,255,255,0.08)";

interface ClockPickerProps {
  value: string;
  onChange: (val: string) => void;
  label: string;
}

function getAngle(index: number, total: number) {
  return ((index / total) * 360 - 90) * (Math.PI / 180);
}

const DROPDOWN_H = 360;
const DROPDOWN_W = 230;

export function ClockPicker({ value, onChange }: ClockPickerProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"hour" | "minute">("hour");
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const parsed = value ? value.split(":").map(Number) : [null, null];
  const rawHour = parsed[0] !== null ? (parsed[0] as number) : null;
  const rawMinute = parsed[1] !== null ? (parsed[1] as number) : null;
  const isAm = rawHour === null ? true : rawHour < 12;
  const displayHour = rawHour === null ? null : rawHour === 0 ? 12 : rawHour > 12 ? rawHour - 12 : rawHour;
  const displayMinute = rawMinute;

  const openPicker = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Use fixed positioning — rect coords are already viewport-relative
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow >= DROPDOWN_H + 12
        ? rect.bottom + 8
        : Math.max(8, rect.top - DROPDOWN_H - 8);
      // Center horizontally, clamp to viewport
      const idealLeft = rect.left + rect.width / 2 - DROPDOWN_W / 2;
      const left = Math.min(Math.max(8, idealLeft), window.innerWidth - DROPDOWN_W - 8);
      setPos({ top, left });
    }
    setOpen((v) => !v);
    setMode("hour");
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const commitHour = (h12: number) => {
    const h24 = isAm ? (h12 === 12 ? 0 : h12) : (h12 === 12 ? 12 : h12 + 12);
    const mm = displayMinute !== null ? String(displayMinute).padStart(2, "0") : "00";
    onChange(`${String(h24).padStart(2, "0")}:${mm}`);
    setMode("minute");
  };

  const commitMinute = (m: number) => {
    const h24 = rawHour !== null ? rawHour : (isAm ? 8 : 20);
    onChange(`${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    setOpen(false);
  };

  const toggleAmPm = (newIsAm: boolean) => {
    if (rawHour === null) return;
    const h24 = newIsAm ? (rawHour >= 12 ? rawHour - 12 : rawHour) : (rawHour < 12 ? rawHour + 12 : rawHour);
    const mm = displayMinute !== null ? String(displayMinute).padStart(2, "0") : "00";
    onChange(`${String(h24).padStart(2, "0")}:${mm}`);
  };

  const displayStr = value
    ? `${String(displayHour).padStart(2, "0")}:${String(displayMinute).padStart(2, "0")} ${isAm ? "AM" : "PM"}`
    : "-- : --";

  const handAngle = mode === "hour" && displayHour !== null
    ? ((displayHour % 12) / 12) * 360 - 90
    : mode === "minute" && displayMinute !== null
    ? (displayMinute / 60) * 360 - 90
    : null;

  const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const R = 68; const cx = 84; const cy = 84;

  const dropdown = open ? ReactDOM.createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: "fixed",          // ← fixed so viewport coords work directly
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
        background: DARK,
        border: `1px solid ${BORDER}`,
        borderRadius: 18,
        padding: "14px 16px",
        width: DROPDOWN_W,
        boxShadow: "0 24px 60px rgba(0,0,0,0.8)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      {/* HH : MM + AM/PM */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button onClick={() => setMode("hour")} style={chipStyle(mode === "hour")}>
          {displayHour !== null ? String(displayHour).padStart(2, "0") : "--"}
        </button>
        <span style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.3)" }}>:</span>
        <button onClick={() => setMode("minute")} style={chipStyle(mode === "minute")}>
          {displayMinute !== null ? String(displayMinute).padStart(2, "0") : "--"}
        </button>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginLeft: 4 }}>
          {(["AM", "PM"] as const).map((ap) => {
            const active = ap === "AM" ? isAm : !isAm;
            return (
              <button key={ap} onClick={() => toggleAmPm(ap === "AM")} style={ampmStyle(active)}>
                {ap}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ width: "100%", height: 1, background: BORDER }} />

      {/* Clock face */}
      <svg width={168} height={168} viewBox={`0 0 ${cx * 2} ${cy * 2}`} style={{ userSelect: "none" }}>
        <circle cx={cx} cy={cy} r={cx - 1} fill="rgba(255,255,255,0.04)" stroke={BORDER} strokeWidth="1" />
        {Array.from({ length: 60 }).map((_, i) => {
          const a = (i / 60) * 2 * Math.PI - Math.PI / 2;
          const isMajor = i % 5 === 0;
          const r1 = cx - 4; const r2 = cx - (isMajor ? 11 : 7);
          return <line key={i} x1={cx + r1 * Math.cos(a)} y1={cy + r1 * Math.sin(a)} x2={cx + r2 * Math.cos(a)} y2={cy + r2 * Math.sin(a)} stroke={isMajor ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)"} strokeWidth={isMajor ? 1.5 : 1} />;
        })}
        {handAngle !== null && (
          <>
            <line x1={cx} y1={cy} x2={cx + R * 0.75 * Math.cos(handAngle * Math.PI / 180)} y2={cy + R * 0.75 * Math.sin(handAngle * Math.PI / 180)} stroke={TEAL} strokeWidth="2" strokeLinecap="round" />
            <circle cx={cx + R * 0.75 * Math.cos(handAngle * Math.PI / 180)} cy={cy + R * 0.75 * Math.sin(handAngle * Math.PI / 180)} r={5} fill={TEAL} />
          </>
        )}
        <circle cx={cx} cy={cy} r={3} fill={handAngle !== null ? TEAL : "rgba(255,255,255,0.2)"} />
        {mode === "hour"
          ? HOURS.map((h, i) => {
              const a = getAngle(i, 12);
              const x = cx + R * Math.cos(a); const y = cy + R * Math.sin(a);
              const active = displayHour === h;
              return (
                <g key={h} onClick={() => commitHour(h)} style={{ cursor: "pointer" }}>
                  <circle cx={x} cy={y} r={14} fill={active ? TEAL : "transparent"} />
                  <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="600" fill={active ? "#fff" : "rgba(255,255,255,0.8)"}>{h}</text>
                </g>
              );
            })
          : MINUTES.map((m, i) => {
              const a = getAngle(i, 12);
              const x = cx + R * Math.cos(a); const y = cy + R * Math.sin(a);
              const active = displayMinute === m;
              return (
                <g key={m} onClick={() => commitMinute(m)} style={{ cursor: "pointer" }}>
                  <circle cx={x} cy={y} r={14} fill={active ? TEAL : "transparent"} />
                  <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="600" fill={active ? "#fff" : "rgba(255,255,255,0.8)"}>{String(m).padStart(2, "0")}</text>
                </g>
              );
            })}
      </svg>
    </div>,
    document.body
  ) : null;

  return (
    <div ref={triggerRef}>
      <div onClick={openPicker} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 48, borderRadius: 12, padding: "0 16px", cursor: "pointer", background: "rgba(255,255,255,0.06)", border: `1px solid ${value ? "rgba(61,190,181,0.45)" : BORDER}`, userSelect: "none", transition: "border-color 0.2s" }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: value ? "#fff" : "rgba(255,255,255,0.3)" }}>{displayStr}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      {dropdown}
    </div>
  );
}

function chipStyle(active: boolean): React.CSSProperties {
  return { fontSize: 26, fontWeight: 800, letterSpacing: 1, color: active ? TEAL : "#fff", background: active ? "rgba(61,190,181,0.12)" : "rgba(255,255,255,0.05)", border: "none", borderRadius: 10, padding: "2px 10px", cursor: "pointer", transition: "all 0.15s" };
}
function ampmStyle(active: boolean): React.CSSProperties {
  return { fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6, border: "none", cursor: "pointer", background: active ? TEAL : "rgba(255,255,255,0.07)", color: active ? "#fff" : "rgba(255,255,255,0.4)", transition: "all 0.15s" };
}
