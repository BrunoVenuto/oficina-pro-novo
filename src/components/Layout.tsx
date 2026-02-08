import { ReactNode } from "react";
import { LayoutDashboard, FileText, Users, Settings, Plus } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  currentPage: "dashboard" | "os" | "clientes" | "config";
  onNavigate: (page: "dashboard" | "os" | "clientes" | "config") => void;
  onNewOS: () => void;
}

export function Layout({
  children,
  currentPage,
  onNavigate,
  onNewOS,
}: LayoutProps) {
  const navItems = [
    { id: "dashboard" as const, icon: LayoutDashboard, label: "Dashboard" },
    { id: "os" as const, icon: FileText, label: "OS" },
    { id: "clientes" as const, icon: Users, label: "Clientes" },
    { id: "config" as const, icon: Settings, label: "Config" },
  ];

  // NAV height = 80px (h-20)
  // FAB size = 56px (w-14/h-14)
  // Extra gap = 20px
  const bottomReserve = "pb-[180px]"; // reserva simples e estável

  return (
    <div className="min-h-screen bg-[#0F1216]">
      {/* ✅ NÃO mexe em padding lateral/topo do app (evita “piorar” no frame) */}
      <main className={`w-full max-w-7xl mx-auto ${bottomReserve}`}>
        {children}
      </main>

      {/* ✅ FAB acima da nav, sem invadir conteúdo */}
      <button
        onClick={onNewOS}
        className="fixed right-4 bottom-[104px] w-14 h-14 bg-[#FFC107] rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-50"
        aria-label="Nova OS"
      >
        <Plus className="w-7 h-7 text-[#0F1216]" />
      </button>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#1A1F26] border-t border-gray-800 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-around h-20">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex flex-col items-center justify-center gap-1 min-w-[64px] transition-colors ${
                    isActive ? "text-[#FFC107]" : "text-gray-400"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
