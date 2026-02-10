import { useMemo, useState } from "react";
import { X, Send } from "lucide-react";
import { Button } from "./ui/Button";
import { TextArea } from "./ui/TextArea";

import type { OrdemServico } from "../types";

type WhatsAppOS = OrdemServico & {
  mensagem?: string;
  telefone?: string;
};

interface WhatsAppModalProps {
  os: WhatsAppOS;
  onClose: () => void;
}

/* =======================
   Utils
======================= */
function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    aberta: "Aberta",
    em_andamento: "Em andamento",
    aguardando_peca: "Aguardando peça",
    concluida: "Concluída",
    entregue: "Entregue",
  };
  return map[status] ?? status;
}

export function WhatsAppModal({ os, onClose }: WhatsAppModalProps) {
  /* =======================
     Mensagem base
  ======================= */
  const fallbackMessage = useMemo(() => {
    const cliente = os.cliente?.nome ?? "Cliente";
    const placa = os.veiculo?.placa ?? "";
    const veiculo =
      `${os.veiculo?.marca ?? ""} ${os.veiculo?.modelo ?? ""}`.trim();

    const status = getStatusLabel(
      typeof os.status === "string" ? os.status : "aberta",
    );

    const total =
      typeof os.valor_total === "number"
        ? `R$ ${os.valor_total.toFixed(2)}`
        : "—";

    return (
      `Olá, ${cliente}!\n\n` +
      `Sua ordem de serviço #${os.numero ?? ""} foi atualizada.\n\n` +
      `🚗 Veículo: ${placa}${veiculo ? ` (${veiculo})` : ""}\n` +
      `📌 Status: ${status}\n` +
      `💰 Valor total: ${total}\n\n` +
      `Qualquer dúvida, estamos à disposição.`
    );
  }, [os]);

  const initialMessage =
    typeof os.mensagem === "string" && os.mensagem.trim()
      ? os.mensagem
      : fallbackMessage;

  const [message, setMessage] = useState<string>(initialMessage);

  /* =======================
     Envio
  ======================= */
  const handleSend = () => {
    const rawPhone = os.telefone ?? os.cliente?.telefone ?? "";

    const phoneNumber = rawPhone.replace(/\D/g, "");
    if (!phoneNumber) return;

    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/55${phoneNumber}?text=${encodedMessage}`;

    window.open(url, "_blank");
    onClose();
  };

  /* =======================
     UI
  ======================= */
  return (
    <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-[#1A1F26] rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1A1F26] border-b border-gray-700 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Enviar WhatsApp</h2>
            <p className="text-sm text-gray-400">
              {os.cliente?.telefone ?? os.telefone ?? ""}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <TextArea
            label="Mensagem"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={14}
            placeholder="Digite a mensagem..."
          />

          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancelar
            </Button>

            <Button
              variant="success"
              onClick={handleSend}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Enviar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WhatsAppModal;
