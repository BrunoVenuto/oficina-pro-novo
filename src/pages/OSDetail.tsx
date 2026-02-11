import { useEffect, useMemo, useState } from "react";
import { localDb } from "../lib/localDB";
import type { OrdemServico, OSItem, StatusOS } from "../types";

interface OSDetailProps {
  os: OrdemServico;
  onBack: () => void;
  onSendWhatsApp: (os: OrdemServico) => void;
}

type OSDetails = {
  os: OrdemServico;
  itens: OSItem[];
};

type ItemForm = {
  tipo: "peca" | "servico";
  descricao: string;
  quantidade: number;
  valor_unitario: number;
};

// helpers (fora do componente)
function escapeHtml(input: unknown): string {
  const s = String(input ?? "");
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return s.replace(/[&<>"']/g, (ch) => map[ch]);
}

function openPdf(html: string) {
  const w = window.open("", "_blank");
  if (!w) {
    alert("Popup bloqueado pelo navegador");
    return;
  }

  w.document.open();
  w.document.write(html);
  w.document.close();

  w.focus();
  w.print();
}

function brl(n: number): string {
  return Number(n).toFixed(2).replace(".", ",");
}

function parseNumberSafe(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function getMaoDeObra(os: OrdemServico): number {
  const raw = os as unknown as { mao_de_obra?: unknown };
  const n = Number(raw.mao_de_obra ?? 0);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function suggestTipo(descricao: string): "peca" | "servico" {
  const d = descricao.toLowerCase().trim();

  const servicoKeys = [
    "troca ",
    "trocar ",
    "instala",
    "mão de obra",
    "mao de obra",
    "revis",
    "diagn",
    "alinh",
    "balance",
    "limpeza",
    "mecânico",
    "mecanico",
    "regul",
    "ajuste",
  ];

  const pecaKeys = [
    "vela",
    "velas",
    "bomba",
    "filtro",
    "correia",
    "pastilha",
    "disco",
    "rolamento",
    "sensor",
    "junta",
    "retentor",
    "radiador",
    "amortec",
    "pneu",
    "bateria",
    "óleo",
    "oleo",
    "fluido",
    "aditivo",
  ];

  if (servicoKeys.some((k) => d.includes(k))) return "servico";

  if (pecaKeys.some((k) => d.includes(k))) {
    // exceção: troca de óleo é serviço
    if (
      (d.includes("troca") || d.includes("trocar")) &&
      (d.includes("óleo") || d.includes("oleo"))
    ) {
      return "servico";
    }
    return "peca";
  }

  return "servico";
}

export default function OSDetail({
  os,
  onBack,
  onSendWhatsApp,
}: OSDetailProps) {
  const osId = useMemo(() => os.id, [os.id]);

  const [localOS, setLocalOS] = useState<OrdemServico>(os);
  const [itens, setItens] = useState<OSItem[]>([]);
  const [maoObra, setMaoObra] = useState<number>(getMaoDeObra(os));
  const [maoError, setMaoError] = useState<string>("");

  const [novoItem, setNovoItem] = useState<ItemForm>({
    tipo: "servico",
    descricao: "",
    quantidade: 1,
    valor_unitario: 0,
  });

  const refresh = () => {
    const raw = localDb.getOSDetails(osId) as unknown;
    const details = (raw ?? null) as OSDetails | null;
    if (!details) return;

    setLocalOS(details.os);
    setItens(details.itens);
    setMaoObra(getMaoDeObra(details.os));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [osId]);

  const totalPecas = useMemo(() => {
    return itens
      .filter((i) => i.tipo === "peca")
      .reduce((sum, i) => sum + parseNumberSafe(i.valor_total), 0);
  }, [itens]);

  const totalMaoItens = useMemo(() => {
    return itens
      .filter((i) => i.tipo === "servico")
      .reduce((sum, i) => sum + parseNumberSafe(i.valor_total), 0);
  }, [itens]);

  const totalMao = useMemo(() => {
    return Number(
      (totalMaoItens + (Number.isFinite(maoObra) ? maoObra : 0)).toFixed(2),
    );
  }, [totalMaoItens, maoObra]);

  const totalGeral = useMemo(() => {
    return Number((totalPecas + totalMao).toFixed(2));
  }, [totalPecas, totalMao]);

  // ================================
  // Ações
  // ================================
  const adicionarItem = () => {
    const descricao = novoItem.descricao.trim();
    if (!descricao) return;

    const qtd = Number(novoItem.quantidade);
    const unit = Number(novoItem.valor_unitario);

    if (!Number.isFinite(qtd) || qtd <= 0) return;
    if (!Number.isFinite(unit) || unit <= 0) return;

    localDb.addOSItem({
      os_id: osId,
      tipo: novoItem.tipo,
      descricao,
      quantidade: qtd,
      valor_unitario: unit,
    });

    setNovoItem({
      tipo: "servico",
      descricao: "",
      quantidade: 1,
      valor_unitario: 0,
    });

    refresh();
  };

  const salvarMaoObra = () => {
    setMaoError("");
    const valor = Number(maoObra);

    if (!Number.isFinite(valor) || valor < 0) {
      setMaoError("Valor inválido.");
      return;
    }

    localDb.setMaoDeObra({ os_id: osId, valor });
    refresh();
  };

  const zerarMaoObra = () => {
    localDb.clearMaoDeObra({ os_id: osId });
    refresh();
  };

  const alterarStatus = (status: StatusOS) => {
    localDb.setOSStatus({ os_id: osId, status });
    refresh();
  };

  const excluirItem = (itemId: string) => {
    localDb.removeOSItem({ item_id: itemId });
    refresh();
  };

  const excluirPecas = () => {
    localDb.removeOSItensByTipo({ os_id: osId, tipo: "peca" });
    refresh();
  };

  const excluirMaoItens = () => {
    localDb.removeOSItensByTipo({ os_id: osId, tipo: "servico" });
    refresh();
  };

  const limparTudo = () => {
    localDb.removeOSItensByTipo({ os_id: osId, tipo: "peca" });
    localDb.removeOSItensByTipo({ os_id: osId, tipo: "servico" });
    localDb.clearMaoDeObra({ os_id: osId });
    refresh();
  };

  const imprimirPDF = () => {
    const cliente = localOS.cliente?.nome ?? "";
    const tel = localOS.cliente?.telefone ?? "";
    const placa = localOS.veiculo?.placa ?? "";
    const veiculo =
      `${localOS.veiculo?.marca ?? ""} ${localOS.veiculo?.modelo ?? ""}`.trim();

    const linhasPecas = itens
      .filter((i) => i.tipo === "peca")
      .map(
        (i) =>
          `<tr><td>${escapeHtml(i.descricao)}</td><td style="text-align:right">${brl(
            Number(i.quantidade),
          )}</td><td style="text-align:right">R$ ${brl(
            Number(i.valor_unitario),
          )}</td><td style="text-align:right">R$ ${brl(
            Number(i.valor_total),
          )}</td></tr>`,
      )
      .join("");

    const linhasMao = itens
      .filter((i) => i.tipo === "servico")
      .map(
        (i) =>
          `<tr><td>${escapeHtml(i.descricao)}</td><td style="text-align:right">${brl(
            Number(i.quantidade),
          )}</td><td style="text-align:right">R$ ${brl(
            Number(i.valor_unitario),
          )}</td><td style="text-align:right">R$ ${brl(
            Number(i.valor_total),
          )}</td></tr>`,
      )
      .join("");

    const extraMao =
      Number.isFinite(maoObra) && maoObra > 0
        ? `<tr><td>Mão de obra (mecânico)</td><td style="text-align:right">-</td><td style="text-align:right">-</td><td style="text-align:right">R$ ${brl(
            maoObra,
          )}</td></tr>`
        : "";

    const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Orçamento OS #${localOS.numero ?? ""}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;padding:24px;color:#111}
  .row{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}
  h1{font-size:20px;margin:0 0 6px 0}
  .muted{color:#555;font-size:12px}
  table{width:100%;border-collapse:collapse;margin-top:10px}
  th,td{border:1px solid #ddd;padding:8px;font-size:12px}
  th{background:#f5f5f5;text-align:left}
  .section{margin-top:18px}
  .totals{margin-top:14px;font-size:12px}
  .totals div{display:flex;justify-content:space-between;padding:4px 0}
  .totals .grand{font-weight:700;font-size:14px}
  @media print{body{padding:0}}
</style>
</head>
<body>
  <div class="row">
    <div>
      <h1>Orçamento / OS #${localOS.numero ?? ""}</h1>
      <div class="muted">Veículo: ${escapeHtml(placa)}${
        veiculo ? ` • ${escapeHtml(veiculo)}` : ""
      }</div>
      <div class="muted">Cliente: ${escapeHtml(cliente)}${
        tel ? ` • ${escapeHtml(tel)}` : ""
      }</div>
      <div class="muted">Status: ${escapeHtml(String(localOS.status ?? ""))}</div>
    </div>
    <div class="muted" style="text-align:right">
      Emissão: ${new Date().toLocaleDateString("pt-BR")}
    </div>
  </div>

  <div class="section">
    <h2 style="font-size:14px;margin:0 0 6px 0">Peças</h2>
    <table>
      <thead><tr><th>Descrição</th><th style="text-align:right">Qtd</th><th style="text-align:right">Unit</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${
        linhasPecas ||
        `<tr><td colspan="4" class="muted">Nenhuma peça</td></tr>`
      }</tbody>
    </table>
  </div>

  <div class="section">
    <h2 style="font-size:14px;margin:0 0 6px 0">Mão de obra</h2>
    <table>
      <thead><tr><th>Descrição</th><th style="text-align:right">Qtd</th><th style="text-align:right">Unit</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${
        linhasMao || extraMao
          ? `${linhasMao}${extraMao}`
          : `<tr><td colspan="4" class="muted">Nenhuma mão de obra</td></tr>`
      }</tbody>
    </table>
  </div>

  <div class="totals">
    <div><span>Peças</span><span>R$ ${brl(totalPecas)}</span></div>
    <div><span>Mão de obra</span><span>R$ ${brl(totalMao)}</span></div>
    <div class="grand"><span>Total</span><span>R$ ${brl(totalGeral)}</span></div>
  </div>

  <script>window.print()</script>
</body>
</html>`;

    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return;

    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="p-4 space-y-4">
      <button
        className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
        onClick={onBack}
      >
        ← Voltar para lista
      </button>

      <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-2xl font-bold text-white font-mono">
            OS #{localOS.numero}
          </div>

          <div className="flex gap-2">
            <button
              onClick={imprimirPDF}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-lg transition-colors"
            >
              PDF
            </button>

            <button
              onClick={() => onSendWhatsApp(localOS)}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors"
            >
              WhatsApp
            </button>
          </div>
        </div>

        <div className="text-sm text-zinc-400">
          Status atual:{" "}
          <span className="text-yellow-400 font-bold uppercase">
            {String(localOS.status)}
          </span>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => alterarStatus("aberta")}
            className="px-2 py-1 bg-zinc-800 rounded"
          >
            Aberta
          </button>

          <button
            onClick={() => alterarStatus("em_andamento")}
            className="px-2 py-1 bg-zinc-800 rounded"
          >
            Em andamento
          </button>

          <button
            onClick={() => alterarStatus("aguardando_peca")}
            className="px-2 py-1 bg-zinc-800 rounded"
          >
            Aguardando peça
          </button>

          <button
            onClick={() => alterarStatus("concluida")}
            className="px-2 py-1 bg-green-900 rounded"
          >
            Concluída
          </button>

          <button
            onClick={() => alterarStatus("entregue")}
            className="px-2 py-1 bg-blue-900 rounded"
          >
            Entregue
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
          <div className="bg-zinc-800/40 p-3 rounded-lg border border-zinc-800">
            <div className="text-xs text-zinc-400">Peças</div>
            <div className="text-lg font-bold text-white">
              R$ {brl(totalPecas)}
            </div>
          </div>

          <div className="bg-zinc-800/40 p-3 rounded-lg border border-zinc-800">
            <div className="text-xs text-zinc-400">Mão de obra</div>
            <div className="text-lg font-bold text-white">
              R$ {brl(totalMao)}
            </div>
          </div>

          <div className="bg-zinc-800/40 p-3 rounded-lg border border-zinc-800">
            <div className="text-xs text-zinc-400">Total</div>
            <div className="text-lg font-bold text-yellow-400">
              R$ {brl(totalGeral)}
            </div>
          </div>
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="bg-zinc-900 rounded-xl p-4 space-y-2 border border-zinc-800">
        <div className="font-bold text-white">Ações rápidas</div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={excluirPecas}
            className="bg-red-800 hover:bg-red-700 text-white font-bold py-2 rounded-lg"
          >
            Excluir Peças
          </button>

          <button
            onClick={excluirMaoItens}
            className="bg-red-800 hover:bg-red-700 text-white font-bold py-2 rounded-lg"
          >
            Excluir Mão de Obra
          </button>

          <button
            onClick={zerarMaoObra}
            className="bg-red-700 hover:bg-red-600 text-white font-bold py-2 rounded-lg"
          >
            Zerar M.O. Mecânico
          </button>

          <button
            onClick={limparTudo}
            className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 rounded-lg"
          >
            Limpar Tudo
          </button>
        </div>
      </div>

      {/* Itens */}
      <div className="bg-zinc-900 rounded-xl p-4 space-y-3 border border-zinc-800">
        <div className="font-bold text-white">Itens</div>

        {itens.length > 0 && (
          <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-bold text-zinc-500 border-b border-zinc-800 pb-2 px-1">
            <div className="col-span-1">Tipo</div>
            <div className="col-span-5">Descrição</div>
            <div className="col-span-2 text-center">Qtd</div>
            <div className="col-span-2 text-right">Unitário</div>
            <div className="col-span-2 text-right">Ações</div>
          </div>
        )}

        {itens.map((f) => (
          <div
            key={f.id}
            className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center text-sm border-b border-zinc-800/50 py-2 px-1 hover:bg-zinc-800/30 transition-colors"
          >
            <div className="md:col-span-1">
              <span
                className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                  f.tipo === "servico"
                    ? "bg-blue-900/50 text-blue-300"
                    : "bg-emerald-900/50 text-emerald-300"
                }`}
              >
                {f.tipo === "servico" ? "MO" : "PÇA"}
              </span>
            </div>

            <div className="md:col-span-5 text-white font-medium">
              {f.descricao}
            </div>

            <div className="md:col-span-2 md:text-center text-zinc-400">
              <span className="md:hidden text-zinc-500 mr-1">Qtd:</span>
              {Number(f.quantidade ?? 0)}
            </div>

            <div className="md:col-span-2 md:text-right text-zinc-400">
              <span className="md:hidden text-zinc-500 mr-1">Vl Unit:</span>
              R$ {brl(Number(f.valor_unitario ?? 0))}
            </div>

            <div className="md:col-span-2 flex md:justify-end gap-2">
              <div className="text-right font-bold text-white">
                R$ {brl(Number(f.valor_total ?? 0))}
              </div>

              <button
                onClick={() => excluirItem(f.id)}
                className="bg-red-700 hover:bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-lg"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}

        {/* Formulário novo item */}
        <div className="bg-zinc-800/40 p-4 rounded-xl border border-zinc-800 space-y-4 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-2">
              <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">
                Tipo (auto)
              </label>
              <select
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                value={novoItem.tipo}
                onChange={(e) =>
                  setNovoItem((p) => ({
                    ...p,
                    tipo: e.target.value as "servico" | "peca",
                  }))
                }
              >
                <option value="peca">Peça</option>
                <option value="servico">Mão de obra</option>
              </select>
            </div>

            <div className="md:col-span-5">
              <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">
                Descrição
              </label>
              <input
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                placeholder="Ex: Velas / Troca de óleo"
                value={novoItem.descricao}
                onChange={(e) => {
                  const value = e.target.value;
                  const suggested = suggestTipo(value);
                  setNovoItem((p) => ({
                    ...p,
                    descricao: value,
                    tipo: suggested,
                  }));
                }}
              />
              <div className="text-[11px] text-zinc-500 mt-1">
                Sugestão automática:{" "}
                {novoItem.tipo === "peca" ? "Peça" : "Mão de obra"}
              </div>
            </div>

            <div className="md:col-span-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">
                Qtd
              </label>
              <input
                type="number"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                min={1}
                value={novoItem.quantidade}
                onChange={(e) =>
                  setNovoItem((p) => ({
                    ...p,
                    quantidade: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">
                Vl Unitário
              </label>
              <input
                type="number"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                placeholder="0"
                value={novoItem.valor_unitario}
                onChange={(e) =>
                  setNovoItem((p) => ({
                    ...p,
                    valor_unitario: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="md:col-span-2 flex items-end">
              <button
                onClick={adicionarItem}
                className="w-full bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-zinc-950 font-bold py-2 rounded-lg transition-all"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mão de obra mecânico */}
      <div className="bg-zinc-900 rounded-xl p-4 space-y-2 border border-zinc-800">
        <div className="font-bold text-white">Mão de obra (mecânico)</div>

        <div className="flex gap-2">
          <input
            type="number"
            className="flex-1 bg-zinc-800 rounded px-2 py-2 text-white"
            value={maoObra}
            onChange={(e) => setMaoObra(Number(e.target.value))}
          />

          <button
            onClick={salvarMaoObra}
            className="bg-green-700 hover:bg-green-600 px-3 rounded text-white font-bold"
          >
            Salvar
          </button>
        </div>

        {maoError && <div className="text-sm text-red-400">{maoError}</div>}
      </div>
    </div>
  );
}



