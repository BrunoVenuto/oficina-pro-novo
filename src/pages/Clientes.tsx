import { useEffect, useState } from 'react';
import { Search, User, Phone, Package } from 'lucide-react';
import { localDb } from '../lib/localDB';
import { Cliente } from '../types';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

export function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      const data = localDb.listClientes();
      setClientes(data);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setLoading(false);
    }
  };


  const filteredClientes = clientes.filter(cliente => {
    const searchLower = searchTerm.toLowerCase();
    return (
      cliente.nome.toLowerCase().includes(searchLower) ||
      cliente.telefone.includes(searchLower) ||
      cliente.email?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#1A1F26] rounded w-32"></div>
          <div className="h-12 bg-[#1A1F26] rounded"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-[#1A1F26] rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Clientes</h1>
        <p className="text-gray-400 text-sm">{filteredClientes.length} clientes cadastrados</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <Input
          type="text"
          placeholder="Buscar por nome, telefone ou email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12"
        />
      </div>

      <div className="space-y-3">
        {filteredClientes.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">Nenhum cliente encontrado</p>
              <p className="text-gray-500 text-sm">
                {searchTerm
                  ? 'Tente ajustar o termo de busca'
                  : 'Crie uma OS para adicionar clientes'}
              </p>
            </div>
          </Card>
        ) : (
          filteredClientes.map((cliente) => (
            <Card key={cliente.id}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#FFC107]/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-[#FFC107]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold text-white mb-1">{cliente.nome}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                    <Phone className="w-4 h-4" />
                    {cliente.telefone}
                  </div>
                  {cliente.email && (
                    <p className="text-sm text-gray-400">{cliente.email}</p>
                  )}
                  {cliente.cpf_cnpj && (
                    <p className="text-xs text-gray-500 mt-2">{cliente.cpf_cnpj}</p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
