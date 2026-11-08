import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  Activity,
  ArrowRight,
  BookOpen,
  ChartNoAxesCombined,
  ChevronDown,
  Compass,
  Download,
  ExternalLink,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Wallet,
  X,
} from "lucide-react";
import { api, exportCSV, fold, go, money, num, pct } from "./lib";
import type {
  Assumptions,
  Company,
  DCF,
  Document,
  Evidence,
  Health,
  Portfolio,
  SavedValuation,
  Watch,
  Workspace,
} from "./types";
import {
  Badge,
  CompanyMark,
  CompanyTable,
  Empty,
  ErrorBox,
  Metric,
  Modal,
  Notice,
  ProjectionChart,
  SearchBox,
} from "./components";

const navigation = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/screener", label: "Screener", icon: Compass },
  {
    path: "/research",
    label: "Research & Valuation",
    icon: ChartNoAxesCombined,
  },
  { path: "/portfolio", label: "Cartera", icon: Wallet },
  { path: "/markets", label: "Market Intelligence", icon: Globe2 },
  { path: "/library", label: "Knowledge Library", icon: BookOpen },
  { path: "/watchlist", label: "Seguimiento", icon: Star },
  { path: "/assistant", label: "Asistente", icon: Sparkles },
];
const routeNow = () => window.location.hash.slice(1) || "/dashboard";

