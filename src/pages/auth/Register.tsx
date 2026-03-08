import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../supabaseClient';

export default function Register() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem.');
            setIsLoading(false);
            return;
        }

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                    }
                }
            });

            if (signUpError) throw signUpError;

            if (data.user) {
                setIsSuccess(true);
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao realizar cadastro.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-slate-900 overflow-hidden font-inter p-4">
            {/* Background Animated Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 z-0"></div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md"
            >
                <Link to="/login" className="inline-flex items-center text-indigo-200 hover:text-white mb-6 text-sm font-medium transition-colors group">
                    <ArrowLeft className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
                    Voltar para o Login
                </Link>

                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 sm:p-10 rounded-[2rem] shadow-2xl relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        {isSuccess ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-6 py-4"
                            >
                                <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>
                                <h2 className="text-2xl font-bold text-white font-outfit">Solicitação Enviada!</h2>
                                <p className="text-indigo-200 text-sm leading-relaxed">
                                    Sua conta foi criada com sucesso, mas está **pendente de aprovação**.
                                    Um administrador master precisa aprovar seu acesso antes que você possa entrar no painel.
                                </p>
                                <Link
                                    to="/login"
                                    className="block w-full py-3.5 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all text-sm border border-white/10"
                                >
                                    Ir para o Login
                                </Link>
                            </motion.div>
                        ) : (
                            <motion.div key="form" className="relative z-10">
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-6">
                                        <User className="h-8 w-8 text-white" />
                                    </div>
                                    <h2 className="text-3xl font-extrabold text-white text-center font-outfit tracking-tight">
                                        Solicitar Acesso
                                    </h2>
                                    <p className="mt-2 text-indigo-200 text-sm text-center font-light">
                                        Cadastre seus dados para análise da diretoria
                                    </p>
                                </div>

                                <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                                    {error && (
                                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-200 text-sm text-center font-medium">
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <User className="h-5 w-5 text-indigo-300 transition-colors" />
                                            </div>
                                            <input
                                                type="text"
                                                name="fullName"
                                                required
                                                className="block w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                                                placeholder="Nome Completo"
                                                value={formData.fullName}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Mail className="h-5 w-5 text-indigo-300 transition-colors" />
                                            </div>
                                            <input
                                                type="email"
                                                name="email"
                                                required
                                                className="block w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                                                placeholder="E-mail"
                                                value={formData.email}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <KeyRound className="h-5 w-5 text-indigo-300 transition-colors" />
                                            </div>
                                            <input
                                                type="password"
                                                name="password"
                                                required
                                                className="block w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                                                placeholder="Senha"
                                                value={formData.password}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-indigo-300 transition-colors" />
                                            </div>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                required
                                                className="block w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                                                placeholder="Confirmar Senha"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full flex justify-center py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-70 text-sm"
                                        >
                                            {isLoading ? 'Processando...' : 'Criar Conta'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
