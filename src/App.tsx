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
};

function brl(n: number): string {
  return Number(n).toFixed(2).replace(".", ",");
}

function getMaoDeObra(os: OrdemServico): number {
  const raw = os as unknown as { mao_de_obra?: unknown };
  const n = Number(raw.mao_de_obra ?? 0);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function getStatus(os: OrdemServico): string {
  const raw = os as unknown as { status?: unknown };
  return typeof raw.status === "string" && raw.status.trim()
    ? raw.status
    : "aberta";
}

function buildItensTexto(itens: OSItem[], tipo: "peca" | "servico"): string {
  const lista = itens.filter((i) => i.tipo === tipo);

  if (lista.length === 0) {
    return tipo === "peca" ? "• (nenhuma peça)" : "• (nenhuma mão de obra)";
  }

  return lista
    .map((i) => {
      const qtd = Number(i.quantidade ?? 0);
      const unit = Number(i.valor_unitario ?? 0);
      const total = Number(i.valor_total ?? 0);
      return `• ${i.descricao} — ${qtd}x R$ ${brl(unit)} = R$ ${brl(total)}`;
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
  // WHATSAPP – orçamento curto (Peças + Mão de obra)
  // ===================================================
  const handleSendWhatsApp = (osBase: OrdemServico) => {
    const raw = localDb.getOSDetails(osBase.id) as unknown;
    const details = (raw ?? null) as OSDetails | null;

    const osAtual = details?.os ?? osBase;
    const itens = details?.itens ?? [];

    const maoExtra = getMaoDeObra(osAtual);

    const totalPecas = itens
      .filter((i) => i.tipo === "peca")
      .reduce((sum, i) => sum + Number(i.valor_total ?? 0), 0);

    const totalMaoItens = itens
      .filter((i) => i.tipo === "servico")
      .reduce((sum, i) => sum + Number(i.valor_total ?? 0), 0);

    const totalMao = Number((totalMaoItens + maoExtra).toFixed(2));
    const totalFinal = Number((totalPecas + totalMao).toFixed(2));

    const clienteNome = osAtual.cliente?.nome ?? "Cliente";
    const clienteTel = osAtual.cliente?.telefone ?? "";

    const placa = osAtual.veiculo?.placa ?? "";
    const modelo =
      `${osAtual.veiculo?.marca ?? ""} ${osAtual.veiculo?.modelo ?? ""}`.trim();

    const status = getStatus(osAtual);

    const pecasTxt = buildItensTexto(itens, "peca");
    const maoItensTxt = buildItensTexto(itens, "servico");
    const maoExtraTxt =
      maoExtra > 0 ? `\n• Mão de obra (mecânico): R$ ${brl(maoExtra)}` : "";

    const msg =
      `ORÇAMENTO OS #${osAtual.numero ?? ""}\n` +
      `${placa}${modelo ? ` • ${modelo}` : ""}\n` +
      `Status: ${status}\n\n` +
      `PEÇAS:\n${pecasTxt}\n\n` +
      `MÃO DE OBRA:\n${maoItensTxt}${maoExtraTxt}\n\n` +
      `TOTAIS:\n` +
      `Peças: R$ ${brl(totalPecas)}\n` +
      `Mão de obra: R$ ${brl(totalMao)}\n` +
      `TOTAL: R$ ${brl(totalFinal)}\n`;

    setWhatsappOS({
      ...osAtual,
      mensagem: msg,
      telefone: clienteTel,
      valor_total: totalFinal,
    });
  };

  // ===================================================
  // Navegação interna
  // ===================================================
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
        return <OSList onSelectOS={(os) => setSelectedOS(os)} />;

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
