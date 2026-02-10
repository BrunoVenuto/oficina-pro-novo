import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { localDb } from "../lib/localDB";
import { OrdemServico } from "../types";

// Tipos auxiliares usados apenas na UI
type TimelineItem = {
  tipo?: string;
  data?: string;
  descricao?: string;
};

type ItemOS = {
  tipo?: "servico" | "peca";
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
};

interface OSDetailProps {
  os: OrdemServico;
  onBack: () => void;
  onSendWhatsApp: (os: OrdemServico) => void;
}

<<<<<<< HEAD
export default function OSDetail({ os, onBack, onSendWhatsApp }: OSDetailProps) {
  const [localOS, setLocalOS] = useState<OrdemServico>(os);
  const [maoObra, setMaoObra] = useState<number>(os.mao_de_obra ?? 0);
  const [novoItem, setNovoItem] = useState<ItemOS>({
    tipo: "peca",
=======
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
>>>>>>> c582b9f (feat(os): orçamento e WhatsApp com peças e mão de obra separadas)
    descricao: "",
    quantidade: 1,
    valor_unitario: 0,
    valor_total: 0,
  });
<<<<<<< HEAD
=======
  const [itemError, setItemError] = useState<string>("");

  const osId = useMemo(() => os.id, [os.id]);

  const refresh = () => {
    const raw = localDb.getOSDetails(osId);
    const details = (raw ?? null) as unknown as OSDetails | null;
    if (!details) return;

    setItens(details.itens);
    setChecklist(details.checklist);
    setFotos(details.fotos);
    setTimeline(details.timeline);

    const mao = getMaoDeObraFromOS(details.os);
    setMaoDeObra(mao > 0 ? mao.toFixed(2).replace(".", ",") : "");

    setStatus(getStatusFromOS(details.os));
  };
>>>>>>> c582b9f (feat(os): orçamento e WhatsApp com peças e mão de obra separadas)

  useEffect(() => {
    setLocalOS(os);
    setMaoObra(os.mao_de_obra ?? 0);
  }, [os]);

<<<<<<< HEAD
  if (!localOS) {
    return <div className="p-4">Ordem de serviço não encontrada.</div>;
  }
=======
  // ===== Totais (separados) =====
  const totalPecas = useMemo(() => {
    return itens
      .filter((i) => i.tipo === "peca")
      .reduce((sum, i) => sum + Number(i.valor_total || 0), 0);
  }, [itens]);

  const totalServicos = useMemo(() => {
    return itens
      .filter((i) => i.tipo === "servico")
      .reduce((sum, i) => sum + Number(i.valor_total || 0), 0);
  }, [itens]);

  const totalMaoDeObra = useMemo(() => {
    const parsed = parseBRLDecimal(maoDeObra);
    if (parsed === null) return 0;
    return parsed >= 0 ? parsed : 0;
  }, [maoDeObra]);

  const totalGeral = useMemo(() => {
    return totalPecas + totalServicos + totalMaoDeObra;
  }, [totalPecas, totalServicos, totalMaoDeObra]);

  const toggleChecklistItem = (item: OSChecklist) => {
    const checked = localDb.toggleChecklist(item.id);
    if (checked !== null) {
      setChecklist((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, checked } : c)),
      );
    }
  };
