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
   Helpers (sem any)
========================= */
type ExtraOS = {
  mao_de_obra?: number;
  status?: string;
  nota_status?: "nao_emitida" | "emitida" | "cancelada";
};

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
  return Number(n).toFixed(2).replace(".", ",");
}

function parseBRL(input: string): number {
  const n = Number(String(input).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function suggestTipo(descricao: string): "peca" | "servico" {
  const d = descricao.toLowerCase().trim();

  const servicoKeys = [
    "troca",
    "instala",
    "revis",
    "diagn",
    "ajuste",
    "mão de obra",
    "mao de obra",
    "alinh",
    "balance",
    "limpeza",
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

function openPdf(html: string) {
  const w = window.open("", "_blank");
  if (!w) {
    alert("Popup bloqueado pelo navegador.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    aberta: "aberta",
    em_andamento: "em_andamento",
    aguardando_peca: "aguardando_peca",
    concluida: "concluida (recebeu)",
    entregue: "entregue",
  };
  return map[s] ?? s;
}

function notaStatusLabel(s: ExtraOS["nota_status"]) {
  if (s === "emitida") return "emitida";
  if (s === "cancelada") return "cancelada";
  return "nao_emitida";
}

/* =========================
   Component
========================= */
interface Props {
  os: OrdemServico;
  onBack: () => void;
  onSendWhatsApp: (os: OrdemServico) => void;
}

type Tab = "resumo" | "itens" | "checklist" | "fotos" | "timeline";

type ItemForm = {
  tipo: "servico" | "peca";
  descricao: string;
  quantidade: number;
  valor_unitario: string;
};

export function OSDetail({ os, onBack, onSendWhatsApp }: Props) {
  const { user } = useAuth();

  const osId = useMemo(() => os.id, [os.id]);

  const [activeTab, setActiveTab] = useState<Tab>("resumo");

  const [itens, setItens] = useState<OSItem[]>([]);
  const [checklist, setChecklist] = useState<OSChecklist[]>([]);
  const [fotos, setFotos] = useState<OSFoto[]>([]);
  const [timeline, setTimeline] = useState<OSTimeline[]>([]);

  const [maoDeObra, setMaoDeObra] = useState<string>("");

  // status OS (nota)
  const [status, setStatus] = useState<string>(
    (os as unknown as ExtraOS).status ?? "aberta",
  );

  // status nota fiscal/recibo
  const [notaStatus, setNotaStatus] = useState<ExtraOS["nota_status"]>(
    (os as unknown as ExtraOS).nota_status ?? "nao_emitida",
  );

  // modal item (create/edit)
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [itemForm, setItemForm] = useState<ItemForm>({
    tipo: "servico",
    descricao: "",
    quantidade: 1,
    valor_unitario: "",
  });

  const [itemError, setItemError] = useState("");
  const [maoError, setMaoError] = useState("");

  const refresh = () => {
    const details = localDb.getOSDetails(osId);
    if (!details) return;

    setItens(details.itens);
    setChecklist(details.checklist);
    setFotos(details.fotos);
    setTimeline(details.timeline);

    const extra = details.os as unknown as ExtraOS;

    const mao = Number(extra.mao_de_obra ?? 0);
    setMaoDeObra(mao > 0 ? formatBRL(mao) : "");

    setStatus(extra.status ?? "aberta");
    setNotaStatus(extra.nota_status ?? "nao_emitida");
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [osId]);

  /* =========================
     Totais
========================= */
  const maoExtra = useMemo(() => {
    const v = parseBRL(maoDeObra);
    return Number.isFinite(v) && v >= 0 ? v : 0;
  }, [maoDeObra]);

  const totalPecas = useMemo(
    () =>
      itens
        .filter((i) => i.tipo === "peca")
        .reduce((sum, i) => sum + Number(i.valor_total ?? 0), 0),
    [itens],
  );

  const totalMaoItens = useMemo(
    () =>
      itens
        .filter((i) => i.tipo === "servico")
        .reduce((sum, i) => sum + Number(i.valor_total ?? 0), 0),
    [itens],
  );

  const totalMao = useMemo(
    () => Number((totalMaoItens + maoExtra).toFixed(2)),
    [totalMaoItens, maoExtra],
  );
  const totalGeral = useMemo(
    () => Number((totalPecas + totalMao).toFixed(2)),
    [totalPecas, totalMao],
  );

  /* =========================
     Actions
========================= */
  const toggleChecklistItem = (item: OSChecklist) => {
    const checked = localDb.toggleChecklist(item.id);
    if (checked !== null) {
      setChecklist((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, checked } : c)),
      );
    }
  };

  const salvarMaoDeObra = () => {
    setMaoError("");
    const valor = maoExtra;
    if (!Number.isFinite(valor) || valor < 0) {
      setMaoError("Valor inválido.");
      return;
    }
    localDb.setMaoDeObra({ os_id: osId, valor, user_id: user?.id });
    refresh();
  };

  const salvarStatus = () => {
    localDb.setOSStatus({
      os_id: osId,
      status: status as never,
      user_id: user?.id,
    });
    refresh();
  };

  const salvarNotaStatus = () => {
    // salva como campo extra no objeto OS
    const details = localDb.getOSDetails(osId);
    if (!details) return;

    const updated: OrdemServico = details.os;
    const extra = updated as unknown as ExtraOS;
    extra.nota_status = notaStatus;

    localDb.updateOS(updated);
    refresh();
  };

  const openCreateItem = () => {
    setIsEditing(false);
    setEditingItemId(null);
    setItemError("");
    setItemForm({
      tipo: "servico",
      descricao: "",
      quantidade: 1,
      valor_unitario: "",
    });
    setItemModalOpen(true);
  };

  const openEditItem = (i: OSItem) => {
    setIsEditing(true);
    setEditingItemId(i.id);
    setItemError("");
    setItemForm({
      tipo: i.tipo,
      descricao: i.descricao ?? "",
      quantidade: Number(i.quantidade ?? 1),
      valor_unitario: String(Number(i.valor_unitario ?? 0)).replace(".", ","),
    });
    setItemModalOpen(true);
  };

  const saveItem = () => {
    setItemError("");

    const descricao = itemForm.descricao.trim();
    if (!descricao) return setItemError("Informe a descrição.");

    const qtd = Number(itemForm.quantidade);
    if (!Number.isFinite(qtd) || qtd <= 0)
      return setItemError("Quantidade inválida.");

    const unit = parseBRL(itemForm.valor_unitario);
    if (!Number.isFinite(unit) || unit <= 0)
      return setItemError("Valor inválido.");

    // UPDATE: como o LocalDB não tem update de item (na maioria das versões),
    // fazemos: remove antigo + adiciona novo (mantém total correto).
    if (isEditing && editingItemId) {
      localDb.removeOSItem({ item_id: editingItemId, user_id: user?.id });
    }

    localDb.addOSItem({
      os_id: osId,
      tipo: itemForm.tipo,
      descricao,
      quantidade: qtd,
      valor_unitario: unit,
      user_id: user?.id,
    });

    setItemModalOpen(false);
    setIsEditing(false);
    setEditingItemId(null);
    refresh();
  };

  const deleteItem = (id: string) => {
    localDb.removeOSItem({ item_id: id, user_id: user?.id });
    refresh();
  };

  const deletePecas = () => {
    localDb.removeOSItensByTipo({
      os_id: osId,
      tipo: "peca",
      user_id: user?.id,
    });
    refresh();
  };

  const deleteMaoObraItens = () => {
    localDb.removeOSItensByTipo({
      os_id: osId,
      tipo: "servico",
      user_id: user?.id,
    });
    refresh();
  };

  const zerarMaoMecanico = () => {
    localDb.clearMaoDeObra({ os_id: osId, user_id: user?.id });
    refresh();
  };

  const limparTudo = () => {
    localDb.removeOSItensByTipo({
      os_id: osId,
      tipo: "peca",
      user_id: user?.id,
    });
    localDb.removeOSItensByTipo({
      os_id: osId,
      tipo: "servico",
      user_id: user?.id,
    });
    localDb.clearMaoDeObra({ os_id: osId, user_id: user?.id });
    refresh();
  };

  /* =========================
     PDF
========================= */
  const imprimirPDF = () => {
    const cliente = os.cliente?.nome ?? "";
    const tel = os.cliente?.telefone ?? "";
    const placa = os.veiculo?.placa ?? "";
    const veiculo =
      `${os.veiculo?.marca ?? ""} ${os.veiculo?.modelo ?? ""}`.trim();

    const linhasPecas = itens
      .filter((i) => i.tipo === "peca")
      .map(
        (i) => `
<tr>
  <td>${escapeHtml(i.descricao)}</td>
  <td class="right">${Number(i.quantidade ?? 0)}</td>
  <td class="right">R$ ${formatBRL(Number(i.valor_unitario ?? 0))}</td>
  <td class="right">R$ ${formatBRL(Number(i.valor_total ?? 0))}</td>
</tr>`,
      )
      .join("");

    const linhasMao = itens
      .filter((i) => i.tipo === "servico")
      .map(
        (i) => `
<tr>
  <td>${escapeHtml(i.descricao)}</td>
  <td class="right">${Number(i.quantidade ?? 0)}</td>
  <td class="right">R$ ${formatBRL(Number(i.valor_unitario ?? 0))}</td>
  <td class="right">R$ ${formatBRL(Number(i.valor_total ?? 0))}</td>
</tr>`,
      )
      .join("");

    const extraMao =
      maoExtra > 0
        ? `
<tr>
  <td>Mão de obra (mecânico)</td>
  <td class="right">-</td>
  <td class="right">-</td>
  <td class="right">R$ ${formatBRL(maoExtra)}</td>
</tr>`
        : "";

    const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Orçamento OS #${os.numero ?? ""}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;padding:24px;color:#111}
  .row{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}
  h1{font-size:20px;margin:0 0 6px 0}
  .muted{color:#555;font-size:12px}
  table{width:100%;border-collapse:collapse;margin-top:10px}
  th,td{border:1px solid #ddd;padding:8px;font-size:12px}
  th{background:#f5f5f5;text-align:left}
  .right{text-align:right}
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
      <h1>Orçamento / OS #${os.numero ?? ""}</h1>
      <div class="muted">Veículo: ${escapeHtml(placa)}${veiculo ? ` • ${escapeHtml(veiculo)}` : ""}</div>
      <div class="muted">Cliente: ${escapeHtml(cliente)}${tel ? ` • ${escapeHtml(tel)}` : ""}</div>
      <div class="muted">Status OS: ${escapeHtml(statusLabel(status))}</div>
      <div class="muted">Status Nota: ${escapeHtml(notaStatusLabel(notaStatus))}</div>
    </div>
    <div class="muted" style="text-align:right">
      Emissão: ${new Date().toLocaleDateString("pt-BR")}
    </div>
  </div>

  <div class="section">
    <h2 style="font-size:14px;margin:0 0 6px 0">Peças</h2>
    <table>
      <thead><tr><th>Descrição</th><th class="right">Qtd</th><th class="right">Unit</th><th class="right">Total</th></tr></thead>
      <tbody>${linhasPecas || `<tr><td colspan="4" class="muted">Nenhuma peça</td></tr>`}</tbody>
    </table>
  </div>

  <div class="section">
    <h2 style="font-size:14px;margin:0 0 6px 0">Mão de obra</h2>
    <table>
      <thead><tr><th>Descrição</th><th class="right">Qtd</th><th class="right">Unit</th><th class="right">Total</th></tr></thead>
      <tbody>${
        linhasMao || extraMao
          ? `${linhasMao}${extraMao}`
          : `<tr><td colspan="4" class="muted">Nenhuma mão de obra</td></tr>`
      }</tbody>
    </table>
  </div>

  <div class="totals">
    <div><span>Peças</span><span>R$ ${formatBRL(totalPecas)}</span></div>
    <div><span>Mão de obra</span><span>R$ ${formatBRL(totalMao)}</span></div>
    <div class="grand"><span>Total</span><span>R$ ${formatBRL(totalGeral)}</span></div>
  </div>

  <script>window.print()</script>
</body>
</html>`;

    openPdf(html);
  };

  /* =========================
     Render
========================= */
  return (
    <div className="p-4 space-y-3">
      <Button onClick={onBack}>← Voltar</Button>

      <Card>
        <p className="text-gray-400 text-sm">OS #{os.numero}</p>
        <h2 className="text-xl text-white font-bold">{os.veiculo?.placa}</h2>
        <p className="text-gray-400">{os.cliente?.nome}</p>

        <div className="mt-2 space-y-1 text-sm">
          <div className="flex justify-between text-gray-300">
            <span>Peças</span>
            <span>R$ {formatBRL(totalPecas)}</span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Mão de obra</span>
            <span>R$ {formatBRL(totalMao)}</span>
          </div>
          <div className="flex justify-between text-[#FFC107] font-semibold">
            <span>Total</span>
            <span>R$ {formatBRL(totalGeral)}</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button onClick={() => onSendWhatsApp(os)}>WhatsApp</Button>
          <Button onClick={imprimirPDF}>PDF</Button>
        </div>
      </Card>

      {/* Tabs */}
      <div className="grid grid-cols-5 gap-2">
        {(["resumo", "itens", "checklist", "fotos", "timeline"] as const).map(
          (tab) => (
            <Button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? "bg-[#FFC107] text-black" : ""}
            >
              {tab}
            </Button>
          ),
        )}
      </div>

      {/* ===== RESUMO ===== */}
      {activeTab === "resumo" && (
        <>
          {/* Status OS */}
          <Card>
            <p className="text-white font-semibold mb-2">Status da OS (nota)</p>
            <div className="grid grid-cols-3 gap-2 items-end">
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1">
                  Status
                </label>
                <select
                  className="w-full min-h-[48px] rounded-xl bg-[#1A1F26] border border-gray-800 text-white px-3"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="aberta">aberta</option>
                  <option value="em_andamento">em_andamento</option>
                  <option value="aguardando_peca">aguardando_peca</option>
                  <option value="concluida">concluida (recebeu)</option>
                  <option value="entregue">entregue</option>
                </select>
              </div>
              <Button onClick={salvarStatus}>Salvar</Button>
            </div>

            <p className="text-sm text-gray-400 mt-2">
              Marque <b>concluida</b> quando receber o pagamento.
            </p>
          </Card>

          {/* Status Nota */}
          <Card>
            <p className="text-white font-semibold mb-2">Status da Nota</p>
            <div className="grid grid-cols-3 gap-2 items-end">
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Nota</label>
                <select
                  className="w-full min-h-[48px] rounded-xl bg-[#1A1F26] border border-gray-800 text-white px-3"
                  value={notaStatus ?? "nao_emitida"}
                  onChange={(e) =>
                    setNotaStatus(e.target.value as ExtraOS["nota_status"])
                  }
                >
                  <option value="nao_emitida">nao_emitida</option>
                  <option value="emitida">emitida</option>
                  <option value="cancelada">cancelada</option>
                </select>
              </div>
              <Button onClick={salvarNotaStatus}>Salvar</Button>
            </div>
          </Card>

          {/* Mão de obra mecânico */}
          <Card>
            <p className="text-white font-semibold mb-2">
              Mão de obra (mecânico)
            </p>

            <div className="grid grid-cols-3 gap-2 items-end">
              <div className="col-span-2">
                <Input
                  label="Valor (R$)"
                  inputMode="decimal"
                  placeholder="Ex: 200,00"
                  value={maoDeObra}
                  onChange={(e) => setMaoDeObra(e.target.value)}
                />
              </div>
              <Button onClick={salvarMaoDeObra}>Salvar</Button>
            </div>

            {maoError && (
              <p className="text-sm text-red-400 mt-2">{maoError}</p>
            )}
          </Card>
        </>
      )}

      {/* ===== ITENS ===== */}
      {activeTab === "itens" && (
        <>
          <Card className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">Itens da OS</p>
              <p className="text-sm text-gray-400">
                Peças e mão de obra (serviços)
              </p>
            </div>
            <Button onClick={openCreateItem}>Adicionar item</Button>
          </Card>

          <Card className="space-y-2">
            <p className="text-white font-semibold">Ações rápidas</p>
            <div className="grid grid-cols-2 gap-2">
              <Button className="bg-red-700" onClick={deletePecas}>
                Excluir Peças
              </Button>
              <Button className="bg-red-700" onClick={deleteMaoObraItens}>
                Excluir Mão de Obra
              </Button>
              <Button className="bg-red-600" onClick={zerarMaoMecanico}>
                Zerar M.O. Mecânico
              </Button>
              <Button className="bg-gray-700" onClick={limparTudo}>
                Limpar Tudo
              </Button>
            </div>
          </Card>

          {itens.length === 0 ? (
            <Card>
              <p className="text-gray-400">Nenhum item lançado ainda.</p>
            </Card>
          ) : (
            itens.map((i) => (
              <Card key={i.id}>
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="text-white">{i.descricao}</p>
                    <p className="text-gray-400 text-sm">
                      <b>{i.tipo === "peca" ? "Peça" : "Mão de obra"}</b> •{" "}
                      {Number(i.quantidade)} x R${" "}
                      {formatBRL(Number(i.valor_unitario))}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <p className="text-[#FFC107] whitespace-nowrap">
                      R$ {formatBRL(Number(i.valor_total))}
                    </p>

                    <div className="flex gap-2">
                      <Button
                        className="bg-gray-700"
                        onClick={() => openEditItem(i)}
                      >
                        Editar
                      </Button>
                      <Button
                        className="bg-red-600"
                        onClick={() => deleteItem(i.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </>
      )}

      {/* ===== CHECKLIST ===== */}
      {activeTab === "checklist" &&
        checklist.map((c) => (
          <Card
            key={c.id}
            onClick={() => toggleChecklistItem(c)}
            className="cursor-pointer"
          >
            <div className="flex justify-between">
              <p className="text-white">{c.item}</p>
              <p>{c.checked ? "✅" : "⬜"}</p>
            </div>
          </Card>
        ))}

      {/* ===== FOTOS ===== */}
      {activeTab === "fotos" && (
        <Card>
          <p className="text-gray-400">Fotos</p>

          {fotos.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {fotos.map((f) => (
                <div
                  key={f.id}
                  className="rounded-lg overflow-hidden border border-gray-800"
                >
                  {f.url && (
                    <img
                      src={f.url}
                      className="w-full h-24 object-cover"
                      alt=""
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ===== TIMELINE ===== */}
      {activeTab === "timeline" &&
        timeline.map((t) => (
          <Card key={t.id}>
            <p className="text-white">{t.evento}</p>
            <p className="text-gray-400 text-sm">{t.created_at}</p>
          </Card>
        ))}

      {/* ===== MODAL ITEM (CREATE/EDIT) ===== */}
      {itemModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-end p-4 z-50">
          <div className="w-full bg-[#0F1216] rounded-xl p-4 space-y-3">
            <h3 className="text-white text-lg">
              {isEditing ? "Editar item" : "Novo item"}
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setItemForm((p) => ({ ...p, tipo: "servico" }))}
                className={
                  itemForm.tipo === "servico" ? "bg-[#FFC107] text-black" : ""
                }
              >
                Mão de obra
              </Button>
              <Button
                onClick={() => setItemForm((p) => ({ ...p, tipo: "peca" }))}
                className={
                  itemForm.tipo === "peca" ? "bg-[#FFC107] text-black" : ""
                }
              >
                Peça
              </Button>
            </div>

            <Input
              label="Descrição"
              placeholder={
                itemForm.tipo === "servico"
                  ? "Ex: Troca de óleo"
                  : "Ex: Filtro de óleo"
              }
              value={itemForm.descricao}
              onChange={(e) => {
                const value = e.target.value;
                const suggested = suggestTipo(value);
                setItemForm((p) => ({
                  ...p,
                  descricao: value,
                  tipo: suggested,
                }));
              }}
            />

            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Quantidade"
                type="number"
                min={1}
                value={String(itemForm.quantidade)}
                onChange={(e) =>
                  setItemForm((p) => ({
                    ...p,
                    quantidade: Number(e.target.value),
                  }))
                }
              />
              <Input
                label="Valor unitário (R$)"
                inputMode="decimal"
                placeholder="Ex: 120,00"
                value={itemForm.valor_unitario}
                onChange={(e) =>
                  setItemForm((p) => ({ ...p, valor_unitario: e.target.value }))
                }
              />
            </div>

            {itemError && <p className="text-red-400 text-sm">{itemError}</p>}

            <div className="flex gap-2">
              <Button onClick={saveItem} className="flex-1">
                Salvar
              </Button>

              <Button
                onClick={() => {
                  setItemModalOpen(false);
                  setIsEditing(false);
                  setEditingItemId(null);
                }}
                className="flex-1 bg-gray-700"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OSDetail;
