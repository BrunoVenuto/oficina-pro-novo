import { useEffect, useState } from "react";
import { localDb } from "../lib/localDB";
import { OrdemServico } from "../types";

// ================================
// Helpers de data (LOCAL)
// ================================
function ymdLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeekLocal(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfWeekLocal(d: Date) {
  const s = startOfWeekLocal(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 7);
  return e;
}

function startOfMonthLocal(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonthLocal(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
}

function inRange(iso: string | null | undefined, start: Date, end: Date) {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t < end.getTime();
}

function previsaoPagamento(os: OrdemServico) {
  if ("previsao_entrega" in os && os.previsao_entrega) {
    return os.previsao_entrega;
  }

  const base = new Date(os.created_at);
  base.setDate(base.getDate() + 3);
  return ymdLocal(base);
}

// ================================
// COMPONENTE
// ================================
interface DashboardProps {
  onSelectOS: (os: OrdemServico) => void;
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

  const isDone = (os: OrdemServico) =>
    os.status === "concluida" || os.status === "entregue";

  const isPaid = (os: OrdemServico) => "paid_at" in os && Boolean(os.paid_at);

  // ================================
  // FATURAMENTO
  // ================================
  const faturamentoDia = ordens
    .filter((os) => isDone(os) && os.paid_at?.startsWith(hojeYMD))
    .reduce((acc, os) => acc + (os.valor_total || 0), 0);

  const faturamentoSemana = ordens
    .filter((os) => isDone(os) && inRange(os.paid_at, wStart, wEnd))
    .reduce((acc, os) => acc + (os.valor_total || 0), 0);

  const faturamentoMes = ordens
    .filter((os) => isDone(os) && inRange(os.paid_at, mStart, mEnd))
    .reduce((acc, os) => acc + (os.valor_total || 0), 0);

  // ================================
  // PREVISTOS
  // ================================
  const previstoSemana = ordens
    .filter((os) => !isPaid(os))
    .filter((os) => {
      const p = previsaoPagamento(os);
      const d = new Date(p + "T00:00:00");
      return d >= wStart && d < wEnd;
    })
    .reduce((acc, os) => acc + (os.valor_total || 0), 0);

  const previstoMes = ordens
    .filter((os) => !isPaid(os))
    .filter((os) => {
      const p = previsaoPagamento(os);
      const d = new Date(p + "T00:00:00");
      return d >= mStart && d < mEnd;
    })
    .reduce((acc, os) => acc + (os.valor_total || 0), 0);

  // ================================
  // ATRASADOS
  // ================================
  const atrasados = ordens.filter((os) => {
    if (isPaid(os)) return false;
    const p = previsaoPagamento(os);
    return p < hojeYMD;
  });

  const atrasadosCount = atrasados.length;

  const atrasadosValor = atrasados.reduce(
    (acc, os) => acc + (os.valor_total || 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* FATURAMENTO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Faturamento do dia" value={faturamentoDia} />
        <Card title="Faturamento da semana" value={faturamentoSemana} />
        <Card title="Faturamento do mês" value={faturamentoMes} />
      </div>

      {/* PREVISTOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Previsto da semana" value={previstoSemana} />
        <Card title="Previsto do mês" value={previstoMes} />
      </div>

      {/* ATRASADOS */}
      <div className="grid grid-cols-1">
        <div className="rounded-xl bg-zinc-900 p-4 border border-zinc-800">
          <div className="text-sm text-zinc-400">Clientes atrasados</div>
          <div className="text-xl font-bold text-red-500">
            {atrasadosCount} clientes
          </div>
          <div className="text-sm text-red-400">
            R$ {atrasadosValor.toFixed(2)}
          </div>
        </div>
      </div>

      {/* RECENTES */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">OS Recentes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ordens.slice(0, 6).map(os => (
            <div
              key={os.id}
              onClick={() => onSelectOS(os)}
              className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 cursor-pointer hover:border-yellow-400/50 transition-all active:scale-[0.98]"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="text-yellow-400 font-mono font-bold text-lg">{os.veiculo?.placa}</div>
                <div className="px-2 py-0.5 rounded bg-zinc-800 text-xs text-zinc-400">#{os.numero}</div>
              </div>
              <div className="text-white font-medium mb-1">{os.cliente?.nome}</div>
              <div className="text-sm text-zinc-500 line-clamp-2">{os.problema_relatado}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ================================
// CARD
// ================================
function Card({ title, value, onClick }: { title: string; value: number; onClick?: () => void }) {
  return (
    <div className="rounded-xl bg-zinc-900 p-4" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="text-sm text-zinc-400">{title}</div>
      <div className="text-xl font-bold text-yellow-400">
        R$ {value.toFixed(2)}
      </div>
    </div>
  );
}
