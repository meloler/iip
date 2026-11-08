export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch("/api" + path, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-IIP-Request": "1" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) {
    const message =
      typeof payload.detail === "string"
        ? payload.detail
        : Array.isArray(payload.detail)
          ? payload.detail
              .map(
                (e: { loc: string[]; msg: string }) =>
                  `${e.loc.slice(1).join(".")}: ${e.msg}`,
              )
              .join(" · ")
          : "No se pudo completar la solicitud";
    if (response.status === 401 && path != "/auth/login" && path != "/auth/me")
      window.dispatchEvent(new Event("session-expired"));
    throw new Error(message);
  }
  return payload as T;
}
export const num = (n: string | number | null | undefined, digits = 2) =>
  n == null
    ? "N/D"
    : new Intl.NumberFormat("es-ES", {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
      }).format(Number(n));
export const money = (n: string | number | null | undefined) =>
  n == null
    ? "N/D"
    : new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }).format(Number(n));
export const pct = (n: string | number | null | undefined) =>
  n == null ? "N/D" : num(Number(n) * 100, 1) + " %";
export const go = (path: string) => {
  window.location.hash = path;
};
export const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function exportCSV(rows: string[][], name: string) {
  const csv =
    "\uFEFF" +
    rows
      .map((row) =>
        row
          .map(
            (v) =>
              '"' +
              (/^[=+@-]/.test(v) ? "'" : "") +
              v.replaceAll('"', '""') +
              '"',
          )
          .join(";"),
      )
      .join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
