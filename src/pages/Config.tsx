import { LogOut, User, Wrench, Info } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export function Config() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Configurações</h1>
        <p className="text-gray-400 text-sm">
          Gerencie sua conta e preferências
        </p>
      </div>

      <Card>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FFC107]/20 flex items-center justify-center shrink-0">
            <User className="w-7 h-7 sm:w-8 sm:h-8 text-[#FFC107]" />
          </div>

          {/* ✅ evita estourar largura */}
          <div className="flex-1 min-w-0">
            <p className="text-base sm:text-lg font-semibold text-white truncate">
              {user?.email}
            </p>
            <p className="text-sm text-gray-400">Conta ativa</p>

            {/* ✅ fallback: se preferir quebrar ao invés de truncar, troque o "truncate" acima por "break-all" */}
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <Card padding="md" className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#1E88E5]/20 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5 text-[#1E88E5]" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-medium">Oficina Pro</p>
            <p className="text-sm text-gray-400 truncate">
              Sistema de gestão v1.0
            </p>
          </div>
        </Card>

        <Card padding="md" className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#22C55E]/20 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-[#22C55E]" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-medium">Sobre</p>
            <p className="text-sm text-gray-400 truncate">
              Sistema mobile-first para oficinas
            </p>
          </div>
        </Card>
      </div>

      <Button
        variant="danger"
        fullWidth
        onClick={handleSignOut}
        className="flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" />
        Sair da conta
      </Button>
    </div>
  );
}
