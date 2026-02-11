import { useEffect, useMemo, useState } from "react";
import { localDb } from "../lib/localDB";
import { OrdemServico } from "../types";

// ================================
// Helpers de data (LOCAL) - iguais ao original
// ================================
function ymdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeekLocal(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfWeekLocal(d: Date): Date {
  const s = startOfWeekLocal(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 7);
  return e;
}

function startOfMonthLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonthLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
}

function inRange(
  iso: string | null | undefined,
  start: Date,
  end: Date,
): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t < end.getTime();
}

function previsaoPagamento(os: OrdemServico): string {
  if ("previsao_entrega" in os && os.previsao_entrega) {
    return os.previsao_entrega;
  }

  const base = new Date(os.created_at);
  base.setDate(base.getDate() + 3);
  return ymdLocal(base);
}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateTimeBR(date: Date): string {
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ================================
// COMPONENTE
// ================================
interface DashboardProps {
  onSelectOS: (os: OrdemServico) => void;
}

type BadgeTone = "neutral" | "success" | "warning" | "danger";

function Badge({ tone, children }: { tone: BadgeTone; children: string }) {
  const cls: Record<BadgeTone, string> = {
    neutral: "border-yellow-500/20 bg-black/40 text-white/80",
    success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    warning: "border-yellow-400/35 bg-yellow-400/10 text-yellow-100",
    danger: "border-red-400/35 bg-red-400/10 text-red-100",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${cls[tone]}`}
    >
      {children}
    </span>
  );
}

function MetricCard({
  title,
  value,
  accent,
  hint,
}: {
  title: string;
  value: string;
  accent: "primary" | "warning" | "danger";
  hint?: string;
}) {
  const accentMap: Record<
    "primary" | "warning" | "danger",
    { ring: string; glow: string; bar: string; value: string }
  > = {
    primary: {
      ring: "ring-yellow-400/25",
      glow: "shadow-[0_0_0_1px_rgba(250,204,21,0.12),0_10px_30px_-12px_rgba(250,204,21,0.22)]",
      bar: "bg-yellow-400",
      value: "text-white",
    },
    warning: {
      ring: "ring-yellow-400/30",
      glow: "shadow-[0_0_0_1px_rgba(250,204,21,0.12),0_10px_30px_-12px_rgba(250,204,21,0.18)]",
      bar: "bg-yellow-300",
      value: "text-white",
    },
    danger: {
      ring: "ring-red-400/25",
      glow: "shadow-[0_0_0_1px_rgba(248,113,113,0.12),0_10px_30px_-12px_rgba(248,113,113,0.20)]",
      bar: "bg-red-400",
      value: "text-white",
    },
  };

  const a = accentMap[accent];

  return (
    <div
      className={[
        "w-full rounded-2xl border border-yellow-500/15 bg-black/60",
        "p-4 ring-1 backdrop-blur-md",
        a.ring,
        a.glow,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.18em] text-white/60">
            {title}
          </span>
          <span className={`text-2xl font-semibold tracking-tight ${a.value}`}>
            {value}
          </span>
          {hint ? <span className="text-xs text-white/55">{hint}</span> : null}
        </div>

        <div className="h-10 w-2 overflow-hidden rounded-full border border-yellow-500/20 bg-black/60">
          <div className={`h-full w-full ${a.bar}`} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ onSelectOS }: DashboardProps) {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);

  useEffect(() => {
    const lista = localDb.listOS();
    setOrdens(lista);
  }, []);

  const now = new Date();
  const hojeYMD = ymdLocal(now);

  const wStart = startOfWeekLocal(now);
  const wEnd = endOfWeekLocal(now);

  const mStart = startOfMonthLocal(now);
  const mEnd = endOfMonthLocal(now);

  const isDone = (os: OrdemServico): boolean =>
    os.status === "concluida" || os.status === "entregue";

  const isPaid = (os: OrdemServico): boolean =>
    "paid_at" in os && Boolean(os.paid_at);

  // ================================
  // FATURAMENTO (igual ao original)
  // ================================
  const faturamentoDia = useMemo<number>(() => {
    return ordens
      .filter((os) => isDone(os) && os.paid_at?.startsWith(hojeYMD))
      .reduce((acc, os) => acc + (os.valor_total || 0), 0);
  }, [ordens, hojeYMD]);

  const faturamentoSemana = useMemo<number>(() => {
    return ordens
      .filter((os) => isDone(os) && inRange(os.paid_at, wStart, wEnd))
      .reduce((acc, os) => acc + (os.valor_total || 0), 0);
  }, [ordens, wStart, wEnd]);

  const faturamentoMes = useMemo<number>(() => {
    return ordens
      .filter((os) => isDone(os) && inRange(os.paid_at, mStart, mEnd))
      .reduce((acc, os) => acc + (os.valor_total || 0), 0);
  }, [ordens, mStart, mEnd]);

  // ================================
  // PREVISTOS (igual ao original)
  // ================================
  const previstoSemana = useMemo<number>(() => {
    return ordens
      .filter((os) => !isPaid(os))
      .filter((os) => {
        const p = previsaoPagamento(os);
        const d = new Date(`${p}T00:00:00`);
        return d >= wStart && d < wEnd;
      })
      .reduce((acc, os) => acc + (os.valor_total || 0), 0);
  }, [ordens, wStart, wEnd]);

  const previstoMes = useMemo<number>(() => {
    return ordens
      .filter((os) => !isPaid(os))
      .filter((os) => {
        const p = previsaoPagamento(os);
        const d = new Date(`${p}T00:00:00`);
        return d >= mStart && d < mEnd;
      })
      .reduce((acc, os) => acc + (os.valor_total || 0), 0);
  }, [ordens, mStart, mEnd]);

  // ================================
  // ATRASADOS (igual ao original)
  // ================================
  const atrasados = useMemo<OrdemServico[]>(() => {
    return ordens.filter((os) => {
      if (isPaid(os)) return false;
      const p = previsaoPagamento(os);
      return p < hojeYMD;
    });
  }, [ordens, hojeYMD]);

  const atrasadosCount = atrasados.length;

  const atrasadosValor = useMemo<number>(() => {
    return atrasados.reduce((acc, os) => acc + (os.valor_total || 0), 0);
  }, [atrasados]);

  // Recentes (mantém o “slice(0,6)” do original)
  const recentes = useMemo<OrdemServico[]>(() => ordens.slice(0, 6), [ordens]);

  const temAtraso = atrasadosValor > 0;

  return (
    <div className="min-h-screen bg-black text-white pb-[calc(96px+env(safe-area-inset-bottom))]">
      {/* Background glow / textura */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-yellow-400/12 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-yellow-400/8 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(250,204,21,0.08)_1px,transparent_0)] [background-size:18px_18px] opacity-40" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pr-5 py-5 md:px-6 md:pr-6 md:py-7">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-yellow-400 shadow-[0_0_0_6px_rgba(250,204,21,0.12)]" />
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Dashboard
              </h1>
            </div>
            <span className="text-sm text-white/55">
              Atualizado em {formatDateTimeBR(new Date())}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Badge tone="neutral">{`OS: ${ordens.length.toString()}`}</Badge>
            <Badge tone={temAtraso ? "danger" : "success"}>
              {temAtraso ? "Tem atraso" : "Tudo ok"}
            </Badge>
          </div>
        </div>

        {/* ✅ MÉTRICAS EM GRID (mobile = 1 col; md = 3 col) */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricCard
            title="Faturamento do dia"
            value={formatCurrencyBRL(faturamentoDia)}
            accent="primary"
            hint="Pagos hoje (paid_at)"
          />
          <MetricCard
            title="Faturamento da semana"
            value={formatCurrencyBRL(faturamentoSemana)}
            accent="primary"
            hint="Pagos na semana (paid_at)"
          />
          <MetricCard
            title="Faturamento do mês"
            value={formatCurrencyBRL(faturamentoMes)}
            accent="primary"
            hint="Pagos no mês (paid_at)"
          />

          <MetricCard
            title="Previsto da semana"
            value={formatCurrencyBRL(previstoSemana)}
            accent="warning"
            hint="Não pago • por previsão"
          />
          <MetricCard
            title="Previsto do mês"
            value={formatCurrencyBRL(previstoMes)}
            accent="warning"
            hint="Não pago • por previsão"
          />

          {/* Clientes atrasados ocupa 1 coluna no mobile e 1 no desktop (já encaixa perfeito no grid) */}
          <div className="rounded-2xl border border-yellow-500/15 bg-black/60 p-4 ring-1 ring-yellow-400/10 backdrop-blur-md">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-[0.18em] text-white/60">
                  Clientes atrasados
                </span>
                <span className="text-2xl font-semibold tracking-tight text-white">
                  {atrasadosCount.toString()}
                </span>
                <span
                  className={`text-sm ${
                    temAtraso ? "text-red-200" : "text-white/55"
                  }`}
                >
                  {formatCurrencyBRL(atrasadosValor)}
                </span>
              </div>

              <span
                className={[
                  "inline-flex h-10 w-10 items-center justify-center rounded-xl border",
                  temAtraso
                    ? "border-red-400/25 bg-red-400/10 text-red-200"
                    : "border-yellow-500/20 bg-yellow-400/10 text-yellow-200",
                ].join(" ")}
                aria-hidden="true"
              >
                !
              </span>
            </div>

            {temAtraso ? (
              <div className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-white/80">
                Existem pendências vencidas. Priorize cobrança/baixa.
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-yellow-500/15 bg-yellow-400/5 p-3 text-sm text-white/75">
                Sem vencidos no momento.
              </div>
            )}
          </div>
        </div>

        {/* RECENTES */}
        <div className="flex flex-col gap-3">
          <div className="flex items-end justify-between">
            <h2 className="text-lg font-semibold tracking-tight md:text-xl">
              OS Recentes
            </h2>
            <span className="text-xs text-white/55">
              Últimas {recentes.length.toString()}
            </span>
          </div>

          <div className="flex flex-col gap-3 md:grid md:grid-cols-2">
            {recentes.map((os) => {
              const placa = os.veiculo?.placa ?? "-";
              const cliente = os.cliente?.nome ?? "Sem cliente";
              const numero = os.numero ?? "";
              const problema = os.problema_relatado ?? "";

              const paid = isPaid(os);
              const previsto = previsaoPagamento(os);
              const atrasada = !paid && previsto < hojeYMD;

              const statusTone: BadgeTone =
                os.status === "concluida" || os.status === "entregue"
                  ? "success"
                  : os.status === "em_andamento"
                    ? "warning"
                    : "neutral";

              return (
                <button
                  key={os.id}
                  type="button"
                  onClick={() => onSelectOS(os)}
                  className={[
                    "w-full text-left rounded-2xl border bg-black/60 p-4 sm:p-5 ring-1 backdrop-blur-md transition-all",
                    "active:scale-[0.99]",
                    atrasada
                      ? "border-red-400/25 ring-red-400/15"
                      : "border-yellow-500/15 ring-yellow-400/10 hover:border-yellow-400/50",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base sm:text-lg font-bold text-yellow-400">
                          {placa}
                        </span>
                        {numero ? (
                          <span className="rounded-lg border border-yellow-500/15 bg-black/40 px-2 py-0.5 text-xs text-white/70">
                            #{numero}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 text-white font-medium">
                        {cliente}
                      </div>
                      <div className="mt-1 text-sm text-white/55 line-clamp-2">
                        {problema}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge tone={paid ? "success" : "warning"}>
                          {paid ? "Pago" : "Pendente"}
                        </Badge>
                        <Badge tone={atrasada ? "danger" : "neutral"}>
                          {atrasada ? "Atrasada" : "No prazo"}
                        </Badge>
                        <Badge tone={statusTone}>{os.status}</Badge>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-lg font-semibold text-white">
                        {formatCurrencyBRL(os.valor_total || 0)}
                      </div>
                      <div
                        className={`mt-1 text-xs ${
                          atrasada ? "text-red-200" : "text-white/55"
                        }`}
                      >
                        Previsão: {previsto}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-yellow-400/15 to-transparent" />
                  <div className="mt-3 flex items-center justify-between text-xs text-white/55">
                    <span>ID: {os.id}</span>
                    <span className="text-yellow-300/90">Abrir OS</span>
                  </div>
                </button>
              );
            })}

            {recentes.length === 0 ? (
              <div className="rounded-2xl border border-yellow-500/15 bg-black/60 p-6 text-center text-sm text-white/60 ring-1 ring-yellow-400/10 backdrop-blur-md md:col-span-2">
                Nenhuma OS cadastrada ainda.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
