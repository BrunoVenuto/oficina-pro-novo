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

import type { OrdemServico } from "./types";

export default function App() {
  const { user, loading } = useAuth();

  const [activePage, setActivePage] = useState<
    "dashboard" | "os" | "clientes" | "config"
  >("dashboard");

  const [showNewOSWizard, setShowNewOSWizard] = useState(false);
  const [selectedOS, setSelectedOS] = useState<OrdemServico | null>(null);

  const [whatsappOS, setWhatsappOS] = useState<any>(null);

  if (loading) {
    return <div className="p-6 text-gray-400">Carregando...</div>;
  }

  if (!user) {
    return <Login />;
  }

  // ===================================================
  // WHATSAPP – mensagem com mão de obra + total
  // ===================================================
  const handleSendWhatsApp = (os: any) => {
    // Garante dados atualizados do "banco" local
    const details = localDb.getOSDetails(os.id);

    const osAtual = details?.os ?? (os as OrdemServico);
    const itens = (details?.itens as any[]) ?? [];

    const mao = Number((osAtual).mao_de_obra ?? 0);

    const totalItens = itens.reduce(
      (sum: number, i: any) => sum + Number(i.valor_total ?? 0),
      0,
    );

    const totalFinal = Number((totalItens + mao).toFixed(2));

    const clienteNome = osAtual?.cliente?.nome ?? "Cliente";
    const clienteTel = osAtual?.cliente?.telefone ?? "";

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

    const msg =
      `Olá, ${clienteNome}! 👋\n\n` +
      `Atualização da sua OS #${osAtual?.numero ?? ""}\n` +
      `🚗 Veículo: ${placa}${modelo ? ` (${modelo})` : ""}\n` +
      `📌 Status: ${osAtual?.status ?? "aberta"}\n\n` +
      `🧾 Itens:\n${listaItens}\n` +
      `👨‍🔧 Mão de obra: R$ ${mao.toFixed(2)}\n` +
      `💰 Total: R$ ${totalFinal.toFixed(2)}\n\n` +
      `Qualquer dúvida, estou à disposição.`;

    setWhatsappOS({
      ...osAtual,
      mensagem: msg,
      telefone: clienteTel,
      totalFinal,
      maoDeObra: mao,
      totalItens,
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
        return (
          <OSList
            onSelectOS={(os) => setSelectedOS(os)}

          />
        );

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