>>>>>>> c582b9f (feat(os): orçamento e WhatsApp com peças e mão de obra separadas)

  // ================================
  // Ações
  // ================================
  const adicionarItem = () => {
    if (!novoItem.descricao || novoItem.quantidade <= 0) return;

<<<<<<< HEAD
    const valor_total = Number((novoItem.quantidade * novoItem.valor_unitario).toFixed(2));
    const itemComTotal = { ...novoItem, valor_total };
=======
    const valor = parseBRLDecimal(maoDeObra);
    if (valor === null || valor < 0) {
      setMaoError("Valor inválido.");
      return;
    }
>>>>>>> c582b9f (feat(os): orçamento e WhatsApp com peças e mão de obra separadas)

    const itensAtuais: ItemOS[] = Array.isArray(localOS.itens) ? localOS.itens : [];

<<<<<<< HEAD
    const atualizado: OrdemServico = {
      ...localOS,
      itens: [...itensAtuais, itemComTotal],
      valor_total: (localOS.valor_total || 0) + valor_total,
    };
=======
  const salvarStatus = () => {
    localDb.setOSStatus({
      os_id: osId,
      status,
      user_id: user?.id,
    });
    refresh();
  };
>>>>>>> c582b9f (feat(os): orçamento e WhatsApp com peças e mão de obra separadas)

    localDb.updateOS(atualizado);
    setLocalOS(atualizado);

<<<<<<< HEAD
    setNovoItem({
      tipo: "peca",
=======
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
>>>>>>> c582b9f (feat(os): orçamento e WhatsApp com peças e mão de obra separadas)
      descricao: "",
      quantidade: 1,
      valor_unitario: 0,
      valor_total: 0,
    });
  };

  const salvarMaoObra = () => {
    const atualizado = {
      ...localOS,
      valor_total:
        (localOS.valor_total || 0) -
        ((localOS as OrdemServico & { mao_de_obra?: number }).mao_de_obra || 0) +
        maoObra,
    } as OrdemServico & { mao_de_obra?: number };

    atualizado.mao_de_obra = maoObra;

    localDb.updateOS(atualizado as OrdemServico);
    setLocalOS(atualizado as OrdemServico);
  };

  const alterarStatus = (
    status:
      | "aberta"
      | "aguardando_peca"
      | "concluida"
      | "entregue"
      | "em_andamento",
  ) => {
    localDb.setOSStatus({
      os_id: localOS.id,
      status,
    });

    const atualizada = localDb.getOS(localOS.id);
    if (atualizada) setLocalOS(atualizada);
  };

  // ================================
  // Render
  // ================================
  const itens: ItemOS[] = Array.isArray(localOS.itens) ? localOS.itens : [];

  const timeline: TimelineItem[] = Array.isArray(
    (localOS as OrdemServico & { timeline?: TimelineItem[] }).timeline,
  )
    ? ((localOS as OrdemServico & { timeline?: TimelineItem[] })
      .timeline as TimelineItem[])
    : [];

  return (
    <div className="p-4 space-y-4">
      <button className="text-sm font-medium text-zinc-400 hover:text-white transition-colors" onClick={onBack}>
        ← Voltar para lista
      </button>

      <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-white font-mono">OS #{localOS.numero}</div>
          <button
            onClick={() => onSendWhatsApp(localOS)}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors"
          >
            WhatsApp
          </button>
        </div>

<<<<<<< HEAD
        <div className="text-sm text-zinc-400">Status atual: <span className="text-yellow-400 font-bold uppercase">{localOS.status}</span></div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => alterarStatus("aberta")}
            className="px-2 py-1 bg-zinc-800 rounded"
          >
            Aberta
          </button>
=======
        {/* Orçamento separado (mobile-first) */}
        <div className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between text-gray-200">
            <span>Peças</span>
            <span>R$ {formatBRL(totalPecas)}</span>
          </div>

          <div className="flex justify-between text-gray-200">
            <span>Serviços</span>
            <span>R$ {formatBRL(totalServicos)}</span>
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
>>>>>>> c582b9f (feat(os): orçamento e WhatsApp com peças e mão de obra separadas)

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
      </div>

      {/* Itens */}
      <div className="bg-zinc-900 rounded-xl p-4 space-y-3">
        <div className="font-bold">Itens</div>

        {itens.length > 0 && (
          <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-bold text-zinc-500 border-b border-zinc-800 pb-2 px-1">
            <div className="col-span-1">Tipo</div>
            <div className="col-span-5">Descrição</div>
            <div className="col-span-2 text-center">Qtd</div>
            <div className="col-span-2 text-right">Unitário</div>
            <div className="col-span-2 text-right">Total</div>
          </div>
        )}

