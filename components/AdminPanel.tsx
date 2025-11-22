
import React, { useState, useEffect } from 'react';
import { User } from '../types';

// Declare XLSX from global scope (loaded via CDN)
declare const XLSX: any;

export const AdminPanel: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newCpf, setNewCpf] = useState('');
    const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = () => {
        const stored = localStorage.getItem('ambulanceUsers');
        if (stored) {
            setUsers(JSON.parse(stored));
        }
    };

    const saveUsers = (updatedUsers: User[]) => {
        localStorage.setItem('ambulanceUsers', JSON.stringify(updatedUsers));
        setUsers(updatedUsers);
    };

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newEmail || !newCpf) {
            setMessage({ type: 'error', text: 'Preencha todos os campos.' });
            return;
        }

        if (users.some(u => u.cpf === newCpf || u.email === newEmail)) {
            setMessage({ type: 'error', text: 'Usuário com este CPF ou Email já existe.' });
            return;
        }

        const newUser: User = { name: newName, email: newEmail, cpf: newCpf, role: newRole };
        saveUsers([...users, newUser]);
        
        setNewName('');
        setNewEmail('');
        setNewCpf('');
        setMessage({ type: 'success', text: 'Usuário cadastrado com sucesso.' });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleDeleteUser = (cpfToDelete: string) => {
        if (cpfToDelete === 'admin' || cpfToDelete === '00000000000') {
             setMessage({ type: 'error', text: 'Não é possível remover o administrador principal.' });
             return;
        }
        if (window.confirm('Tem certeza que deseja remover este usuário?')) {
            const updated = users.filter(u => u.cpf !== cpfToDelete);
            saveUsers(updated);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = evt.target?.result;
            try {
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                let addedCount = 0;
                const currentUsers = [...users];

                jsonData.forEach((row: any) => {
                    // Expects columns: nome, email, cpf, role (optional)
                    const name = row.nome || row.Nome || row.NAME;
                    const email = row.email || row.Email || row.EMAIL;
                    const cpf = String(row.cpf || row.CPF || row.doc || '');
                    let role = row.role || row.funcao || 'user';
                    
                    if (role !== 'admin') role = 'user';

                    if (name && email && cpf) {
                        // Check duplicates
                        if (!currentUsers.some(u => u.cpf === cpf || u.email === email)) {
                            currentUsers.push({ name, email, cpf, role });
                            addedCount++;
                        }
                    }
                });

                saveUsers(currentUsers);
                setMessage({ type: 'success', text: `${addedCount} usuários importados com sucesso.` });
            } catch (error) {
                console.error(error);
                setMessage({ type: 'error', text: 'Erro ao ler arquivo. Verifique o formato (Excel/CSV).' });
            }
        };
        reader.readAsBinaryString(file);
        // Clear input
        e.target.value = '';
    };

    return (
        <div className="space-y-8">
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                <h2 className="text-2xl font-bold text-cyan-400 mb-6">Gerenciar Usuários</h2>
                
                {/* Add Form */}
                <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <div className="md:col-span-1">
                        <label className="block text-xs text-gray-400 mb-1">Nome</label>
                        <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm" placeholder="Nome completo" />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs text-gray-400 mb-1">Email</label>
                        <input value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email" className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm" placeholder="Email" />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs text-gray-400 mb-1">CPF</label>
                        <input value={newCpf} onChange={e => setNewCpf(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm" placeholder="CPF" />
                    </div>
                    <div className="md:col-span-1">
                         <label className="block text-xs text-gray-400 mb-1">Perfil</label>
                         <select value={newRole} onChange={e => setNewRole(e.target.value as 'user' | 'admin')} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm">
                             <option value="user">Condutor (Usuário)</option>
                             <option value="admin">Administrador</option>
                         </select>
                    </div>
                    <div className="md:col-span-1 flex items-end">
                        <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded transition text-sm h-10">
                            Adicionar
                        </button>
                    </div>
                </form>
                
                {/* Import Excel */}
                <div className="mb-6 flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                     <div className="flex-grow">
                         <h3 className="text-sm font-semibold text-white mb-1">Importação em Massa (Excel/CSV)</h3>
                         <p className="text-xs text-gray-400">O arquivo deve conter colunas: nome, email, cpf. Opcional: funcao (user/admin).</p>
                     </div>
                     <label className="cursor-pointer bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition text-sm flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Importar Arquivo
                        <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleFileUpload} />
                     </label>
                </div>

                {message && (
                    <div className={`mb-4 p-3 rounded text-sm text-center ${message.type === 'success' ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'}`}>
                        {message.text}
                    </div>
                )}

                {/* Users List */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-700 text-gray-300 text-sm">
                                <th className="p-3 rounded-tl-lg">Nome</th>
                                <th className="p-3">Email</th>
                                <th className="p-3">CPF</th>
                                <th className="p-3">Perfil</th>
                                <th className="p-3 rounded-tr-lg text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {users.map(u => (
                                <tr key={u.cpf} className="hover:bg-gray-700/50 transition">
                                    <td className="p-3 text-white font-medium">{u.name}</td>
                                    <td className="p-3 text-gray-400 text-sm">{u.email}</td>
                                    <td className="p-3 text-gray-400 text-sm font-mono">{u.cpf}</td>
                                    <td className="p-3">
                                        <span className={`text-xs px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-purple-900 text-purple-200 border border-purple-700' : 'bg-blue-900 text-blue-200 border border-blue-700'}`}>
                                            {u.role === 'admin' ? 'Administrador' : 'Condutor'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right">
                                        <button 
                                            onClick={() => handleDeleteUser(u.cpf)}
                                            className="text-red-400 hover:text-red-300 transition"
                                            title="Excluir"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
