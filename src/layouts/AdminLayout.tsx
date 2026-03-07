import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Users, LayoutDashboard, LogOut, Tags, Menu, X, ArrowLeft, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabaseClient';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/login');
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

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/events', icon: Calendar, label: 'Eventos' },
    { path: '/admin/commemorative', icon: Sparkles, label: 'Datas Comemorativas' },
    { path: '/admin/leaders', icon: Users, label: 'Líderes' },
    { path: '/admin/departments', icon: Tags, label: 'Departamentos' },
  ];

  const currentNav = navItems.find((i) => i.path === location.pathname) || { label: 'Administração' };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">

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
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/60 bg-slate-950/50">
          <div className="flex items-center space-x-3 text-white">
            <img src="/logo.png" alt="Logo ADMTN" className="h-8 w-auto rounded-lg shadow-lg shadow-indigo-500/20" />
            <span className="font-bold text-lg tracking-wide shrink-0">ADMTN Admin</span>
          </div>
          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 nice-scrollbar">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Menu Principal</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-indigo-600 rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={`h-5 w-5 relative z-10 ${isActive ? 'text-white' : 'group-hover:text-indigo-400 transition-colors'}`} />
                <span className="font-medium relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-4 bg-slate-950/30 border-t border-slate-800/60">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all font-medium"
          >
            <LogOut className="h-5 w-5" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 glass sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 border-b border-slate-200/60 bg-white/80 shrink-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Replace standard menu with modern back button layout on larger screens or sidebar toggle */}
            <div className="hidden md:flex items-center text-slate-800">
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="mr-4 p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
                >
                  <Menu className="h-5 w-5" />
                </button>
              )}
              <h1 className="text-xl font-bold font-outfit text-slate-800 flex items-center">
                {currentNav.label}
              </h1>
            </div>

            {/* Mobile Title */}
            <h1 className="text-lg font-bold font-outfit text-slate-800 md:hidden flex items-center">
              {currentNav.label}
            </h1>
          </div>

          <Link
            to="/"
            className="flex items-center space-x-2 text-sm text-slate-600 hover:text-indigo-600 font-medium transition-colors bg-slate-100 hover:bg-indigo-50 px-3 py-1.5 rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Site Público</span>
            <span className="sm:hidden">Site</span>
          </Link>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 align-top w-full">
          <div className="mx-auto w-full max-w-7xl relative">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
