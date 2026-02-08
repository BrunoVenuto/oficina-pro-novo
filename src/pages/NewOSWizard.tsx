import { useState, FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { localDb } from "../lib/localDB"; // ✅ ajuste: localDb (minúsculo)
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { TextArea } from "../components/ui/TextArea";
import { Card } from "../components/ui/Card";

interface NewOSWizardProps {
  onClose: () => void;
  onComplete: () => void;
}

interface FormData {
  clienteNome: string;
  clienteTelefone: string;
  clienteEmail: string;
  veiculoPlaca: string;
  veiculoMarca: string;
  veiculoModelo: string;
  veiculoAno: string;
  veiculoCor: string;
  problemaRelatado: string;
  km: string;
  combustivel: number;
  previsaoEntrega: string;
}

const checklistItems = [
  "Extintor",
  "Triângulo",
  "Macaco",
  "Chave de roda",
  "Estepe",
  "Tapetes",
  "Rádio/multimídia",
  "Documento do veículo",
  "Manual do proprietário",
  "Avarias na lataria",
];

export function NewOSWizard({ onClose, onComplete }: NewOSWizardProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState<FormData>({
    clienteNome: "",
    clienteTelefone: "",
    clienteEmail: "",
    veiculoPlaca: "",
    veiculoMarca: "",
    veiculoModelo: "",
    veiculoAno: "",
    veiculoCor: "",
    problemaRelatado: "",
    km: "",
    combustivel: 50,
    previsaoEntrega: "",
  });

  const updateField = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (
        !formData.clienteNome ||
        !formData.clienteTelefone ||
        !formData.veiculoPlaca
      ) {
        setError("Preencha os campos obrigatórios");
        return;
      }
    } else if (step === 2) {
      if (!formData.problemaRelatado || !formData.km) {
        setError("Preencha os campos obrigatórios");
        return;
      }
    }
    setError("");
    setStep(step + 1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!user) throw new Error("Você precisa estar logado.");

      const cliente = localDb.createCliente({
        nome: formData.clienteNome,
        telefone: formData.clienteTelefone,
        email: formData.clienteEmail || null,
        user_id: user.id,
      });

      const veiculo = localDb.createVeiculo({
        cliente_id: cliente.id,
        placa: formData.veiculoPlaca.toUpperCase(),
        marca: formData.veiculoMarca,
        modelo: formData.veiculoModelo,
        ano: formData.veiculoAno ? parseInt(formData.veiculoAno) : null,
        cor: formData.veiculoCor || null,
        user_id: user.id,
      });

      const os = localDb.createOS({
        cliente_id: cliente.id,
        veiculo_id: veiculo.id,
        problema_relatado: formData.problemaRelatado,
        km: parseInt(formData.km),
        combustivel: formData.combustivel,
        previsao_entrega: formData.previsaoEntrega || null,
        user_id: user.id,
      });

      const checklistData = checklistItems.map((item, index) => ({
        os_id: os.id,
        item,
        checked: checkedItems.has(item),
        ordem: index,
      }));

      localDb.insertChecklist(checklistData);

      onComplete();
    } catch (err) {
      console.error("Erro ao criar OS:", err);
      setError(err instanceof Error ? err.message : "Erro ao criar OS");
    } finally {
      setLoading(false);
    }
  };

  const toggleChecklistItem = (item: string) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(item)) newSet.delete(item);
      else newSet.add(item);
      return newSet;
    });
  };

  return (
    <div className="fixed inset-0 bg-[#0F1216] z-50 overflow-y-auto">
      <div className="min-h-screen">
        {/* HEADER STICKY */}
        <div className="sticky top-0 bg-[#1A1F26] border-b border-gray-800 z-10">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold text-white">Nova OS</h1>
              <div className="w-6" />
            </div>

            <div className="flex items-center justify-between">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${s < step
                        ? "bg-[#22C55E] text-white"
                        : s === step
                          ? "bg-[#FFC107] text-[#0F1216]"
                          : "bg-gray-700 text-gray-400"
                      }`}
                  >
                    {s < step ? <Check className="w-5 h-5" /> : s}
                  </div>

                  {s < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded ${s < step ? "bg-[#22C55E]" : "bg-gray-700"
                        }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FORM
            ✅ PB grande para garantir espaço abaixo da barra fixa
            Barra fixa fica acima da bottom-nav do Layout (h-20)
        */}
        <form
          id="new-os-form"
          onSubmit={handleSubmit}
          className="p-6 space-y-6 pb-[220px]"
        >
          {step === 1 && (
            <>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Cliente e Veículo
                </h2>
                <p className="text-gray-400 text-sm">Informações básicas</p>
              </div>

              <Card>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Cliente
                </h3>
                <div className="space-y-4">
                  <Input
                    label="Nome *"
                    value={formData.clienteNome}
                    onChange={(e) => updateField("clienteNome", e.target.value)}
                    placeholder="Nome completo"
                    required
                  />
                  <Input
                    label="Telefone *"
                    type="tel"
                    value={formData.clienteTelefone}
                    onChange={(e) =>
                      updateField("clienteTelefone", e.target.value)
                    }
                    placeholder="(00) 00000-0000"
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={formData.clienteEmail}
                    onChange={(e) =>
                      updateField("clienteEmail", e.target.value)
                    }
                    placeholder="email@exemplo.com"
                  />
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Veículo
                </h3>
                <div className="space-y-4">
                  <Input
                    label="Placa *"
                    value={formData.veiculoPlaca}
                    onChange={(e) =>
                      updateField("veiculoPlaca", e.target.value.toUpperCase())
                    }
                    placeholder="ABC1D23"
                    maxLength={7}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Marca"
                      value={formData.veiculoMarca}
                      onChange={(e) =>
                        updateField("veiculoMarca", e.target.value)
                      }
                      placeholder="Fiat"
                    />
                    <Input
                      label="Modelo"
                      value={formData.veiculoModelo}
                      onChange={(e) =>
                        updateField("veiculoModelo", e.target.value)
                      }
                      placeholder="Uno"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Ano"
                      type="number"
                      value={formData.veiculoAno}
                      onChange={(e) =>
                        updateField("veiculoAno", e.target.value)
                      }
                      placeholder="2020"
                    />
                    <Input
                      label="Cor"
                      value={formData.veiculoCor}
                      onChange={(e) =>
                        updateField("veiculoCor", e.target.value)
                      }
                      placeholder="Prata"
                    />
                  </div>
                </div>
              </Card>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Detalhes da OS
                </h2>
                <p className="text-gray-400 text-sm">Problema e medições</p>
              </div>

              <Card>
                <div className="space-y-4">
                  <TextArea
                    label="Problema Relatado *"
                    value={formData.problemaRelatado}
                    onChange={(e) =>
                      updateField("problemaRelatado", e.target.value)
                    }
                    placeholder="Descreva o problema relatado pelo cliente..."
                    rows={4}
                    required
                  />

                  <Input
                    label="Quilometragem *"
                    type="number"
                    value={formData.km}
                    onChange={(e) => updateField("km", e.target.value)}
                    placeholder="50000"
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-4">
                      Nível de Combustível: {formData.combustivel}%
                    </label>

                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.combustivel}
                        onChange={(e) =>
                          updateField("combustivel", parseInt(e.target.value))
                        }
                        className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer
                          [&::-webkit-slider-thumb]:appearance-none
                          [&::-webkit-slider-thumb]:w-6
                          [&::-webkit-slider-thumb]:h-6
                          [&::-webkit-slider-thumb]:rounded-full
                          [&::-webkit-slider-thumb]:bg-[#FFC107]"
                      />

                      <div
                        className="absolute top-0 left-0 h-3 bg-[#FFC107] rounded-lg pointer-events-none"
                        style={{ width: `${formData.combustivel}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Vazio</span>
                      <span>Cheio</span>
                    </div>
                  </div>

                  <Input
                    label="Previsão de Entrega"
                    type="datetime-local"
                    value={formData.previsaoEntrega}
                    onChange={(e) =>
                      updateField("previsaoEntrega", e.target.value)
                    }
                  />
                </div>
              </Card>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Checklist do Veículo
                </h2>
                <p className="text-gray-400 text-sm">
                  Marque os itens presentes
                </p>
              </div>

              <Card padding="none">
                {checklistItems.map((item, idx) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleChecklistItem(item)}
                    className={`w-full p-4 flex items-center gap-4 text-left transition-colors active:bg-[#0F1216] ${idx !== checklistItems.length - 1
                        ? "border-b border-gray-700"
                        : ""
                      }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${checkedItems.has(item)
                          ? "bg-[#22C55E] border-[#22C55E]"
                          : "border-gray-600"
                        }`}
                    >
                      {checkedItems.has(item) && (
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      )}
                    </div>
                    <span className="flex-1 text-white">{item}</span>
                  </button>
                ))}
              </Card>
            </>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-[#EF4444]/20 text-[#EF4444] text-sm">
              {error}
            </div>
          )}
        </form>

        {/* ✅ BARRA FIXA REAL (fora do form) */}
        <div className="fixed bottom-20 left-0 right-0 z-50 pointer-events-none">
          <div className="pointer-events-auto px-6 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-6 bg-gradient-to-t from-[#0F1216] via-[#0F1216] to-transparent">
            <div className="max-w-7xl mx-auto flex gap-3">
              {step > 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Voltar
                </Button>
              )}

              {step < 3 ? (
                <Button
                  type="button"
                  fullWidth
                  onClick={handleNext}
                  className="flex items-center justify-center gap-2"
                >
                  Próximo
                  <ArrowRight className="w-5 h-5" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  form="new-os-form"
                  fullWidth
                  disabled={loading}
                  className="flex items-center justify-center gap-2"
                >
                  {loading ? "Criando..." : "Criar OS"}
                  <Check className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
