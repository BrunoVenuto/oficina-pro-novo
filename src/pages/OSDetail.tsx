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

export default function OSDetail({ os, onBack, onSendWhatsApp }: OSDetailProps) {
  const [localOS, setLocalOS] = useState<OrdemServico>(os);
  const [maoObra, setMaoObra] = useState<number>(os.mao_de_obra ?? 0);
  const [novoItem, setNovoItem] = useState<ItemOS>({
    tipo: "peca",
    descricao: "",
    quantidade: 1,
    valor_unitario: 0,
    valor_total: 0,
  });

  useEffect(() => {
    setLocalOS(os);
    setMaoObra(os.mao_de_obra ?? 0);
  }, [os]);

  if (!localOS) {
    return <div className="p-4">Ordem de serviço não encontrada.</div>;
  }

  // ================================
  // Ações
  // ================================
  const adicionarItem = () => {
    if (!novoItem.descricao || novoItem.quantidade <= 0) return;

    const valor_total = Number((novoItem.quantidade * novoItem.valor_unitario).toFixed(2));
    const itemComTotal = { ...novoItem, valor_total };

    const itensAtuais: ItemOS[] = Array.isArray(localOS.itens) ? localOS.itens : [];

    const atualizado: OrdemServico = {
      ...localOS,
      itens: [...itensAtuais, itemComTotal],
      valor_total: (localOS.valor_total || 0) + valor_total,
    };

    localDb.updateOS(atualizado);
    setLocalOS(atualizado);

    setNovoItem({
      tipo: "peca",
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

        <div className="text-sm text-zinc-400">Status atual: <span className="text-yellow-400 font-bold uppercase">{localOS.status}</span></div>

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

        {itens.map((f: ItemOS, i: number) => (
          <div
            key={i}
            className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center text-sm border-b border-zinc-800/50 py-2 px-1 hover:bg-zinc-800/30 transition-colors"
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

        <div className="bg-zinc-800/40 p-4 rounded-xl border border-zinc-800 space-y-4 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-2">
              <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">Tipo</label>
              <select
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                value={novoItem.tipo}
                onChange={(e) => setNovoItem({ ...novoItem, tipo: e.target.value as "servico" | "peca" })}
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
