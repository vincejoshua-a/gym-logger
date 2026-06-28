import { useEffect, useState } from "react";

const LB_PER_KG = 2.2046226218;

interface UnitConverterProps {
  open: boolean;
  onClose: () => void;
  /** Seed the kg field (e.g. the last weight you entered). */
  initialKg?: string;
}

/** Allow digits and a single decimal point. */
function clean(v: string): string {
  const c = v.replace(/[^\d.]/g, "");
  const parts = c.split(".");
  return parts.length <= 2 ? c : `${parts[0]}.${parts.slice(1).join("")}`;
}

/** Trim a converted number to 1 decimal, no trailing ".0". */
function fmt(n: number): string {
  if (!isFinite(n)) return "";
  return n.toFixed(1).replace(/\.0$/, "");
}

/** Bidirectional kg ⇄ lb converter. Type in either field; the other updates. */
export function UnitConverter({ open, onClose, initialKg = "" }: UnitConverterProps) {
  const [kg, setKg] = useState("");
  const [lb, setLb] = useState("");

  // Seed from the last weight each time the panel opens.
  useEffect(() => {
    if (!open) return;
    const seed = clean(initialKg);
    setKg(seed);
    setLb(seed ? fmt(Number(seed) * LB_PER_KG) : "");
  }, [open, initialKg]);

  if (!open) return null;

  const onKg = (v: string) => {
    const c = clean(v);
    setKg(c);
    setLb(c === "" ? "" : fmt(Number(c) * LB_PER_KG));
  };
  const onLb = (v: string) => {
    const c = clean(v);
    setLb(c);
    setKg(c === "" ? "" : fmt(Number(c) / LB_PER_KG));
  };

  // Practical hint: nearest 2.5 lb (common smallest plate jump in lb gyms).
  const lbNum = Number(lb);
  const nearestLb = lb !== "" && isFinite(lbNum) ? Math.round(lbNum / 2.5) * 2.5 : null;

  return (
    <div className="conv-overlay" onClick={onClose}>
      <div className="conv" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Weight converter">
        <div className="conv__head">
          <h2 className="conv__title">kg ⇄ lb</h2>
          <button className="conv__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="conv__fields">
          <label className="conv__field">
            <span className="conv__unit">kg</span>
            <input
              className="conv__input"
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={kg}
              onChange={(e) => onKg(e.target.value)}
              autoFocus
            />
          </label>
          <span className="conv__eq">=</span>
          <label className="conv__field">
            <span className="conv__unit">lb</span>
            <input
              className="conv__input"
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={lb}
              onChange={(e) => onLb(e.target.value)}
            />
          </label>
        </div>

        {nearestLb !== null && nearestLb > 0 && (
          <p className="conv__hint">≈ nearest loadable: {fmt(nearestLb)} lb</p>
        )}
      </div>
    </div>
  );
}
