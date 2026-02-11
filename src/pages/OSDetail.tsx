import { useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { localDb } from "../lib/localDB";
import { useAuth } from "../contexts/AuthContext";

import type {
  OrdemServico,
  OSChecklist,
  OSItem,
  OSFoto,
  OSTimeline,
} from "../types";

/* =========================
   Helpers
========================= */
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

function formatBRL(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

function parseBRL(input: string): number {
  const n = Number(String(input).replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function suggestTipo(descricao: string): "peca" | "servico" {
  const d = descricao.toLowerCase();

  const servicoKeys = [
    "troca",
    "instala",
    "revis",
    "diagn",
    "ajuste",
    "mão de obra",
    "mao de obra",
  ];

  const pecaKeys = [
    "vela",
    "bomba",
    "filtro",
    "correia",
    "pastilha",
    "sensor",
    "óleo",
    "oleo",
    "fluido",
    "pneu",
    "bateria",
  ];

  if (servicoKeys.some((k) => d.includes(k))) return "servico";
  if (pecaKeys.some((k) => d.includes(k))) {
    if (d.includes("troca") && (d.includes("óleo") || d.includes("oleo")))
      return "servico";
    return "peca";
  }
  return "servico";
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

/* =========================
   Component
========================= */
interface Props {
  os: OrdemServico;
  onBack: () => void;
  onSendWhatsApp: (os: OrdemServico) => void;
}

export function OSDetail({ os, onBack, onSendWhatsApp }: Props) {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<
    "resumo" | "itens" | "checklist" | "fotos" | "timeline"
  >("resumo");

  const [itens, setItens] = useState<OSItem[]>([]);
  const [checklist, setChecklist] = useState<OSChecklist[]>([]);
  const [fotos, setFotos] = useState<OSFoto[]>([]);
  const [timeline, setTimeline] = useState<OSTimeline[]>([]);

  const [maoDeObra, setMaoDeObra] = useState<string>("");

  const osId = os.id;

  const refresh = () => {
    const details = localDb.getOSDetails(osId);
    if (!details) return;

    setItens(details.itens);
    setChecklist(details.checklist);
    setFotos(details.fotos);
    setTimeline(details.timeline);

    const mao = Number(
      (details.os as { mao_de_obra?: number }).mao_de_obra ?? 0,
    );
    setMaoDeObra(mao > 0 ? formatBRL(mao) : "");
  };

  useEffect(() => {
    refresh();
  }, [osId]);

  /* =========================
     Totais
  ========================= */
  const totalPecas = useMemo(
    () =>
      itens
        .filter((i) => i.tipo === "peca")
        .reduce((s, i) => s + Number(i.valor_total), 0),
    [itens],
  );

  const totalMaoItens = useMemo(
    () =>
      itens
        .filter((i) => i.tipo === "servico")
        .reduce((s, i) => s + Number(i.valor_total), 0),
    [itens],
  );

  const maoExtra = parseBRL(maoDeObra);
  const totalMao = totalMaoItens + maoExtra;
  const totalGeral = totalPecas + totalMao;

  /* =========================
     PDF
  ========================= */
  const handlePrintPdf = () => {
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Orçamento OS #${os.numero}</title>
<style>
body{font-family:Arial;padding:24px}
table{width:100%;border-collapse:collapse;margin-top:12px}
th,td{border:1px solid #333;padding:6px;font-size:13px}
th{background:#eee}
.right{text-align:right}
</style>
</head>
<body>

<h2>Orçamento – OS #${os.numero}</h2>
<p><b>Cliente:</b> ${escapeHtml(os.cliente?.nome)}</p>
<p><b>Veículo:</b> ${escapeHtml(os.veiculo?.placa)}</p>

<h3>Peças</h3>
<table>
<tr><th>Descrição</th><th class="right">Qtd</th><th class="right">Valor</th></tr>
${itens
  .filter((i) => i.tipo === "peca")
  .map(
    (i) => `
<tr>
<td>${escapeHtml(i.descricao)}</td>
<td class="right">${i.quantidade}</td>
<td class="right">R$ ${formatBRL(Number(i.valor_total))}</td>
</tr>`,
  )
  .join("")}
</table>

<h3>Mão de obra</h3>
<table>
<tr><th>Descrição</th><th class="right">Qtd</th><th class="right">Valor</th></tr>
${itens
  .filter((i) => i.tipo === "servico")
  .map(
    (i) => `
<tr>
<td>${escapeHtml(i.descricao)}</td>
<td class="right">${i.quantidade}</td>
<td class="right">R$ ${formatBRL(Number(i.valor_total))}</td>
</tr>`,
  )
  .join("")}
</table>

<p><b>Mão de obra (mecânico):</b> R$ ${formatBRL(maoExtra)}</p>

<h3>Total: R$ ${formatBRL(totalGeral)}</h3>

</body>
</html>
`;
    openPdf(html);
  };

  /* =========================
     Render
  ========================= */
  return (
    <div className="p-4 space-y-3">
      <Button onClick={onBack}>← Voltar</Button>

      <Card>
        <p className="text-gray-400">OS #{os.numero}</p>
        <p className="text-white font-bold">{os.veiculo?.placa}</p>

        <div className="mt-2 text-sm space-y-1">
          <div className="flex justify-between">
            <span>Peças</span>
            <span>R$ {formatBRL(totalPecas)}</span>
          </div>
          <div className="flex justify-between">
            <span>Mão de obra</span>
            <span>R$ {formatBRL(totalMao)}</span>
          </div>
          <div className="flex justify-between font-bold text-[#FFC107]">
            <span>Total</span>
            <span>R$ {formatBRL(totalGeral)}</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button onClick={() => onSendWhatsApp(os)}>WhatsApp</Button>
          <Button onClick={handlePrintPdf}>PDF</Button>
        </div>
      </Card>

      {/* Tabs */}
      <div className="grid grid-cols-5 gap-2">
        {["resumo", "itens", "checklist", "fotos", "timeline"].map((t) => (
          <Button
            key={t}
            onClick={() => setActiveTab(t as any)}
            className={activeTab === t ? "bg-[#FFC107] text-black" : ""}
          >
            {t}
          </Button>
        ))}
      </div>

      {/* ITENS */}
      {activeTab === "itens" &&
        itens.map((i) => (
          <Card key={i.id}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white">{i.descricao}</p>
                <p className="text-xs text-gray-400">
                  {i.tipo === "peca" ? "Peça" : "Mão de obra"}
                </p>
              </div>
              <div className="flex gap-2">
                <span className="text-[#FFC107]">
                  R$ {formatBRL(Number(i.valor_total))}
                </span>
                <Button
                  className="bg-red-600"
                  onClick={() => {
                    localDb.removeOSItem({
                      item_id: i.id,
                      user_id: user?.id,
                    });
                    refresh();
                  }}
                >
                  Excluir
                </Button>
              </div>
            </div>
          </Card>
        ))}
    </div>
  );
}

export default OSDetail;
