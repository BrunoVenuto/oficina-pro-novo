import { useState } from "react";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import { OSList } from "./pages/OSList";
import { NewOSWizard } from "./pages/NewOSWizard";
import OSDetail from "./pages/OSDetail";
import { Clientes } from "./pages/Clientes";
import { Config } from "./pages/Config";
import { Login } from "./pages/Login";
import { WhatsAppModal } from "./components/WhatsAppModal";

import { useAuth } from "./contexts/AuthContext";
import { localDb } from "./lib/localDB";

import type { OrdemServico, OSItem } from "./types";

type Page = "dashboard" | "os" | "clientes" | "config";

type OSDetails = {
  os: OrdemServico;
  itens: OSItem[];
};

type WhatsAppOS = OrdemServico & {
  mensagem?: string;
  telefone?: string;
  totalPecas?: number;
  totalMaoDeObra?: number;
  totalFinal?: number;
};

function formatBRL(value: number): string {
  return Number(value).toFixed(2);
}

function getMaoDeObraExtraFromOS(os: OrdemServico): number {
  const raw = os as unknown as { mao_de_obra?: unknown };
  const n = Number(raw.mao_de_obra ?? 0);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function getStatusFromOS(os: OrdemServico): string {
  const raw = os as unknown as { status?: unknown };
  return typeof raw.status === "string" && raw.status.trim()
    ? raw.status
    : "aberta";
}

function buildItensTexto(itens: OSItem[], tipo: "servico" | "peca"): string {
  const lista = itens.filter((i) => i.tipo === tipo);

  if (lista.length === 0) {
    return tipo === "peca" ? "• (nenhuma peça)" : "• (nenhuma mão de obra)";
  }

  return lista
    .map((i) => {
      const qtd = Number(i.quantidade ?? 0);
      const unit = Number(i.valor_unitario ?? 0);
      const total = Number(i.valor_total ?? 0);

      // Se for serviço, ele é mão de obra (por item)
      return `• ${i.descricao} — ${qtd}x R$ ${formatBRL(unit)} = R$ ${formatBRL(
        total,
      )}`;
    })
    .join("\n");
}

export default function App() {
  const { user, loading } = useAuth();

  const [activePage, setActivePage] = useState<Page>("dashboard");
  const [showNewOSWizard, setShowNewOSWizard] = useState(false);
  const [selectedOS, setSelectedOS] = useState<OrdemServico | null>(null);
  const [whatsappOS, setWhatsappOS] = useState<WhatsAppOS | null>(null);

  if (loading) {
    return <div className="p-6 text-gray-400">Carregando...</div>;
  }

  if (!user) {
    return <Login />;
  }

  // ===================================================
  // WHATSAPP – mensagem com PEÇAS e MÃO DE OBRA (somente)
  // ===================================================
  const handleSendWhatsApp = (osBase: OrdemServico) => {
    const raw = localDb.getOSDetails(osBase.id) as unknown;
    const details = (raw ?? null) as OSDetails | null;

<<<<<<< HEAD
    const osAtual = details?.os ?? (os as OrdemServico);
    const itens = (details?.itens as any[]) ?? [];

    const mao = Number((osAtual).mao_de_obra ?? 0);
=======
    const osAtual = details?.os ?? osBase;
    const itens = details?.itens ?? [];

    // Peças = itens tipo "peca"
    const totalPecas = itens
      .filter((i) => i.tipo === "peca")
      .reduce((s, i) => s + Number(i.valor_total ?? 0), 0);
>>>>>>> c582b9f (feat(os): orçamento e WhatsApp com peças e mão de obra separadas)

    // Mão de obra (itens tipo "servico") + campo extra mao_de_obra (se usado)
    const totalMaoDeObraItens = itens
      .filter((i) => i.tipo === "servico")
      .reduce((s, i) => s + Number(i.valor_total ?? 0), 0);

    const maoDeObraExtra = getMaoDeObraExtraFromOS(osAtual);

    const totalMaoDeObra = Number(
      (totalMaoDeObraItens + maoDeObraExtra).toFixed(2),
    );

    const totalFinal = Number((totalPecas + totalMaoDeObra).toFixed(2));

    const clienteNome = osAtual.cliente?.nome ?? "Cliente";
    const telefone = osAtual.cliente?.telefone ?? "";

<<<<<<< HEAD
    const placa = osAtual?.veiculo?.placa ?? "";
    const modelo = `${osAtual?.veiculo?.marca ?? ""} ${osAtual?.veiculo?.modelo ?? ""
      }`.trim();

    const listaItens =
      itens.length === 0
        ? "• (nenhum item lançado)\n"
        : itens
          .map(
            (i: any) =>
              `• ${i.descricao} — ${i.quantidade}x R$ ${Number(
                i.valor_unitario ?? 0,
              ).toFixed(2)} = R$ ${Number(i.valor_total ?? 0).toFixed(2)}`,
          )
          .join("\n") + "\n";
=======
    const placa = osAtual.veiculo?.placa ?? "";
    const modelo = `${osAtual.veiculo?.marca ?? ""} ${
      osAtual.veiculo?.modelo ?? ""
    }`.trim();

    const status = getStatusFromOS(osAtual);
>>>>>>> c582b9f (feat(os): orçamento e WhatsApp com peças e mão de obra separadas)

    const pecasTxt = buildItensTexto(itens, "peca");

    // Aqui “servico” vira “mão de obra”
    const maoItensTxt = buildItensTexto(itens, "servico");
    const maoExtraTxt =
      maoDeObraExtra > 0
        ? `\n• Mão de obra (mecânico): R$ ${formatBRL(maoDeObraExtra)}`
        : "";

    const mensagem =
      `Olá, ${clienteNome}! 👋\n\n` +
      `Orçamento / Atualização da OS #${osAtual.numero ?? ""}\n` +
      `🚗 Veículo: ${placa}${modelo ? ` (${modelo})` : ""}\n` +
      `📌 Status: ${status}\n\n` +
      `🔩 Peças:\n${pecasTxt}\n\n` +
      `🧰 Mão de obra:\n${maoItensTxt}${maoExtraTxt}\n\n` +
      `📌 Total:\n` +
      `• Peças: R$ ${formatBRL(totalPecas)}\n` +
      `• Mão de obra: R$ ${formatBRL(totalMaoDeObra)}\n` +
      `💰 Total geral: R$ ${formatBRL(totalFinal)}\n\n` +
      `Qualquer dúvida, estou à disposição.`;

    setWhatsappOS({
      ...osAtual,
      valor_total: totalFinal,
      mensagem,
      telefone,
      totalPecas,
      totalMaoDeObra,
      totalFinal,
    });
  };

  const handleBackFromOS = () => {
    setSelectedOS(null);
  };

  const handleCompleteWizard = () => {
    setShowNewOSWizard(false);
    setActivePage("os");
  };

  const renderContent = () => {
    if (showNewOSWizard) {
      return (
        <NewOSWizard
          onClose={() => setShowNewOSWizard(false)}
          onComplete={handleCompleteWizard}
        />
      );
    }

    if (selectedOS) {
      return (
        <>
          <OSDetail
            os={selectedOS}
            onBack={handleBackFromOS}
            onSendWhatsApp={handleSendWhatsApp}
          />

          {whatsappOS && (
            <WhatsAppModal
              os={whatsappOS}
              onClose={() => setWhatsappOS(null)}
            />
          )}
        </>
      );
    }

    switch (activePage) {
      case "dashboard":
        return <Dashboard onSelectOS={(os) => setSelectedOS(os)} />;
      case "os":
<<<<<<< HEAD
        return (
          <OSList
            onSelectOS={(os) => setSelectedOS(os)}

          />
        );

=======
        return <OSList onSelectOS={(os) => setSelectedOS(os)} />;
>>>>>>> c582b9f (feat(os): orçamento e WhatsApp com peças e mão de obra separadas)
      case "clientes":
        return <Clientes />;
      case "config":
        return <Config />;
      default:
        return <Dashboard onSelectOS={(os) => setSelectedOS(os)} />;
    }
  };

  return (
    <Layout
      currentPage={activePage}
      onNavigate={setActivePage}
      onNewOS={() => setShowNewOSWizard(true)}
    >
      {renderContent()}
    </Layout>
  );
}
