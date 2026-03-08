import { Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Calendar, Users, LayoutDashboard, LogOut, Tags, Menu, X, ArrowLeft, Sparkles, Shield, ShieldAlert, Key, Loader2, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabaseClient';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserAndProfile = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          navigate('/login');
          return;
        }

        // Buscar perfil vinculado
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error || !profileData) {
          // Se não houver perfil, deslogar para segurança ou tratar como erro
          console.error('Perfil não encontrado');
          await supabase.auth.signOut();
          navigate('/login');
          return;
        }

        setProfile(profileData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    checkUserAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        navigate('/login');
      } else {
        // Recarregar perfil em caso de mudança silenciosa
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(data);
      }
    });

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-indigo-200 font-medium tracking-wide">Validando Acesso...</p>
        </motion.div>
      </div>
    );
  }

  // Se a conta estiver pendente, mostrar tela de espera bloqueando o resto
  if (profile?.status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl text-center relative z-10"
        >
          <div className="w-24 h-24 bg-amber-500/20 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-amber-500/20">
            <Clock className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-extrabold text-white font-outfit mb-4">Conta Pendente</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Seu cadastro foi realizado com sucesso! Entretanto, o seu acesso ainda está aguardando a aprovação de um **Administrador Master**.
          </p>
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-xs text-slate-500 flex items-center gap-3 text-left">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
              Você será notificado ou poderá tentar logar novamente assim que seu perfil for aprovado.
            </div>
            <button
              onClick={handleLogout}
              className="w-full py-4 px-6 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all border border-white/10 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sair do Sistema
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Definir itens de navegação baseados no cargo
  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/events', icon: Calendar, label: 'Eventos' },
    { path: '/admin/commemorative', icon: Sparkles, label: 'Datas Comemorativas' },
    { path: '/admin/leaders', icon: Users, label: 'Líderes' },
    { path: '/admin/departments', icon: Tags, label: 'Departamentos' },
  ];

  // Adicionar item de gestão de acessos apenas para Master
  if (profile?.role === 'master') {
    navItems.push({ path: '/admin/access', icon: Shield, label: 'Gestão de Acessos' });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-inter">

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: isMobile ? -280 : 0 }}
        animate={{ x: isSidebarOpen ? 0 : isMobile ? -280 : -280, width: isSidebarOpen ? 256 : 0 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
        className={`fixed md:relative flex-shrink-0 z-50 h-screen bg-slate-900 border-r border-slate-800 flex flex-col transition-all overflow-hidden ${isSidebarOpen ? 'w-64' : 'w-0'}`}
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800/60 bg-slate-950/50">
          <div className="flex items-center space-x-3 text-white">
            <div className="bg-indigo-600 p-1.5 rounded-lg shadow-lg shadow-indigo-500/20">
              <img src="/logo.png" alt="Logo" className="h-6 w-auto" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-sm tracking-wide shrink-0">ADMTN</span>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-tighter">Painel Oficial</span>
            </div>
          </div>
          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-8 px-4 space-y-2 nice-scrollbar">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 px-3 opacity-60">Menu Administrativo</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative overflow-hidden ${isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80 shadow-none'
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={`h-5 w-5 relative z-10 ${isActive ? 'text-white' : 'group-hover:text-indigo-400 transition-colors'}`} />
                <span className="font-bold text-sm relative z-10">{item.label}</span>
              </Link>
            );
          })}

          <div className="mt-8 pt-8 border-t border-slate-800/40">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 px-3 opacity-60">Sua Conta</div>
            <Link
              to="/admin/profile/password"
              className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative overflow-hidden ${location.pathname === '/admin/profile/password' ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800/80'}`}
            >
              <Key className="h-5 w-5 group-hover:text-orange-400 transition-colors" />
              <span className="font-bold text-sm">Trocar Senha</span>
            </Link>
          </div>
        </div>

        <div className="p-4 bg-slate-950/30 border-t border-slate-800/60">
          <div className="bg-slate-800/40 p-4 rounded-3xl mb-4 border border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-white text-xs font-bold truncate">{profile?.full_name}</span>
                <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-tighter truncate opacity-80">{profile?.role}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-5 py-3.5 rounded-2xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all font-bold text-sm"
          >
            <LogOut className="h-5 w-5" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 sticky top-0 z-30 flex items-center justify-between px-6 sm:px-10 border-b border-slate-200/60 bg-white/80 backdrop-blur-md shrink-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors md:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="hidden md:flex items-center text-slate-800">
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="mr-4 p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                >
                  <Menu className="h-5 w-5" />
                </button>
              )}
              <h1 className="text-2xl font-extrabold font-outfit text-slate-800 flex items-center tracking-tight">
                {navItems.find(i => i.path === location.pathname)?.label || (location.pathname.includes('password') ? 'Trocar Senha' : 'Administração')}
              </h1>
            </div>

            <h1 className="text-xl font-extrabold font-outfit text-slate-800 md:hidden flex items-center tracking-tight">
              {navItems.find(i => i.path === location.pathname)?.label || 'Admin'}
            </h1>
          </div>

          <Link
            to="/"
            className="flex items-center space-x-2 text-xs text-slate-600 hover:text-indigo-600 font-bold transition-all bg-slate-100 hover:bg-indigo-50 px-4 py-2.5 rounded-full shadow-sm hover:shadow-md border border-transparent hover:border-indigo-100 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Visualizar Site Público</span>
            <span className="sm:hidden">Sair</span>
          </Link>
        </header>

        <div className="flex-1 overflow-y-auto p-6 sm:p-10 align-top w-full nice-scrollbar">
          <div className="mx-auto w-full max-w-7xl relative">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
