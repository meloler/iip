import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  FileText,
  Search,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import type { Company, DCF } from "./types";
import { go, money, num, pct } from "./lib";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={"badge " + tone}>{children}</span>;
}
export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="notice">
      <AlertCircle size={16} />
      <span>{children}</span>
    </div>
  );
}
export function ErrorBox({ error }: { error: string }) {
  return error ? (
    <div className="error" role="alert">
      {error}
    </div>
  ) : null;
}
export function Modal({
  children,
  onClose,
  titleId,
}: {
  children: ReactNode;
  onClose: () => void;
  titleId: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      className="document-dialog"
      ref={ref}
      aria-labelledby={titleId}
      onCancel={onClose}
    >
      {children}
    </dialog>
  );
}
export function Metric({
  label,
  value,
  note,
  positive = false,
}: {
  label: string;
  value: string;
  note: string;
  positive?: boolean;
}) {
  return (
    <section className="metric">
      <p>{label}</p>
      <strong className={positive ? "green" : ""}>{value}</strong>
      <small>{note}</small>
    </section>
  );
}
export function Empty({
  title,
  text,
  action,
  label,
}: {
  title: string;
  text: string;
  action?: () => void;
  label?: string;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <FileText size={23} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action && (
        <button className="primary" onClick={action}>
          {label}
          <ArrowRight size={15} />
        </button>
      )}
    </div>
  );
}
export function SearchBox({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <label className="search">
      <Search size={17} />
      <input
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <kbd>⌕</kbd>
    </label>
  );
}
export function CompanyMark({ company }: { company: Company }) {
  return (
    <span className={"company-mark " + company.id}>
      {company.name.charAt(0)}
    </span>
  );
}
export function CompanyTable({
  companies,
  compact = false,
}: {
  companies: Company[];
  compact?: boolean;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Compañía</th>
            <th>Precio DEMO</th>
            {!compact && (
              <>
                <th>Sector</th>
                <th>PER</th>
                <th>ROIC</th>
              </>
            )}
            <th>Investigar</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => (
            <tr key={c.id}>
              <td>
                <div className="company-cell">
                  <CompanyMark company={c} />
                  <span>
                    <b>{c.name}</b>
                    <small>
                      {c.ticker} <span className="muted">· {c.country}</span>
                    </small>
                  </span>
                </div>
              </td>
              <td className="numeric">
                {money(c.price)}
                <small className="muted">USD</small>
              </td>
              {!compact && (
                <>
                  <td>{c.sector}</td>
                  <td>{c.pe === null ? "N/A" : num(c.pe, 1) + "×"}</td>
                  <td>{c.roic === null ? "N/A" : pct(c.roic)}</td>
                </>
              )}
              <td>
                <button
                  className="icon-button"
                  aria-label={"Analizar " + c.name}
                  onClick={() => go("/research/" + c.id)}
                >
                  <ArrowUpRight size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function ProjectionChart({ result }: { result: DCF }) {
  const points = result.projections.map((x) => Number(x.fcff));
  const max = Math.max(...points) * 1.15;
  const coords = points.map(
    (v, i) =>
      `${50 + i * (550 / Math.max(points.length - 1, 1))},${180 - (v / max) * 140}`,
  );
  const line = coords.join(" ");
  return (
    <svg
      className="chart"
      role="img"
      aria-label="Proyección del FCFF anual en millones de USD"
      viewBox="0 0 650 220"
    >
      <defs>
        <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity=".25" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <line
            x1="50"
            x2="615"
            y1={40 + i * 47}
            y2={40 + i * 47}
            stroke="var(--line)"
            strokeDasharray="3 6"
          />
          <text x="5" y={44 + i * 47} fill="var(--muted)" fontSize="11">
            {num(max * (1 - i / 3), 0)}
          </text>
        </g>
      ))}
      <polygon points={"50,180 " + line + " 600,180"} fill="url(#area)" />
      <polyline
        points={line}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.5"
      />
      {points.map((v, i) => (
        <g key={i}>
          <circle
            cx={50 + i * (550 / Math.max(points.length - 1, 1))}
            cy={180 - (v / max) * 140}
            r="4"
            fill="var(--accent)"
          >
            <title>{`Año ${i + 1}: ${num(v)} M USD`}</title>
          </circle>
          <text
            x={50 + i * (550 / Math.max(points.length - 1, 1))}
            y="209"
            textAnchor="middle"
            fill="var(--muted)"
            fontSize="11"
          >
            Año {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}