<<<<<<< HEAD
        {itens.map((f: ItemOS, i: number) => (
          <div
            key={i}
            className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center text-sm border-b border-zinc-800/50 py-2 px-1 hover:bg-zinc-800/30 transition-colors"
=======
              <Button onClick={salvarMaoDeObra}>Salvar</Button>
            </div>

            {maoError && (
              <p className="text-sm text-red-400 mt-2">{maoError}</p>
            )}
          </Card>

          {/* STATUS */}
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
                  onChange={(e) => setStatus(e.target.value as StatusOS)}
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
                      Tipo: {i.tipo === "peca" ? "peça" : "serviço"}
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
>>>>>>> c582b9f (feat(os): orçamento e WhatsApp com peças e mão de obra separadas)
          >
            <div className="md:col-span-1">
              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${f.tipo === 'servico' ? 'bg-blue-900/50 text-blue-300' : 'bg-emerald-900/50 text-emerald-300'}`}>
                {f.tipo === 'servico' ? 'SRV' : 'PÇA'}
              </span>
            </div>
            <div className="md:col-span-5 text-white font-medium">{f.descricao}</div>
            <div className="md:col-span-2 md:text-center text-zinc-400">
              <span className="md:hidden text-zinc-500 mr-1">Qtd:</span>{f.quantidade}
            </div>
            <div className="md:col-span-2 md:text-right text-zinc-400">
              <span className="md:hidden text-zinc-500 mr-1">Vl Unit:</span>R$ {Number(f.valor_unitario || 0).toFixed(2)}
            </div>
            <div className="md:col-span-2 text-right font-bold text-white">
              <span className="md:hidden text-zinc-500 mr-1">Total:</span>R$ {Number(f.valor_total || 0).toFixed(2)}
            </div>
          </div>
        ))}

<<<<<<< HEAD
        <div className="bg-zinc-800/40 p-4 rounded-xl border border-zinc-800 space-y-4 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-2">
              <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">Tipo</label>
              <select
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                value={novoItem.tipo}
                onChange={(e) => setNovoItem({ ...novoItem, tipo: e.target.value as "servico" | "peca" })}
=======
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
>>>>>>> c582b9f (feat(os): orçamento e WhatsApp com peças e mão de obra separadas)
              >
                <option value="peca">Peça</option>
                <option value="servico">Serviço</option>
              </select>
            </div>

            <div className="md:col-span-5">
              <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">Descrição</label>
              <input
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                placeholder="Ex: Óleo 5W30"
                value={novoItem.descricao}
                onChange={(e) => setNovoItem({ ...novoItem, descricao: e.target.value })}
              />
            </div>

            <div className="md:col-span-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">Qtd</label>
              <input
                type="number"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                placeholder="1"
                min="1"
                value={novoItem.quantidade}
                onChange={(e) => setNovoItem({ ...novoItem, quantidade: Number(e.target.value) })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">Vl Unitário</label>
              <input
                type="number"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                placeholder="0.00"
                value={novoItem.valor_unitario}
                onChange={(e) => setNovoItem({ ...novoItem, valor_unitario: Number(e.target.value) })}
              />
            </div>

            <div className="md:col-span-2 flex items-end">
              <button
                onClick={adicionarItem}
                className="w-full bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-zinc-950 font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1"
              >
                <span>Adicionar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mão de obra */}
      <div className="bg-zinc-900 rounded-xl p-4 space-y-2">
        <div className="font-bold">Mão de obra</div>

        <div className="flex gap-2">
          <input
            type="number"
            className="flex-1 bg-zinc-800 rounded px-2 py-1"
            value={maoObra}
            onChange={(e) => setMaoObra(Number(e.target.value))}
          />

          <button onClick={salvarMaoObra} className="bg-green-700 px-2 rounded">
            Salvar
          </button>
        </div>
      </div>

      {/* Total */}
      <div className="bg-zinc-900 rounded-xl p-4">
        <div className="text-sm text-zinc-400">Valor total</div>

        <div className="text-xl font-bold text-yellow-400">
          R$ {Number(localOS.valor_total || 0).toFixed(2)}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-zinc-900 rounded-xl p-4 space-y-2">
        <div className="font-bold">Histórico</div>

        {(Array.isArray(timeline) ? timeline : []).map(
          (t: TimelineItem, i: number) => (
            <div key={i} className="text-sm border-b border-zinc-800 pb-1">
              <div className="text-zinc-400">{t.data}</div>
              <div>{t.descricao}</div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
