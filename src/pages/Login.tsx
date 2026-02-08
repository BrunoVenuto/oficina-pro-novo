import { useState, FormEvent } from 'react';
import { Wrench } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function Login() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        setError('Conta criada! Faça login para continuar.');
        setIsSignUp(false);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    setError('');
    try {
      await signIn('demo@oficina.com', 'demo123');
    } catch (err) {
      setError('Conta demo não encontrada. Crie uma conta primeiro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1216] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#FFC107] rounded-2xl mb-4">
            <Wrench className="w-10 h-10 text-[#0F1216]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Oficina Pro</h1>
          <p className="text-gray-400">Gestão profissional de ordens de serviço</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="Email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            type="password"
            label="Senha"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <div className={`p-4 rounded-xl text-sm ${
              error.includes('criada')
                ? 'bg-[#22C55E]/20 text-[#22C55E]'
                : 'bg-[#EF4444]/20 text-[#EF4444]'
            }`}>
              {error}
            </div>
          )}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Carregando...' : isSignUp ? 'Criar conta' : 'Entrar'}
          </Button>

          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-sm text-gray-400 hover:text-[#FFC107] transition-colors"
          >
            {isSignUp ? 'Já tem uma conta? Entrar' : 'Não tem conta? Criar agora'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#0F1216] text-gray-500">ou</span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={handleDemo}
            disabled={loading}
          >
            Entrar como demonstração
          </Button>
        </form>
      </div>
    </div>
  );
}
