import React, { useState, useEffect } from 'react';
import { Users, Check, X, Shield, ShieldCheck, Mail, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../supabaseClient';

export default function ManageAccess() {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Pegar perfil do usuário atual para garantir que é master
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            setCurrentUserProfile(profile);

            if (profile?.role !== 'master') {
                setError('Acesso negado. Apenas administradores Master podem gerenciar permissões.');
                setLoading(false);
                return;
            }

            // Buscar todos os perfis
            const { data: allProfiles, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setProfiles(allProfiles || []);
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar perfis.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ status: newStatus })
                .eq('id', id);

            if (updateError) throw updateError;
            setProfiles(profiles.map(p => p.id === id ? { ...p, status: newStatus } : p));
        } catch (err: any) {
            alert(err.message || 'Erro ao atualizar status.');
        }
    };

    const handleUpdateRole = async (id: string, newRole: 'master' | 'admin' | 'leader') => {
        if (newRole === 'master' && !confirm('Tem certeza que deseja promover este usuário a Master? Ele terá controle total do sistema.')) return;

        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', id);

            if (updateError) throw updateError;
            setProfiles(profiles.map(p => p.id === id ? { ...p, role: newRole } : p));
        } catch (err: any) {
            alert(err.message || 'Erro ao atualizar cargo.');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
        </div>
    );

    if (error) return (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-800 mb-2">Erro de Acesso</h3>
            <p className="text-red-600">{error}</p>
        </div>
    );

    const pendingUsers = profiles.filter(p => p.status === 'pending');
    const activeUsers = profiles.filter(p => p.status === 'approved');

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-800 font-outfit">Gestão de Acessos</h2>
                    <p className="text-slate-500 mt-1">Aprove solicitações e gerencie permissões da equipe.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 font-medium text-sm">
                    <ShieldCheck className="w-4 h-4" /> Perfil Master Ativo
                </div>
            </div>

            {/* Pending Requests */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-amber-600 font-bold uppercase tracking-wider text-xs px-1">
                    <Clock className="w-4 h-4" /> Solicitações Pendentes ({pendingUsers.length})
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {pendingUsers.map(user => (
                            <motion.div
                                key={user.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-white p-5 rounded-2xl border-2 border-amber-100 shadow-sm hover:shadow-md transition-all space-y-4"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 leading-none mb-1">{user.full_name}</h4>
                                            <p className="text-xs text-slate-500">{new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => handleUpdateStatus(user.id, 'approved')}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20"
                                    >
                                        <Check className="w-4 h-4" /> Aprovar
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(user.id, 'rejected')}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-500 rounded-xl text-sm font-bold transition-all"
                                    >
                                        <X className="w-4 h-4" /> Recusar
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {pendingUsers.length === 0 && (
                        <div className="col-span-full py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm italic">
                            Nenhuma solicitação pendente no momento.
                        </div>
                    )}
                </div>
            </section>

            {/* Active Users Table */}
            <section className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-indigo-500" /> Usuários com Acesso
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                                <th className="px-6 py-4">Usuário</th>
                                <th className="px-6 py-4">Cargo / Permissão</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {activeUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-700">{user.full_name}</div>
                                        <div className="text-xs text-slate-400 flex items-center gap-1">
                                            <Mail className="w-3 h-3" /> {user.id.substring(0, 8)}...
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={user.role}
                                            disabled={user.id === currentUserProfile?.id}
                                            onChange={(e) => handleUpdateRole(user.id, e.target.value as any)}
                                            className="text-sm bg-slate-100 border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 disabled:opacity-50"
                                        >
                                            <option value="leader">Líder (Padrão)</option>
                                            <option value="admin">Administrador</option>
                                            <option value="master">Master (Total)</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                            Ativo
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {user.id !== currentUserProfile?.id && (
                                            <button
                                                onClick={() => handleUpdateStatus(user.id, 'rejected')}
                                                className="text-red-400 hover:text-red-600 text-xs font-bold transition-colors"
                                            >
                                                Revogar Acesso
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
