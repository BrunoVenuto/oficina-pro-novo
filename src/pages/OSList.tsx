import { useEffect, useState } from 'react';
import { Search, Filter, Package } from 'lucide-react';
import { localDb } from '../lib/localDB';
import { OrdemServico, StatusOS } from '../types';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { Input } from '../components/ui/Input';

interface OSListProps {
  onSelectOS: (os: OrdemServico) => void;
}

export function OSList({ onSelectOS }: OSListProps) {
  const [orders, setOrders] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusOS | 'all'>('all');

  useEffect(() => {
    loadOrders();
  }, []);

const loadOrders = async () => {
  try {
    const data = localDb.listOS();
    setOrders(data);
  } catch (error) {
    console.error("Erro ao carregar OS:", error);
  } finally {
    setLoading(false);
  }
};


  const filteredOrders = orders.filter(os => {
    const matchesSearch = searchTerm === '' ||
      os.numero.toString().includes(searchTerm.toLowerCase()) ||
      os.veiculo?.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || os.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusOptions: Array<{ value: StatusOS | 'all'; label: string }> = [
    { value: 'all', label: 'Todas' },
    { value: 'aberta', label: 'Abertas' },
    { value: 'em_andamento', label: 'Em andamento' },
    { value: 'aguardando_peca', label: 'Aguardando' },
    { value: 'concluida', label: 'Concluídas' },
    { value: 'entregue', label: 'Entregues' },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#1A1F26] rounded w-32"></div>
          <div className="h-12 bg-[#1A1F26] rounded"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-[#1A1F26] rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Ordens de Serviço</h1>
        <p className="text-gray-400 text-sm">{filteredOrders.length} OS encontradas</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <Input
          type="text"
          placeholder="Buscar por placa ou nº OS"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12"
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-400">Filtrar por status</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6">
          {statusOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                statusFilter === option.value
                  ? 'bg-[#FFC107] text-[#0F1216]'
                  : 'bg-[#1A1F26] text-gray-400'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">Nenhuma OS encontrada</p>
              <p className="text-gray-500 text-sm">
                {searchTerm || statusFilter !== 'all'
                  ? 'Tente ajustar os filtros'
                  : 'Crie uma nova OS para começar'}
              </p>
            </div>
          </Card>
        ) : (
          filteredOrders.map((os) => (
            <div
              key={os.id}
              style={{
                borderLeftColor:
                  os.status === 'aberta' ? '#1E88E5' :
                  os.status === 'em_andamento' ? '#FFC107' :
                  os.status === 'aguardando_peca' ? '#F97316' :
                  '#22C55E'
              }}
              className="border-l-4"
            >
              <Card
                onClick={() => onSelectOS(os)}
              >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-2xl font-bold text-white font-mono mb-1">
                    {os.veiculo?.placa}
                  </p>
                  <p className="text-sm text-gray-400 mb-2">
                    OS #{os.numero} • {os.cliente?.nome}
                  </p>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {os.problema_relatado}
                  </p>
                </div>
                <Chip status={os.status} children={undefined} />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                <span className="text-sm text-gray-400">
                  {os.veiculo?.marca} {os.veiculo?.modelo}
                </span>
                <span className="text-lg font-bold text-[#FFC107]">
                  R$ {Number(os.valor_total).toFixed(2)}
                </span>
              </div>
              {os.previsao_entrega && (
                <div className="mt-2 text-xs text-gray-500">
                  Previsão: {new Date(os.previsao_entrega).toLocaleDateString('pt-BR')}
                </div>
              )}
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
