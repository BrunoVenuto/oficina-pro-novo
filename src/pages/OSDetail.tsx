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

interface Props {
  os: OrdemServico;
  onBack: () => void;
  onSendWhatsApp: (os: OrdemServico) => void;
}

type ActiveTab = "resumo" | "itens" | "checklist" | "fotos" | "timeline";

type StatusOS =
  | "aberta"
  | "em_andamento"
  | "aguardando_peca"
  | "concluida"
  | "entregue";

type OSDetails = {
  os: OrdemServico;
  itens: OSItem[];
  checklist: OSChecklist[];
  fotos: OSFoto[];
  timeline: OSTimeline[];
};

function isStatusOS(v: unknown): v is StatusOS {
  return (
    v === "aberta" ||
    v === "em_andamento" ||
    v === "aguardando_peca" ||
    v === "concluida" ||
    v === "entregue"
  );
}

function getStatusFromOS(value: OrdemServico): StatusOS {
  const unknownOS = value as unknown as { status?: unknown };
  return isStatusOS(unknownOS.status) ? unknownOS.status : "aberta";
}

function getMaoDeObraFromOS(value: OrdemServico): number {
  const unknownOS = value as unknown as { mao_de_obra?: unknown };
  const n = Number(unknownOS.mao_de_obra ?? 0);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function parseBRLDecimal(input: string): number | null {
  const n = Number(String(input).replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return n;
}

function formatBRL(n: number): string {
  return Number(n).toFixed(2);
}

export function OSDetail({ os, onBack, onSendWhatsApp }: Props) {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>("resumo");

  const [itens, setItens] = useState<OSItem[]>([]);
  const [checklist, setChecklist] = useState<OSChecklist[]>([]);
  const [fotos, setFotos] = useState<OSFoto[]>([]);
  const [timeline, setTimeline] = useState<OSTimeline[]>([]);

  // ===== Mão de obra =====
  const [maoDeObra, setMaoDeObra] = useState<string>("");
  const [maoError, setMaoError] = useState<string>("");

  // ===== Status =====
  const [status, setStatus] = useState<StatusOS>(getStatusFromOS(os));

  // ===== Modal de item =====
  const [itemModalOpen, setItemModalOpen] = useState<boolean>(false);
  const [itemForm, setItemForm] = useState<{
    tipo: "servico" | "peca";
    descricao: string;
    quantidade: number;
    valor_unitario: string;
  }>({
    tipo: "servico",
    descricao: "",
    quantidade: 1,
    valor_unitario: "",
  });
  const [itemError, setItemError] = useState<string>("");

  const osId = useMemo(() => os.id, [os.id]);

  const refresh = () => {
    const raw = localDb.getOSDetails(osId) as unknown;
    const details = (raw ?? null) as OSDetails | null;
    if (!details) return;

    setItens(details.itens);
    setChecklist(details.checklist);
    setFotos(details.fotos);
    setTimeline(details.timeline);

    const mao = getMaoDeObraFromOS(details.os);
    setMaoDeObra(mao > 0 ? mao.toFixed(2).replace(".", ",") : "");

    setStatus(getStatusFromOS(details.os));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [osId]);

  // ===== Totais separados =====
  const totalPecas = useMemo(() => {
    return itens
      .filter((i) => i.tipo === "peca")
      .reduce((sum, i) => sum + Number(i.valor_total || 0), 0);
  }, [itens]);

  const totalMaoDeObraItens = useMemo(() => {
    return itens
      .filter((i) => i.tipo === "servico")
      .reduce((sum, i) => sum + Number(i.valor_total || 0), 0);
  }, [itens]);

  const maoDeObraExtra = useMemo(() => {
    const parsed = parseBRLDecimal(maoDeObra);
    if (parsed === null) return 0;
    return parsed >= 0 ? parsed : 0;
  }, [maoDeObra]);

  const totalMaoDeObra = useMemo(() => {
    return totalMaoDeObraItens + maoDeObraExtra;
  }, [totalMaoDeObraItens, maoDeObraExtra]);

  const totalGeral = useMemo(() => {
    return totalPecas + totalMaoDeObra;
  }, [totalPecas, totalMaoDeObra]);

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

    const valor = parseBRLDecimal(maoDeObra);
    if (valor === null || valor < 0) {
      setMaoError("Valor inválido.");
      return;
    }

    localDb.setMaoDeObra({ os_id: osId, valor, user_id: user?.id });
    refresh();
  };

  const salvarStatus = () => {
    localDb.setOSStatus({
      os_id: osId,
      status,
      user_id: user?.id,
    });
    refresh();
  };

  const addItem = () => {
    setItemError("");

    const descricao = itemForm.descricao.trim();
    if (!descricao) {
      setItemError("Informe a descrição.");
      return;
    }

    const qtd = Number(itemForm.quantidade);
    if (!Number.isFinite(qtd) || qtd <= 0) {
      setItemError("Quantidade inválida.");
      return;
    }

    const unit = parseBRLDecimal(itemForm.valor_unitario);
    if (unit === null || unit <= 0) {
      setItemError("Valor inválido.");
      return;
    }

    localDb.addOSItem({
      os_id: osId,
      tipo: itemForm.tipo,
      descricao,
      quantidade: qtd,
      valor_unitario: unit,
      user_id: user?.id,
    });

    refresh();

    setItemForm({
      tipo: "servico",
      descricao: "",
      quantidade: 1,
      valor_unitario: "",
    });
    setItemModalOpen(false);
  };

  return (
    <div className="p-4 space-y-3">
      <Button onClick={onBack}>← Voltar</Button>

      <Card>
        <p className="text-gray-400 text-sm">OS #{os.numero}</p>
        <h2 className="text-xl text-white font-bold">{os.veiculo?.placa}</h2>
        <p className="text-gray-400">{os.cliente?.nome}</p>

        <div className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between text-gray-200">
            <span>Peças</span>
            <span>R$ {formatBRL(totalPecas)}</span>
          </div>

          <div className="flex justify-between text-gray-200">
            <span>Mão de obra</span>
            <span>R$ {formatBRL(totalMaoDeObra)}</span>
          </div>

          <hr className="border-gray-800 my-2" />

          <div className="flex justify-between font-semibold text-[#FFC107]">
            <span>Total</span>
            <span>R$ {formatBRL(totalGeral)}</span>
          </div>
        </div>

        <Button className="mt-3" onClick={() => onSendWhatsApp(os)}>
          Enviar WhatsApp
        </Button>
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
          <Card>
            <p className="text-white font-semibold mb-2">
              Mão de obra (mecânico)
            </p>

            <div className="grid grid-cols-3 gap-2 items-end">
              <div className="col-span-2">
                <Input
                  label="Valor (R$)"
                  inputMode="decimal"
                  placeholder="Ex: 150,00"
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

          <Card>
            <p className="text-white font-semibold mb-2">Status da OS</p>

            <div className="grid grid-cols-3 gap-2 items-end">
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1">
                  Status
                </label>

                <select
                  className="w-full min-h-[48px] rounded-xl bg-[#1A1F26] border border-gray-800 text-white px-3"
                  value={status}
                  onChange={(e) => {
                    const v = e.target.value as unknown;
                    setStatus(isStatusOS(v) ? v : "aberta");
                  }}
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
              Marque <b>concluida</b> quando receber o pagamento. Isso entra no
              faturamento do Dashboard.
            </p>
          </Card>
        </>
      )}

      {/* ===== ITENS ===== */}
      {activeTab === "itens" && (
        <>
          <Card className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">Itens da OS</p>
              <p className="text-sm text-gray-400">Serviços e peças</p>
            </div>
            <Button onClick={() => setItemModalOpen(true)}>
              Adicionar item
            </Button>
          </Card>

          {itens.length === 0 ? (
            <Card>
              <p className="text-gray-400">Nenhum item lançado ainda.</p>
            </Card>
          ) : (
            itens.map((i) => (
              <Card key={i.id}>
                <div className="flex justify-between">
                  <div>
                    <p className="text-white">{i.descricao}</p>
                    <p className="text-gray-400 text-sm">
                      {i.quantidade} x R$ {formatBRL(Number(i.valor_unitario))}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Tipo: {i.tipo === "peca" ? "peça" : "mão de obra"}
                    </p>
                  </div>
                  <p className="text-[#FFC107]">
                    R$ {formatBRL(Number(i.valor_total))}
                  </p>
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
          <p className="text-gray-400">
            Fotos: (se você quiser, eu implemento upload local base64 agora, sem
            mudar o layout)
          </p>

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

      {/* ===== MODAL ITEM ===== */}
      {itemModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-end p-4 z-50">
          <div className="w-full bg-[#0F1216] rounded-xl p-4 space-y-3">
            <h3 className="text-white text-lg">Novo item</h3>

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
              onChange={(e) =>
                setItemForm((p) => ({ ...p, descricao: e.target.value }))
              }
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
              <Button onClick={addItem} className="flex-1">
                Salvar
              </Button>

              <Button
                onClick={() => setItemModalOpen(false)}
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
