import { useState, useEffect } from 'react';
import { Calendar, Users, Tags, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '../../supabaseClient';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    pendingEvents: 0,
    totalLeaders: 0,
    totalDepartments: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const [
        { count: totalEvents, error: eventsError },
        { count: pendingEvents, error: pendingError },
        { count: totalLeaders, error: leadersError },
        { count: totalDepartments, error: deptsError }
      ] = await Promise.all([
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'Pendente'),
        supabase.from('leaders').select('*', { count: 'exact', head: true }),
        supabase.from('departments').select('*', { count: 'exact', head: true })
      ]);

      if (eventsError) throw eventsError;
      if (pendingError) throw pendingError;
      if (leadersError) throw leadersError;
      if (deptsError) throw deptsError;

      setStats({
        totalEvents: totalEvents || 0,
        pendingEvents: pendingEvents || 0,
        totalLeaders: totalLeaders || 0,
        totalDepartments: totalDepartments || 0
      });
    } catch (e) {
      console.error('Error fetching stats', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Atualiza a cada 30s automaticamente
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    { name: 'Total de Eventos', value: stats.totalEvents, icon: Calendar, color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/20', link: '/admin/events' },
    { name: 'Eventos Pendentes', value: stats.pendingEvents, icon: Clock, color: 'from-amber-400 to-orange-500', shadow: 'shadow-orange-500/20', link: '/admin/events' },
    { name: 'Líderes Cadastrados', value: stats.totalLeaders, icon: Users, color: 'from-emerald-400 to-teal-600', shadow: 'shadow-teal-500/20', link: '/admin/leaders' },
    { name: 'Departamentos', value: stats.totalDepartments, icon: Tags, color: 'from-purple-500 to-pink-600', shadow: 'shadow-pink-500/20', link: '/admin/departments' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-8 pb-10">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-end justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-indigo-900 font-outfit">Visão Geral</h2>
          <p className="text-slate-500 mt-1">Acompanhe as métricas e gerencie as atividades da ADMTN.</p>
        </div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.name} variants={itemVariants} whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 400 }}>
              <Link to={stat.link} className="block bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all p-6 border border-slate-100 group relative overflow-hidden h-full">
                <div className={`absolute top-0 right-0 p-8 -mr-8 -mt-8 rounded-full bg-gradient-to-br ${stat.color} opacity-10 group-hover:scale-150 transition-transform duration-500 pointer-events-none`}></div>

                <div className="flex items-center space-x-4 relative z-10">
                  <div className={`bg-gradient-to-br ${stat.color} p-4 rounded-xl text-white shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.name}</p>
                    {loading ? (
                      <div className="h-9 w-16 bg-slate-200 rounded-lg animate-pulse mt-1" />
                    ) : (
                      <p className="text-3xl font-extrabold text-slate-800 font-outfit">{stat.value}</p>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mt-8 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
        <h3 className="text-xl font-bold text-slate-800 mb-6 font-outfit">Ações Rápidas</h3>
        <div className="flex flex-wrap gap-4">
          <Link to="/admin/events" className="group flex items-center gap-3 bg-indigo-50 text-indigo-700 px-6 py-3 rounded-xl hover:bg-indigo-600 hover:text-white transition-all font-medium shadow-sm hover:shadow-indigo-500/30">
            <CheckCircle className="h-5 w-5" />
            <span>Aprovar Pré-Agendas</span>
            <ArrowRight className="h-4 w-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
          </Link>
          <Link to="/admin/leaders" className="group flex items-center gap-3 bg-white text-slate-700 px-6 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition-all font-medium border border-slate-200 hover:border-slate-800 shadow-sm">
            <Users className="h-5 w-5 group-hover:text-amber-400 transition-colors" />
            <span>Gerenciar Líderes</span>
            <ArrowRight className="h-4 w-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
