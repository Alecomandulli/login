
import React, { useState } from 'react';
import { User } from '../types';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !cpf) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    // Simulação de banco de dados no localStorage
    const usersStorage = localStorage.getItem('ambulanceUsers');
    const users: User[] = usersStorage ? JSON.parse(usersStorage) : [];

    // Lógica de Login
    // Admin backdoor para primeiro acesso se a lista estiver vazia (tratado no App.tsx, mas verificação de segurança aqui)
    const user = users.find(u => u.email === email && u.cpf === cpf);
    
    if (user) {
      onLogin(user);
    } else {
      setError('Credenciais inválidas ou usuário não encontrado. Contate o administrador.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
            Ambulância Check
          </h1>
          <p className="text-gray-400">Sistema Inteligente de Vistoria</p>
        </div>

        <div className="mb-6 text-center">
            <h2 className="text-xl text-white font-semibold">Login</h2>
            <p className="text-sm text-gray-500">Acesso restrito a condutores e administradores</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">CPF</label>
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
              placeholder="000.000.000-00"
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 rounded-lg shadow-lg transform transition hover:scale-[1.02]"
          >
            Entrar no Sistema
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-gray-600">
             Caso não tenha acesso, solicite ao supervisor de frota.
        </div>
      </div>
    </div>
  );
};