export default function App() {
  const [username, setUsername] = useState<string | null>(null),
    [checking, setChecking] = useState(true),
    [route, setRoute] = useState(routeNow),
    [data, setData] = useState<Workspace | null>(null),
    [error, setError] = useState(""),
    [mobile, setMobile] = useState(false),
    [theme, setTheme] = useState(
      () => localStorage.getItem("iip-theme") || "dark",
    );
  useEffect(() => {
    api<{ username: string }>("/auth/me")
      .then((x) => setUsername(x.username))
      .catch(() => {})
      .finally(() => setChecking(false));
    const listener = () => {
      setRoute(routeNow());
      setMobile(false);
    };
    const expired = () => {
      setUsername(null);
      setData(null);
    };
    window.addEventListener("hashchange", listener);
    window.addEventListener("session-expired", expired);
    return () => {
      window.removeEventListener("hashchange", listener);
      window.removeEventListener("session-expired", expired);
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("iip-theme", theme);
  }, [theme]);
  const refresh = useCallback(async () => {
    setError("");
    try {
      const [companies, watch, portfolio, documents, valuations, health] =
        await Promise.all([
          api<Company[]>("/companies"),
          api<Watch[]>("/watchlist"),
          api<Portfolio>("/portfolio"),
          api<Document[]>("/library"),
          api<SavedValuation[]>("/valuations"),
          api<Health>("/health"),
        ]);
      setData({ companies, watch, portfolio, documents, valuations, health });
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    if (username) void refresh();
  }, [username, refresh]);
  const logout = async () => {
    try {
      await api("/auth/logout", "POST");
      setUsername(null);
      setData(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  if (checking)
    return <div className="loading">Abriendo tu espacio de investigación…</div>;
  if (!username) return <Auth onLogin={setUsername} />;
  const section = route.split("/")[1],
    selected = data?.companies.find((c) => c.id === route.split("/")[2]);
  const title =
    navigation.find((n) => route.startsWith(n.path))?.label || "Configuración";
  return (
    <div className="shell">
      <a
        className="skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Saltar al contenido
      </a>
      <aside className={"sidebar " + (mobile ? "open" : "")}>
        <button
          className="icon-button mobile-nav-close"
          onClick={() => setMobile(false)}
          aria-label="Cerrar navegación"
        >
          <X size={18} />
        </button>
        <a className="brand" href="#/dashboard">
          <span className="brand-symbol">
            i<span>i</span>p
          </span>
          <div>
            <b>
              Investment
              <br />
              Intelligence
            </b>
            <small>PRIVATE WORKSPACE</small>
          </div>
        </a>
        <div className="workspace-label">
          <span className="workspace-dot" /> Mi espacio privado{" "}
          <ChevronDown size={13} />
        </div>
        <p className="nav-caption">INVESTIGACIÓN</p>
        <nav aria-label="Navegación principal">
          {navigation.map((n) => (
            <a
              key={n.path}
              href={"#" + n.path}
              className={route.startsWith(n.path) ? "active" : ""}
              aria-current={route.startsWith(n.path) ? "page" : undefined}
            >
              <n.icon size={18} />
              {n.label}
              {n.path === "/watchlist" && !!data?.watch.length && (
                <span className="nav-count">{data.watch.length}</span>
              )}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy">
            <ShieldCheck size={18} />
            <span>
              Tu investigación, privada<small>Documentos en este equipo</small>
            </span>
          </div>
          <a
            className={section === "settings" ? "active" : ""}
            href="#/settings"
          >
            <Settings size={18} />
            Configuración
          </a>
          <button
            className="profile"
            onClick={() => void logout()}
            aria-label="Cerrar sesión"
          >
            <span className="avatar">{username.slice(0, 2).toUpperCase()}</span>
            <span>
              <b>{username}</b>
              <small>Sesión local</small>
            </span>
            <LogOut size={16} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-toggle"
              onClick={() => setMobile(!mobile)}
              aria-label="Abrir navegación"
            >
              {mobile ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span>Mi espacio</span>
            <span className="slash">/</span>
            <b>{title}</b>
          </div>
          <div className="top-actions">
            <button
              className="header-search"
              onClick={() => go("/search")}
              aria-label="Buscar en IIP"
            >
              <Search size={16} />
              <span>Buscar en IIP</span>
            </button>
            <span className="local-status">
              <i />
              Local
            </span>
            <button
              className="icon-button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={
                theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"
              }
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>
        <div className="environment">
          <span className="demo-dot" />
          <b>
            {data?.health.data_mode === "real"
              ? "MODO REAL · SIN PROVEEDOR"
              : "ENTORNO DEMO"}
          </b>
          <span>
            {data?.health.data_mode === "real"
              ? "No hay datos financieros disponibles."
              : "Empresas y operaciones de prueba. El material del curso es original."}
          </span>
        </div>
        <main id="main" tabIndex={-1}>
          <ErrorBox error={error} />
          {!data ? (
            <div className="loading">
              {error ? (
                <button onClick={() => void refresh()}>
                  Reintentar conexión
                </button>
              ) : (
                "Cargando datos locales…"
              )}
            </div>
          ) : (
            <>
              {section === "dashboard" && <Dashboard data={data} />}
              {section === "screener" && <Screener data={data} />}
              {section === "research" &&
                (selected ? (
                  <Research
                    key={selected.id}
                    company={selected}
                    data={data}
                    refresh={refresh}
                  />
                ) : (
                  <>
                    <PageTitle
                      eyebrow="RESEARCH & VALUATION"
                      title="Entiende el negocio. Revisa el valor."
                      description="Elige una compañía para explorar los datos y construir tus hipótesis."
                    />
                    <CompanyTable companies={data.companies} />
                    {!data.companies.length && <Unavailable />}
                  </>
                ))}
              {section === "portfolio" && (
                <PortfolioPage data={data} refresh={refresh} />
              )}
              {section === "library" && (
                <Library key={route} data={data} route={route} />
              )}
              {(section === "assistant" || section === "search") && (
                <EvidenceSearch
                  global={section === "search"}
                  companies={data.companies}
                />
              )}
              {section === "watchlist" && (
                <Watchlist data={data} refresh={refresh} />
              )}
              {section === "markets" && (
                <>
                  <PageTitle
                    eyebrow="MARKET INTELLIGENCE"
                    title="Contexto para tus decisiones"
                    description="Fuentes y actualizaciones verificables antes de generar señales."
                  />
                  <Empty
                    title="Fuentes de mercado pendientes de conexión"
                    text="Noticias, macroeconomía, eventos corporativos y mercados de predicción se incorporarán en una fase posterior. No hay informes programados ni alertas activas."
                  />
                  <div className="panel">
                    <h3>Fuentes evaluadas</h3>
                    <div className="source-list">
                      <a
                        href="https://www.sec.gov/search-filings/edgar-application-programming-interfaces"
                        target="_blank"
                        rel="noreferrer"
                      >
                        SEC EDGAR <ExternalLink size={14} />
                      </a>
                      <a
                        href="https://data.ecb.europa.eu/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Banco Central Europeo <ExternalLink size={14} />
                      </a>
                      <a
                        href="https://docs.polymarket.com/market-data/overview"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Polymarket · datos de mercados{" "}
                        <ExternalLink size={14} />
                      </a>
                    </div>
                    <p className="muted">
                      Consulta de documentación. Integraciones aún sin activar.
                    </p>
                  </div>
                </>
              )}
              {section === "settings" && <SettingsPage data={data} />}
              {![
                "dashboard",
                "screener",
                "research",
                "portfolio",
                "library",
                "assistant",
                "search",
                "watchlist",
                "markets",
                "settings",
              ].includes(section) && (
                <Empty
                  title="Página no encontrada"
                  text="Vuelve al dashboard para continuar."
                  action={() => go("/dashboard")}
                  label="Volver al dashboard"
                />
              )}
            </>
          )}
          <footer className="page-footer">
            <span>
              IIP{" "}
              <span className="muted">/ Investment Intelligence Platform</span>
            </span>
            <span>Investigación educativa · v0.1 local</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

function Auth({ onLogin }: { onLogin: (name: string) => void }) {
  const [setup, setSetup] = useState(false),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    api<{ setup_required: boolean }>("/auth/status")
      .then((x) => {
        setSetup(x.setup_required);
        setReady(true);
      })
      .catch((e) => setError(e.message));
  }, []);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget),
      body = { username: f.get("username"), password: f.get("password") };
    try {
      if (setup) await api("/auth/setup", "POST", body);
      const result = await api<{ username: string }>(
        "/auth/login",
        "POST",
        body,
      );
      onLogin(result.username);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="auth-page">
      <div className="auth-story">
        <span className="brand-symbol large">
          i<span>i</span>p
        </span>
        <Badge tone="green">INVESTMENT INTELLIGENCE PLATFORM</Badge>
        <h1>
          Investiga con criterio.
          <br />
          <em>Decide con evidencia.</em>
        </h1>
        <p>
          Un espacio privado para conectar conocimiento, análisis de empresas y
          seguimiento de tus inversiones.
        </p>
        <div className="auth-points">
          <span>
            <BookOpen size={19} />
            Conocimiento con fuentes
          </span>
          <span>
            <ChartNoAxesCombined size={19} />
            Valoraciones reproducibles
          </span>
          <span>
            <ShieldCheck size={19} />
            Datos en tu equipo
          </span>
        </div>
        <small>VERSIÓN LOCAL · ENTORNO DEMO</small>
      </div>
      <section className="auth-card">
        <span className="eyebrow">TU ESPACIO PRIVADO</span>
        <h2>{setup ? "Crea tu primera cuenta" : "Bienvenido a IIP"}</h2>
        <p>
          {setup
            ? "La cuenta se crea en este equipo. Después podrás añadir un segundo usuario desde Configuración."
            : "Inicia sesión para continuar tu investigación."}
        </p>
        <form onSubmit={(e) => void submit(e)}>
          <label>
            Usuario
            <input
              name="username"
              required
              minLength={3}
              maxLength={60}
              pattern="[a-zA-Z0-9_.@\-]+"
              autoComplete="username"
              placeholder="Tu nombre de usuario"
            />
          </label>
          <label>
            Contraseña
            <input
              name="password"
              type="password"
              required
              minLength={12}
              maxLength={128}
              autoComplete={setup ? "new-password" : "current-password"}
              placeholder="Al menos 12 caracteres"
            />
          </label>
          <ErrorBox error={error} />
          <button className="primary full" disabled={!ready || busy}>
            {busy
              ? "Procesando…"
              : setup
                ? "Crear cuenta y entrar"
                : "Entrar al espacio"}
            <ArrowRight size={17} />
          </button>
        </form>
        <div className="auth-note">
          <ShieldCheck size={17} />
          <span>
            Acceso local con sesión privada. Sin conexión a brokers ni compras
            reales.
          </span>
        </div>
      </section>
    </div>
  );
}

function PageTitle({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
function Unavailable() {
  return (
    <Empty
      title="Datos no disponibles"
      text="El modo real requiere un proveedor configurado y una revisión de cobertura y licencias. No se sustituyen datos ausentes por cifras sintéticas."
    />
  );
}

function Dashboard({ data }: { data: Workspace }) {
  const p = data.portfolio,
    pdfPages = data.documents
      .filter((d) => d.format === "pdf")
      .reduce((a, d) => a + d.page_count, 0);
  return (
    <>
      <PageTitle
        eyebrow="TU INVESTIGACIÓN, EN PERSPECTIVA"
        title="Resumen de investigación"
        description="Conecta tus hipótesis, tus fuentes y las empresas que sigues."
      >
        <button className="primary" onClick={() => go("/screener")}>
          Explorar empresas <ArrowRight size={16} />
        </button>
      </PageTitle>
      <div className="metric-grid">
        <Metric
          label="Valor de posiciones DEMO"
          value={money(p.market_value)}
          note="Snapshot sintético · 31 dic 2025"
        />
        <Metric
          label="Empresas en seguimiento"
          value={String(data.watch.length).padStart(2, "0")}
          note="Tu lista privada"
        />
        <Metric
          label="Biblioteca del curso"
          value={String(data.documents.length)}
          note={`${num(pdfPages, 0)} páginas PDF extraídas`}
        />
        <Metric
          label="Valoraciones guardadas"
          value={String(data.valuations.length).padStart(2, "0")}
          note="Hipótesis y resultados reproducibles"
        />
      </div>
      <div className="dashboard-grid">
        <section className="panel overview">
          <div className="section-heading">
            <div>
              <span className="eyebrow">EXPLORAR</span>
              <h2>Empresas para investigar</h2>
            </div>
            <Badge>DEMO</Badge>
          </div>
          <p className="muted">
            Universo ficticio para comprobar el proceso de análisis.
          </p>
          <CompanyTable companies={data.companies} compact />
          {!data.companies.length && <Unavailable />}
          <button className="text-button" onClick={() => go("/screener")}>
            Abrir screener <ArrowRight size={15} />
          </button>
        </section>
        <section className="panel research-path">
          <span className="eyebrow">PROCESO DE INVESTIGACIÓN</span>
          <h2>De la idea a la evidencia</h2>
          <p className="muted">Un flujo conectado y revisable.</p>
          {[
            {
              n: "01",
              title: "Explora una compañía",
              text: "Revisa datos, unidades y procedencia.",
              path: "/screener",
              done: false,
            },
            {
              n: "02",
              title: "Contrasta tus hipótesis",
              text: "Calcula el valor con supuestos explícitos.",
              path: "/research",
              done: !!data.valuations.length,
            },
            {
              n: "03",
              title: "Organiza el seguimiento",
              text: "Guarda empresas y registra operaciones.",
              path: "/watchlist",
              done: !!data.watch.length,
            },
            {
              n: "04",
              title: "Vuelve a las fuentes",
              text: "Consulta el documento y la página original.",
              path: "/library",
              done: !!data.documents.length,
            },
          ].map((x) => (
            <button className="path-step" key={x.n} onClick={() => go(x.path)}>
              <span className={"step-number " + (x.done ? "done" : "")}>
                {x.n}
              </span>
              <span>
                <b>{x.title}</b>
                <small>{x.text}</small>
              </span>
              <ArrowRight size={15} />
            </button>
          ))}
        </section>
      </div>
      <div className="dashboard-grid lower">
        <section className="panel">
          <div className="section-heading">
            <h2>Últimas valoraciones</h2>
            <ChartNoAxesCombined size={18} />
          </div>
          {data.valuations.length ? (
            <div className="saved-list">
              {data.valuations.slice(0, 3).map((v) => (
                <button
                  key={v.id}
                  onClick={() => go("/research/" + v.company_id)}
                >
                  <span>
                    {data.companies.find((c) => c.id === v.company_id)?.name ||
                      v.company_id}
                    <small>
                      {new Date(v.created_at).toLocaleDateString("es-ES")}
                    </small>
                  </span>
                  <b>
                    {money(v.result.value_per_share)}
                    <small>Estimación DEMO / acción</small>
                  </b>
                </button>
              ))}
            </div>
          ) : (
            <Empty
              title="Tu primera valoración"
              text="Abre una empresa, modifica las hipótesis del DCF y guarda el resultado."
              action={() => go("/research")}
              label="Iniciar análisis"
            />
          )}
        </section>
        <section className="panel knowledge-callout">
          <BookOpen size={25} />
          <span className="eyebrow">KNOWLEDGE LIBRARY</span>
          <h2>El conocimiento detrás del análisis</h2>
          <p>
            Busca conceptos en los módulos del curso y accede a las páginas que
            los explican.
          </p>
          <div className="tags">
            <span>Valoración</span>
            <span>Gestión del riesgo</span>
            <span>Renta variable</span>
          </div>
          <button className="secondary" onClick={() => go("/library")}>
            Consultar biblioteca <ArrowRight size={15} />
          </button>
          <small>
            Extracción automatizada · validación académica pendiente
          </small>
        </section>
      </div>
    </>
  );
}

function Screener({ data }: { data: Workspace }) {
  const [query, setQuery] = useState(""),
    [sector, setSector] = useState("Todos"),
    [minRoic, setMinRoic] = useState(""),
    [sort, setSort] = useState("name");
  const companies = data.companies
    .filter(
      (c) =>
        fold(c.name + c.ticker).includes(fold(query)) &&
        (sector === "Todos" || c.sector === sector) &&
        (minRoic === "" ||
          (c.roic !== null && Number(c.roic) * 100 >= Number(minRoic))),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "price"
          ? Number(a.price) - Number(b.price)
          : Number(b.roic ?? -Infinity) - Number(a.roic ?? -Infinity),
    );
  return (
    <>
      <PageTitle
        eyebrow="COMPANY SCREENER"
        title="Encuentra qué investigar"
        description="Filtra el universo DEMO con criterios explícitos. No hay puntuaciones ocultas."
      >
        <button
          className="secondary"
          onClick={() =>
            exportCSV(
              [
                [
                  "DEMO · No son datos reales",
                  "Ticker",
                  "Precio USD",
                  "PER",
                  "ROIC",
                ],
                ...companies.map((c) => [
                  c.name,
                  c.ticker,
                  c.price,
                  c.pe ?? "N/A",
                  c.roic ?? "N/A",
                ]),
              ],
              "iip-screener-DEMO.csv",
            )
          }
        >
          <Download size={16} />
          Exportar
        </button>
      </PageTitle>
      {!data.companies.length ? (
        <Unavailable />
      ) : (
        <div className="screener-layout">
          <aside className="panel filters">
            <div className="section-heading">
              <h3>Filtros</h3>
              <button
                className="text-button"
                onClick={() => {
                  setQuery("");
                  setSector("Todos");
                  setMinRoic("");
                }}
              >
                Limpiar
              </button>
            </div>
            <label>
              Sector
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
              >
                {["Todos", ...new Set(data.companies.map((c) => c.sector))].map(
                  (s) => (
                    <option key={s}>{s}</option>
                  ),
                )}
              </select>
            </label>
            <label>
              ROIC mínimo (%)
              <input
                type="number"
                value={minRoic}
                onChange={(e) => setMinRoic(e.target.value)}
                placeholder="Sin mínimo"
              />
            </label>
            <p className="muted">
              Criterio del usuario. Los valores no disponibles quedan excluidos
              si aplicas un mínimo.
            </p>
            <hr />
            <Badge>4 empresas ficticias</Badge>
            <p className="muted">
              Filtros estratégicos y comparables sectoriales pendientes.
            </p>
          </aside>
          <section className="panel">
            <div className="table-toolbar">
              <SearchBox
                value={query}
                onChange={setQuery}
                placeholder="Buscar empresa o ticker…"
                label="Buscar empresa"
              />
              <select
                aria-label="Ordenar empresas"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="name">Nombre A–Z</option>
                <option value="price">Precio ascendente</option>
                <option value="roic">ROIC descendente</option>
              </select>
            </div>
            <p className="muted">
              {companies.length} resultados · snapshot DEMO 31 dic 2025
            </p>
            <CompanyTable companies={companies} />
            {!companies.length && (
              <Empty
                title="Sin coincidencias"
                text="Modifica los filtros para ampliar la búsqueda."
              />
            )}
          </section>
        </div>
      )}
    </>
  );
}

function Research({
  company: c,
  data,
  refresh,
}: {
  company: Company;
  data: Workspace;
  refresh: () => Promise<void>;
}) {
  const defaults: Assumptions = {
    fcff: c.fcff,
    growth: c.growth,
    wacc: "0.10",
    terminal_growth: "0.02",
    net_debt: c.net_debt,
    shares: c.shares,
    price: c.price,
    years: 5,
  };
  const [scenario, setScenario] = useState("Base"),
    [cases, setCases] = useState<Record<string, Assumptions>>({
      Bajista: {
        ...defaults,
        growth: "0.02",
        wacc: "0.12",
        terminal_growth: "0.01",
      },
      Base: defaults,
      Alcista: {
        ...defaults,
        growth: "0.12",
        wacc: "0.09",
        terminal_growth: "0.025",
      },
    }),
    [result, setResult] = useState<DCF | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [advanced, setAdvanced] = useState(false);
  const [sensitivity, setSensitivity] = useState<
    { wacc: string; g: string; value: string }[]
  >([]);
  const a = cases[scenario],
    watched = data.watch.some((w) => w.company_id === c.id);
  const calculate = async (save = false) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await api<DCF>("/valuations", "POST", {
        company_id: c.id,
        assumptions: a,
        save,
      });
      setResult(r);
      const cells = [-0.01, 0, 0.01]
        .flatMap((w) =>
          [-0.005, 0, 0.005].map((g) => ({
            wacc: (Number(a.wacc) + w).toFixed(4),
            g: (Number(a.terminal_growth) + g).toFixed(4),
          })),
        )
        .filter(
          (x) =>
            Number(x.wacc) > Number(x.g) &&
            Number(x.wacc) > 0 &&
            Number(x.wacc) <= 0.5 &&
            Number(x.g) >= -0.05 &&
            Number(x.g) <= 0.08,
        );
      const grid = await Promise.all(
        cells.map(async (x) => {
          const cell = await api<DCF>("/valuations", "POST", {
            company_id: c.id,
            assumptions: { ...a, wacc: x.wacc, terminal_growth: x.g },
          });
          return { ...x, value: cell.value_per_share };
        }),
      );
      setSensitivity(grid);
      if (save) {
        setMessage("Valoración guardada con sus hipótesis.");
        await refresh();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const toggleWatch = async () => {
    try {
      await api("/watchlist/" + c.id, watched ? "DELETE" : "PUT");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const change = (key: keyof Assumptions, value: string) => {
    setCases({
      ...cases,
      [scenario]: { ...a, [key]: key === "years" ? Number(value) : value },
    });
    setResult(null);
    setSensitivity([]);
    setMessage("");
  };
  return (
    <>
      <div className="research-heading">
        <div className="company-cell">
          <CompanyMark company={c} />
          <div>
            <div className="inline">
              <span className="eyebrow">
                {c.ticker} / {c.exchange}
              </span>
              <Badge>DEMO</Badge>
            </div>
            <h1>{c.name}</h1>
            <p className="muted">
              {c.sector} · {c.country} · USD
            </p>
          </div>
        </div>
        <div className="research-actions">
          <button
            className={watched ? "secondary selected" : "secondary"}
            onClick={() => void toggleWatch()}
          >
            <Star size={16} fill={watched ? "currentColor" : "none"} />
            {watched ? "En seguimiento" : "Añadir a seguimiento"}
          </button>
          <button className="primary" onClick={() => go("/portfolio")}>
            <Plus size={16} />
            Registrar operación
          </button>
        </div>
      </div>
      <p className="company-description">{c.description}</p>
      <div className="metric-grid">
        <Metric
          label="Precio de referencia DEMO"
          value={money(c.price)}
          note="Snapshot · 31 dic 2025"
        />
        <Metric
          label="Ingresos FY2025"
          value={num(c.revenue, 0) + " M USD"}
          note="Dato sintético · no reportado"
        />
        <Metric
          label="ROIC"
          value={pct(c.roic)}
          note={
            c.roic
              ? "Supuesto sintético del proveedor"
              : "No aplicable · sector financiero"
          }
        />
        <Metric
          label="PER"
          value={c.pe ? num(c.pe, 1) + "×" : "N/A"}
          note="Precio × acciones / beneficio neto"
        />
      </div>
      <div className="section-tabs">
        <button
          className={!advanced ? "active" : ""}
          onClick={() => setAdvanced(false)}
        >
          Vista ejecutiva
        </button>
        <button
          className={advanced ? "active" : ""}
          onClick={() => setAdvanced(true)}
        >
          Datos y procedencia
        </button>
      </div>
      <ErrorBox error={error} />
      {message && (
        <p className="success" role="status">
          {message}
        </p>
      )}
      {advanced ? (
        <section className="panel">
          <h2>Observaciones financieras</h2>
          <p className="muted">
            Fuente: {c.source}. Publicación y actualización: 1 feb 2026. Divisa:
            USD.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Indicador</th>
                  <th>Valor</th>
                  <th>Unidad</th>
                  <th>Período</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {c.observations.map((o) => (
                  <tr key={o.metric}>
                    <td>{o.metric}</td>
                    <td>{o.value ?? "N/A"}</td>
                    <td>{o.unit}</td>
                    <td>{o.period}</td>
                    <td>DEMO · sintético</td>
                    <td>{o.availability}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Notice>
            ROIC es un supuesto sintético; no hay un cálculo validado con
            estados financieros reportados. Los ratios PER y P/B no se calculan
            con denominadores negativos.
          </Notice>
        </section>
      ) : !c.dcf_applicable ? (
        <Empty
          title="Este modelo no es apropiado"
          text="Las entidades financieras requieren modelos específicos. El DCF FCFF simplificado tampoco admite un flujo base negativo. No se ofrece una valoración engañosa."
        />
      ) : (
        <div className="valuation-layout">
          <section className="panel assumptions">
            <div className="section-heading">
              <div>
                <span className="eyebrow">HIPÓTESIS EXPLÍCITAS</span>
                <h2>Modelo DCF</h2>
              </div>
              <Badge tone="green">FCFF</Badge>
            </div>
            <label>
              Escenario
              <select
                value={scenario}
                disabled={busy}
                onChange={(e) => {
                  setScenario(e.target.value);
                  setResult(null);
                  setSensitivity([]);
                  setMessage("");
                }}
              >
                {["Bajista", "Base", "Alcista"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <p className="muted">
              Supuestos iniciales ilustrativos y editables. Sin probabilidades
              asignadas.
            </p>
            <div className="form-grid">
              {[
                { key: "fcff", label: "FCFF base (M USD)", rate: false },
                { key: "growth", label: "Crecimiento anual (%)", rate: true },
                { key: "wacc", label: "WACC (%)", rate: true },
                {
                  key: "terminal_growth",
                  label: "Crecimiento perpetuo (%)",
                  rate: true,
                },
                { key: "net_debt", label: "Deuda neta (M USD)", rate: false },
                { key: "shares", label: "Acciones diluidas (M)", rate: false },
                {
                  key: "price",
                  label: "Precio de referencia (USD)",
                  rate: false,
                },
                { key: "years", label: "Años de proyección", rate: false },
              ].map((f) => (
                <label key={f.key}>
                  {f.label}
                  <input
                    type="number"
                    step={f.key === "years" ? "1" : "any"}
                    disabled={busy}
                    value={
                      f.rate
                        ? Number(a[f.key as keyof Assumptions]) * 100
                        : a[f.key as keyof Assumptions]
                    }
                    onChange={(e) =>
                      change(
                        f.key as keyof Assumptions,
                        f.rate
                          ? String(Number(e.target.value) / 100)
                          : e.target.value,
                      )
                    }
                  />
                </label>
              ))}
            </div>
            <button
              className="primary full"
              disabled={busy}
              onClick={() => void calculate()}
            >
              {busy ? "Calculando…" : "Calcular escenario"}
              <ArrowRight size={16} />
            </button>
            <button
              className="secondary full"
              disabled={busy || !result}
              onClick={() => void calculate(true)}
            >
              Guardar valoración
            </button>
            <p className="muted small">
              FCFF descontado con WACC. Valores en millones, salvo precio y
              valor por acción.
            </p>
          </section>
          <section className="panel valuation-result">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  VALORACIÓN / {scenario.toUpperCase()}
                </span>
                <h2>Un valor sujeto a hipótesis</h2>
              </div>
              <Activity size={19} />
            </div>
            {!result ? (
              <Empty
                title="Construye tu escenario"
                text="Revisa los supuestos y calcula para ver las proyecciones, el puente a equity y la sensibilidad."
              />
            ) : (
              <>
                <div className="valuation-summary">
                  <div>
                    <small>Valor estimado / acción DEMO</small>
                    <strong>{money(result.value_per_share)}</strong>
                  </div>
                  <div>
                    <small>Margen de seguridad*</small>
                    <b
                      className={
                        Number(result.margin_of_safety) >= 0
                          ? "green"
                          : "negative"
                      }
                    >
                      {pct(result.margin_of_safety)}
                    </b>
                  </div>
                </div>
                <div className="chart-heading">
                  <span>FCFF proyectado</span>
                  <small>Millones USD · estimaciones DEMO</small>
                </div>
                <ProjectionChart result={result} />
                <div className="bridge">
                  <span>
                    Enterprise value <b>{num(result.enterprise_value)} M</b>
                  </span>
                  <span>
                    − Deuda neta <b>{num(a.net_debt)} M</b>
                  </span>
                  <span>
                    Equity value <b>{num(result.equity_value)} M</b>
                  </span>
                </div>
                <p className="muted small">
                  * (Valor estimado − precio de referencia) / valor estimado.
                  N/D si el equity no es positivo.
                </p>
                <details>
                  <summary>Ver flujos y descuentos</summary>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Año</th>
                          <th>FCFF (M USD)</th>
                          <th>Valor presente</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.projections.map((p) => (
                          <tr key={p.year}>
                            <td>{p.year}</td>
                            <td>{num(p.fcff)}</td>
                            <td>{num(p.present_value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p>
                    Valor terminal: {num(result.terminal_value)} M USD. Valor
                    presente terminal: {num(result.pv_terminal)} M USD (
                    {pct(result.terminal_share)} del EV).
                  </p>
                </details>
                <details>
                  <summary>Sensibilidad a WACC y crecimiento perpetuo</summary>
                  <p className="muted small">
                    Valor por acción (USD), manteniendo los demás supuestos del
                    escenario.
                  </p>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>WACC</th>
                          <th>g perpetuo</th>
                          <th>USD/acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sensitivity.map((s) => (
                          <tr key={s.wacc + s.g}>
                            <td>{pct(s.wacc)}</td>
                            <td>{pct(s.g)}</td>
                            <td>{money(s.value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
                {result.warnings.map((w) => (
                  <Notice key={w}>{w}</Notice>
                ))}
              </>
            )}
          </section>
        </div>
      )}
      <section className="panel method-link">
        <BookOpen size={21} />
        <div>
          <h3>Contrasta la metodología con el curso</h3>
          <p>
            Busca DCF, WACC o margen de seguridad y revisa la página original.
          </p>
        </div>
        <button className="secondary" onClick={() => go("/assistant")}>
          Consultar fuentes <ArrowRight size={15} />
        </button>
      </section>
    </>
  );
}

function PortfolioPage({
  data,
  refresh,
}: {
  data: Workspace;
  refresh: () => Promise<void>;
}) {
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [kind, setKind] = useState("BUY");
  const p = data.portfolio;
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(form);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api("/trades", "POST", {
        company_id: f.get("company"),
        kind,
        quantity: kind === "DIVIDEND" ? "0" : f.get("quantity"),
        price: f.get("price"),
        fees: f.get("fees"),
        occurred_at: f.get("date"),
        currency: "USD",
      });
      await refresh();
      form.reset();
      setKind("BUY");
      setMessage("Operación DEMO registrada en el libro.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageTitle
        eyebrow="PORTFOLIO MANAGEMENT"
        title="Cartera de investigación"
        description="Un libro manual de operaciones DEMO con posiciones y coste medio auditables."
      />
      <div className="metric-grid">
        <Metric
          label="Valor de posiciones"
          value={money(p.market_value)}
          note="Snapshot DEMO · 31 dic 2025"
        />
        <Metric
          label="Coste de posiciones abiertas"
          value={money(p.cost)}
          note="Incluye comisiones de compra"
        />
        <Metric
          label="Resultado no realizado"
          value={money(p.unrealized)}
          note="Valor snapshot menos coste abierto"
          positive={Number(p.unrealized) > 0}
        />
        <Metric
          label="Dividendos netos de comisiones"
          value={money(p.dividends)}
          note="Sin cálculo fiscal"
        />
      </div>
      <Notice>
        Las posiciones se valoran con un snapshot sintético fijo. No es
        patrimonio actual ni rentabilidad histórica. TWR, MWR, efectivo,
        impuestos y FX están pendientes.
      </Notice>
      <div className="portfolio-layout">
        <section className="panel">
          <div className="section-heading">
            <h2>Posiciones abiertas</h2>
            <Badge>{p.positions.length} posiciones</Badge>
          </div>
          {p.positions.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Empresa</th>
                    <th>Acciones</th>
                    <th>Coste USD</th>
                    <th>Valor DEMO</th>
                    <th>Peso</th>
                  </tr>
                </thead>
                <tbody>
                  {p.positions.map((x) => (
                    <tr key={x.company_id}>
                      <td>
                        <button
                          className="text-button"
                          onClick={() => go("/research/" + x.company_id)}
                        >
                          {data.companies.find((c) => c.id === x.company_id)
                            ?.name || x.company_id}
                        </button>
                      </td>
                      <td>{num(x.quantity, 4)}</td>
                      <td>{money(x.cost)}</td>
                      <td>{money(x.value)}</td>
                      <td>
                        {p.market_value && Number(p.market_value) > 0
                          ? pct(Number(x.value) / Number(p.market_value))
                          : "N/D"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="Aún no hay posiciones"
              text="Registra una compra de prueba para revisar cómo se calculan las posiciones y su coste."
            />
          )}
          <p className="muted">
            Resultado realizado por ventas: {money(p.realized)}.
          </p>
        </section>
        <section className="panel">
          <span className="eyebrow">LIBRO DE OPERACIONES</span>
          <h2>Registrar movimiento</h2>
          <ErrorBox error={error} />
          {message && (
            <p className="success" role="status">
              {message}
            </p>
          )}
          <form onSubmit={(e) => void submit(e)}>
            <label>
              Empresa
              <select name="company" required>
                {data.companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.ticker})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Operación
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="BUY">Compra manual DEMO</option>
                <option value="SELL">Venta manual DEMO</option>
                <option value="DIVIDEND">Dividendo manual DEMO</option>
              </select>
            </label>
            <div className="form-grid">
              {kind !== "DIVIDEND" && (
                <label>
                  Acciones
                  <input
                    name="quantity"
                    type="number"
                    required
                    min="0.000001"
                    step="any"
                  />
                </label>
              )}
              <label>
                {kind === "DIVIDEND"
                  ? "Importe bruto total (USD)"
                  : "Precio por acción (USD)"}
                <input
                  name="price"
                  type="number"
                  required
                  min="0.000001"
                  step="any"
                />
              </label>
              <label>
                Comisiones (USD)
                <input
                  name="fees"
                  type="number"
                  required
                  min="0"
                  step="any"
                  defaultValue="0"
                />
              </label>
              <label>
                Fecha
                <input
                  name="date"
                  type="date"
                  required
                  defaultValue="2025-12-31"
                />
              </label>
            </div>
            <button
              className="primary full"
              disabled={busy || !data.companies.length}
            >
              {busy ? "Registrando…" : "Registrar operación DEMO"}
              <Plus size={16} />
            </button>
          </form>
        </section>
      </div>
      <section className="panel">
        <div className="section-heading">
          <h2>Historial de operaciones</h2>
          <button
            className="text-button"
            onClick={() =>
              exportCSV(
                [
                  [
                    "ID",
                    "Empresa DEMO",
                    "Tipo",
                    "Cantidad",
                    "Precio / total dividendo USD",
                    "Comisiones USD",
                    "Fecha",
                  ],
                  ...p.trades.map((t) => [
                    t.id,
                    t.company_id,
                    t.kind,
                    t.quantity,
                    t.price,
                    t.fees,
                    t.occurred_at,
                  ]),
                ],
                "iip-operaciones-DEMO.csv",
              )
            }
          >
            <Download size={15} />
            Exportar
          </button>
        </div>
        {p.trades.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Empresa</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Precio / total div.</th>
                  <th>Comisiones</th>
                </tr>
              </thead>
              <tbody>
                {p.trades.map((t) => (
                  <tr key={t.id}>
                    <td>{t.occurred_at}</td>
                    <td>{t.company_id}</td>
                    <td>
                      <Badge>
                        {t.kind === "BUY"
                          ? "Compra"
                          : t.kind === "SELL"
                            ? "Venta"
                            : "Dividendo"}
                      </Badge>
                    </td>
                    <td>{num(t.quantity, 4)}</td>
                    <td>{money(t.price)}</td>
                    <td>{money(t.fees)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No hay movimientos registrados.</p>
        )}
      </section>
    </>
  );
}

function Library({ data, route }: { data: Workspace; route: string }) {
  const [q, setQ] = useState(""),
    [module, setModule] = useState("Todos"),
    [view, setView] = useState<Document | null>(
      () => data.documents.find((d) => d.id === route.split("/")[2]) ?? null,
    );
  const documents = data.documents.filter(
    (d) =>
      fold(d.name + " " + Object.keys(d.methods).join(" ")).includes(fold(q)) &&
      (module === "Todos" || d.module === module),
  );
  return (
    <>
      <PageTitle
        eyebrow="KNOWLEDGE LIBRARY"
        title="Conocimiento con origen"
        description="Tus módulos del curso, organizados y consultables. Cada referencia vuelve al original."
      >
        <button className="primary" onClick={() => go("/assistant")}>
          <Search size={16} />
          Buscar en el contenido
        </button>
      </PageTitle>
      <div className="metric-grid three">
        <Metric
          label="Documentos catalogados"
          value={String(data.documents.length)}
          note={`${new Set(data.documents.map((d) => d.module)).size} módulos del curso`}
        />
        <Metric
          label="Extracción"
          value="Por página"
          note="Excel: referencias por hoja y celda"
        />
        <Metric
          label="Revisión académica"
          value="Pendiente"
          note="Las detecciones automáticas requieren validación"
        />
      </div>
      <section className="panel">
        <div className="table-toolbar">
          <SearchBox
            value={q}
            onChange={setQ}
            placeholder="Filtrar por título o metodología detectada…"
            label="Filtrar biblioteca"
          />
          <select
            value={module}
            onChange={(e) => setModule(e.target.value)}
            aria-label="Filtrar por módulo"
          >
            <option>Todos</option>
            {[...new Set(data.documents.map((d) => d.module))].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <p className="muted">
          {documents.length} documentos · los duplicados conservan su referencia
          original
        </p>
        <div className="document-grid">
          {documents.slice(0, 40).map((d) => (
            <button
              key={d.id}
              className="document-card"
              onClick={() => setView(d)}
            >
              <div className="document-top">
                <span className="doc-icon">
                  <BookOpen size={21} />
                </span>
                <Badge>{d.format.toUpperCase()}</Badge>
              </div>
              <small>{d.module}</small>
              <h3>{d.name.replace(/\.pdf$|\.xlsx$/i, "")}</h3>
              <div className="doc-bottom">
                <span>
                  {d.page_count} {d.format === "pdf" ? "páginas" : "hojas"}
                </span>
                <ArrowRight size={16} />
              </div>
              {d.low_text_pages.length > 0 && (
                <span className="small amber">
                  {d.low_text_pages.length} páginas/hojas con poco texto
                </span>
              )}
            </button>
          ))}
        </div>
        {documents.length > 40 && (
          <p className="muted">
            Se muestran los primeros 40 resultados. Filtra por módulo o título
            para acotar.
          </p>
        )}
        {!documents.length && (
          <Empty
            title="Sin documentos en esta vista"
            text="Revisa el filtro o ejecuta la ingesta local indicada en el README."
          />
        )}
      </section>
      {view && (
        <Modal onClose={() => setView(null)} titleId="document-title">
          <section className="document-modal">
            <div className="modal-header">
              <div>
                <Badge>{view.format.toUpperCase()}</Badge>
                <h2 id="document-title">{view.name}</h2>
              </div>
              <button
                className="icon-button"
                aria-label="Cerrar documento"
                onClick={() => setView(null)}
                autoFocus
              >
                <X size={22} />
              </button>
            </div>
            <p className="muted">
              Extracción automatizada. Revisión académica pendiente.{" "}
              {view.duplicate_of ? "Duplicado identificado por SHA-256." : ""}
            </p>
            <div className="tags">
              {Object.keys(view.methods).map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
            <a
              className="secondary"
              href={"/api/library/" + view.id + "/original"}
              target="_blank"
              rel="noreferrer"
            >
              Abrir original protegido <ExternalLink size={15} />
            </a>
            {view.format === "pdf" ? (
              <PDFPages
                document={view}
                initialPage={Number(route.split("/")[3]) || 1}
              />
            ) : (
              <Notice>
                Libro Excel con {view.page_count} hojas. La extracción conserva
                fórmulas como texto y no las recalcula. Abre el original para
                revisarlas.
              </Notice>
            )}
          </section>
        </Modal>
      )}
    </>
  );
}

function PDFPages({
  document: doc,
  initialPage,
}: {
  document: Document;
  initialPage: number;
}) {
  const [page, setPage] = useState(() =>
      Math.min(doc.page_count, Math.max(1, initialPage)),
    ),
    [loaded, setLoaded] = useState(false),
    [failed, setFailed] = useState(false);
  const change = (next: number) => {
    setPage(next);
    setLoaded(false);
    setFailed(false);
  };
  return (
    <div className="pdf-viewer">
      <div className="pdf-toolbar">
        <button
          className="secondary"
          disabled={page <= 1}
          onClick={() => change(page - 1)}
        >
          Anterior
        </button>
        <label>
          Página
          <select
            aria-label="Página del documento"
            value={page}
            onChange={(e) => change(Number(e.target.value))}
          >
            {Array.from({ length: doc.page_count }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1} de {doc.page_count}
              </option>
            ))}
          </select>
        </label>
        <button
          className="secondary"
          disabled={page >= doc.page_count}
          onClick={() => change(page + 1)}
        >
          Siguiente
        </button>
      </div>
      {failed ? (
        <ErrorBox error="No se pudo mostrar la página. Comprueba Poppler en el equipo o abre el original protegido." />
      ) : (
        <>
          {!loaded && (
            <p className="muted" role="status">
              Preparando página {page}…
            </p>
          )}
          <div className="pdf-page">
            <img
              key={page}
              src={`/api/library/${doc.id}/preview/${page}.png`}
              alt={`Página ${page} de ${doc.name}`}
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
            />
          </div>
        </>
      )}
    </div>
  );
}

function EvidenceSearch({
  global,
  companies,
}: {
  global: boolean;
  companies: Company[];
}) {
  const [query, setQuery] = useState(""),
    [results, setResults] = useState<Evidence[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [searched, setSearched] = useState(false),
    [activeQuery, setActiveQuery] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSearched(false);
    try {
      const r = await api<{ results: Evidence[] }>(
        "/library/search?q=" + encodeURIComponent(query),
      );
      setResults(r.results);
      setActiveQuery(query);
      setSearched(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const matches = companies.filter((c) =>
    fold(c.name + c.ticker).includes(fold(activeQuery)),
  );
  return (
    <>
      <PageTitle
        eyebrow={
          global ? "BÚSQUEDA GLOBAL" : "ASISTENTE / EVIDENCIA DOCUMENTAL"
        }
        title={
          global
            ? "Busca en tu investigación"
            : "Consulta las fuentes del curso"
        }
        description="Recuperación textual con referencias verificables. La respuesta generativa con IA aún no está conectada."
      />
      <form className="evidence-form" onSubmit={(e) => void submit(e)}>
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Prueba: WACC, margen de seguridad, ROIC…"
          label="Buscar en documentos"
        />
        <button className="primary" disabled={busy || query.trim().length < 2}>
          {busy ? "Buscando…" : "Buscar evidencia"}
          <ArrowRight size={17} />
        </button>
      </form>
      <ErrorBox error={error} />
      <Notice>
        Se muestran fragmentos originales, no una interpretación financiera. Los
        documentos son fuentes de información y sus instrucciones no se
        ejecutan. La búsqueda actual es textual; puede omitir sinónimos o
        contenido en imágenes.
      </Notice>
      {searched && (
        <p className="muted">
          {results.length} fragmentos para «{activeQuery}» · máximo 12 · orden
          por relevancia textual
        </p>
      )}
      {global && searched && !!matches.length && (
        <section className="panel">
          <h2>Empresas DEMO</h2>
          <CompanyTable companies={matches} compact />
        </section>
      )}
      {results.map((r, i) => (
        <article
          key={r.document_id + "-" + r.page_number}
          className="panel evidence"
        >
          <div className="section-heading">
            <Badge tone="green">FUENTE {i + 1}</Badge>
            <span className="muted">
              {r.locator_type === "page" ? "Página" : "Hoja"} {r.page_number}
            </span>
          </div>
          <h3>{r.name}</h3>
          <p className="muted small">{r.module}</p>
          <blockquote>
            {r.text.length > 1600 ? r.text.slice(0, 1600) + "…" : r.text}
          </blockquote>
          <a
            href={`#/library/${r.document_id}/${r.page_number}`}
            className="text-button"
          >
            Revisar original · {r.locator_type === "page" ? "página" : "hoja"}{" "}
            {r.page_number}
            <ExternalLink size={15} />
          </a>
          <details>
            <summary>
              Ver texto completo del fragmento (máx. 5000 caracteres)
            </summary>
            <pre className="source-text">{r.text}</pre>
          </details>
        </article>
      ))}
      {searched && !results.length && (
        <Empty
          title="No se ha recuperado evidencia"
          text="No hay base documental suficiente para responder esta consulta. Prueba términos más concretos o abre el original desde la biblioteca."
        />
      )}
      {!searched && !results.length && (
        <div className="query-suggestions">
          {["WACC", "margen de seguridad", "ROIC", "diversificación"].map(
            (q) => (
              <button className="secondary" key={q} onClick={() => setQuery(q)}>
                {q}
              </button>
            ),
          )}
        </div>
      )}
    </>
  );
}

function Watchlist({
  data,
  refresh,
}: {
  data: Workspace;
  refresh: () => Promise<void>;
}) {
  const [error, setError] = useState("");
  const companies = data.companies.filter((c) =>
    data.watch.some((w) => w.company_id === c.id),
  );
  const remove = async (key: string) => {
    try {
      await api("/watchlist/" + key, "DELETE");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <>
      <PageTitle
        eyebrow="WATCHLISTS & ALERTS"
        title="Tu lista de seguimiento"
        description="Empresas guardadas para continuar la investigación. Las alertas automáticas aún no están configuradas."
      />
      <ErrorBox error={error} />
      {companies.length ? (
        <section className="panel">
          <CompanyTable companies={companies} />
          <div className="watch-actions">
            {companies.map((c) => (
              <button
                className="text-button muted"
                key={c.id}
                onClick={() => void remove(c.id)}
              >
                Quitar {c.ticker}
                <X size={13} />
              </button>
            ))}
          </div>
        </section>
      ) : (
        <Empty
          title="Una lista por construir"
          text="Añade una compañía desde su ficha para volver a ella cuando quieras."
          action={() => go("/screener")}
          label="Explorar empresas"
        />
      )}
    </>
  );
}

function SettingsPage({ data }: { data: Workspace }) {
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(form);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api("/auth/users", "POST", {
        username: f.get("username"),
        password: f.get("password"),
      });
      form.reset();
      setMessage(
        "Segundo usuario creado. Tiene su propia cartera, watchlist y valoraciones.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageTitle
        eyebrow="CONFIGURACIÓN"
        title="Tu espacio y tus datos"
        description="Configuración local, privacidad y estado real de las integraciones."
      />
      <div className="dashboard-grid">
        <section className="panel">
          <h2>Fuentes y capacidades</h2>
          <div className="settings-row">
            <span>Datos financieros</span>
            <Badge>
              {data.health.data_mode === "demo"
                ? "DEMO · sintéticos"
                : "No configurados"}
            </Badge>
          </div>
          <div className="settings-row">
            <span>Documentos del curso</span>
            <b>{data.documents.length} originales privados</b>
          </div>
          <div className="settings-row">
            <span>Modelo de IA</span>
            <span className="muted">Sin conectar</span>
          </div>
          <div className="settings-row">
            <span>Informes y alertas</span>
            <span className="muted">Sin programar</span>
          </div>
          <div className="settings-row">
            <span>Sesiones</span>
            <span className="muted">12 horas · cookie HttpOnly</span>
          </div>
          <Notice>
            Esta versión está preparada para uso local en este equipo. El acceso
            remoto requiere HTTPS, revisión de seguridad y una decisión de
            despliegue.
          </Notice>
        </section>
        <section className="panel">
          <h2>Añadir segundo usuario</h2>
          <p className="muted">
            Las dos cuentas comparten la biblioteca del curso. Sus registros de
            investigación y operaciones son privados.
          </p>
          <form onSubmit={(e) => void submit(e)}>
            <label>
              Usuario
              <input
                name="username"
                required
                minLength={3}
                maxLength={60}
                pattern="[a-zA-Z0-9_.@\-]+"
                autoComplete="off"
              />
            </label>
            <label>
              Contraseña
              <input
                name="password"
                type="password"
                required
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
              />
            </label>
            <ErrorBox error={error} />
            {message && (
              <p className="success" role="status">
                {message}
              </p>
            )}
            <button className="primary" disabled={busy}>
              {busy ? "Creando…" : "Crear segundo usuario"}
              <Plus size={16} />
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
