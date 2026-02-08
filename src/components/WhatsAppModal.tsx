import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { OrdemServico } from '../types';
import { Button } from './ui/Button';
import { TextArea } from './ui/TextArea';

interface WhatsAppModalProps {
  os: OrdemServico;
  onClose: () => void;
}

export function WhatsAppModal({ os, onClose }: WhatsAppModalProps) {
  const defaultMessage = `Olá ${os.cliente?.nome}!

Sua ordem de serviço #${os.numero} foi atualizada.

Veículo: ${os.veiculo?.placa} - ${os.veiculo?.marca} ${os.veiculo?.modelo}
Status: ${getStatusLabel(os.status)}
${os.valor_total > 0 ? `Valor: R$ ${Number(os.valor_total).toFixed(2)}` : ''}
${os.previsao_entrega ? `Previsão de entrega: ${new Date(os.previsao_entrega).toLocaleDateString('pt-BR')}` : ''}

Qualquer dúvida, estamos à disposição!`;

  const [message, setMessage] = useState(defaultMessage);

  const handleSend = () => {
    const phoneNumber = os.cliente?.telefone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-[#1A1F26] rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1A1F26] border-b border-gray-700 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Enviar WhatsApp</h2>
            <p className="text-sm text-gray-400">{os.cliente?.telefone}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <TextArea
            label="Mensagem"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={12}
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

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    aberta: 'Aberta',
    em_andamento: 'Em andamento',
    aguardando_peca: 'Aguardando peça',
    concluida: 'Concluída',
    entregue: 'Entregue',
  };
  return labels[status] || status;
}
