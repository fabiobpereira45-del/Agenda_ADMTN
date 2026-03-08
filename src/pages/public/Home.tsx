import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Download, Share2, Calendar as CalendarIcon, Filter, MapPin, Clock, Sparkles, Globe, Search, Users, Phone } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'motion/react';
import { parseDateLocal } from '../../utils/dateUtils';
import { supabase } from '../../supabaseClient';

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    events: true,
    commemorative: true,
    leaders: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [{ data: eventsData, error: eventsError }, { data: deptsData, error: deptsError }, { data: leadersData, error: leadersError }] = await Promise.all([
        supabase
          .from('events')
          .select('*, departments(name)')
          .eq('status', 'Aprovado'),
        supabase
          .from('departments')
          .select('*')
          .order('name'),
        supabase
          .from('leaders')
          .select('*, departments(name)')
          .eq('status', 'Ativo')
      ]);

      if (eventsError) throw eventsError;
      if (deptsError) throw deptsError;
      if (leadersError) throw leadersError;

      const mappedEvents = (eventsData || []).map((e: any) => ({
        ...e,
        department_name: e.departments?.name
      }));

      const mappedLeaders = (leadersData || []).map((l: any) => ({
        ...l,
        department_name: l.departments?.name
      }));

      setEvents(mappedEvents);
      setDepartments(deptsData || []);
      setLeaders(mappedLeaders);
    } catch (e) {
      console.error('Error fetching data', e);
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const filteredEvents = events.filter(e => {
    const isSpecial = e.type !== 'Interno';
    const matchesDept = !selectedDept || e.department_id === parseInt(selectedDept);

    if (isSpecial) return filters.commemorative && matchesDept;
    return filters.events && matchesDept;
  });

  const getEventsForDay = (day: Date) => {
    return filteredEvents.filter(e => isSameDay(parseDateLocal(e.date), day));
  };

  const handleDownloadPDF = (type: 'events' | 'commemorative') => {
    const doc = new jsPDF();
    const isCommemorative = type === 'commemorative';

    // Add header
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // indigo-600
    doc.text('ADMTN', 14, 20);
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(isCommemorative ? 'Datas Comemorativas e Feriados' : 'Agenda Oficial de Eventos', 14, 30);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 38);
    doc.text(`Mês: ${format(currentDate, 'MMMM yyyy', { locale: ptBR })}`, 14, 44);

    const tableData = events
      .filter(e => isSameMonth(parseDateLocal(e.date), currentDate))
      .filter(e => isCommemorative ? e.type !== 'Interno' : e.type === 'Interno')
      .sort((a, b) => parseDateLocal(a.date).getTime() - parseDateLocal(b.date).getTime())
      .map(e => [
        format(parseDateLocal(e.date), 'dd/MM/yyyy'),
        isCommemorative ? '-' : e.time,
        e.title,
        isCommemorative ? (e.location || 'Nacional') : (e.department_name || '-'),
        isCommemorative ? e.type : e.location
      ]);

    autoTable(doc, {
      startY: 50,
      head: [isCommemorative ? ['Data', 'Hora', 'Título', 'Abrangência', 'Tipo'] : ['Data', 'Hora', 'Evento', 'Departamento', 'Local']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: isCommemorative ? [192, 38, 211] : [79, 70, 229] }, // fuchsia-600 or indigo-600
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        4: { cellWidth: 40 }
      }
    });

    const fileName = isCommemorative ? `feriados-admtn-${format(currentDate, 'MM-yyyy')}.pdf` : `agenda-admtn-${format(currentDate, 'MM-yyyy')}.pdf`;
    doc.save(fileName);
  };

  const handleShareWhatsApp = () => {
    const text = `Confira a agenda da ADMTN: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCancelRequest = async (id: number) => {
    if (!confirm('Deseja solicitar o cancelamento deste evento? A diretoria será notificada.')) return;
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'Cancelamento Solicitado' })
        .eq('id', id);

      if (error) throw error;

      alert('Solicitação de cancelamento enviada com sucesso.');
      fetchData();
    } catch (e: any) {
      alert(e.message || 'Erro ao solicitar cancelamento.');
    }
  };

  const nextEvents = events
    .filter(e => parseDateLocal(e.date) >= new Date())
    .sort((a, b) => parseDateLocal(a.date).getTime() - parseDateLocal(b.date).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-12 pb-12 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-hidden">

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border border-white/10"
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-purple-500 rounded-full blur-[100px] opacity-30"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-indigo-500 rounded-full blur-[100px] opacity-30"></div>

        <div className="relative z-10 p-6 sm:p-12 md:p-16 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="flex-1 space-y-6 text-center md:text-left w-full">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-indigo-200 text-sm font-medium backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>Bem-vindo à ADMTN</span>
            </motion.div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight font-outfit">
              Agenda <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                Oficial e Completa
              </span>
            </h1>
            <p className="text-lg text-indigo-100 max-w-xl mx-auto md:mx-0 font-light leading-relaxed">
              Fique por dentro de todos os eventos, cultos e programações. Participe e conecte-se com nossa comunidade.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center md:justify-start"
            >
              <Link
                to="/pre-agenda"
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-[0_10px_30px_rgba(79,70,229,0.4)] hover:shadow-[0_15px_40px_rgba(79,70,229,0.6)] transition-all transform hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <CalendarIcon className="w-6 h-6" />
                <span>Solicitar Pré-Agenda</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="hidden lg:flex flex-shrink-0"
          >
            <img src="/logo.png" alt="ADMTN" className="w-64 h-auto drop-shadow-[0_20px_50px_rgba(79,70,229,0.3)]" />
          </motion.div>

          {nextEvents.length > 0 && (
            <motion.div
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="w-full md:w-80 glass-dark p-6 rounded-2xl flex flex-col gap-4"
            >
              <h3 className="text-white font-semibold flex items-center gap-2 border-b border-white/10 pb-3">
                <CalendarIcon className="w-5 h-5 text-indigo-400" /> Próximos Eventos
              </h3>
              <div className="space-y-4">
                {nextEvents.map((event, i) => (
                  <div key={i} className="group relative pl-4 border-l-2 border-indigo-500 hover:border-purple-400 transition-colors">
                    <div className="text-xs text-indigo-300 font-medium mb-1">
                      {format(parseDateLocal(event.date), "dd 'de' MMM", { locale: ptBR })} às {event.time}
                    </div>
                    <div className="text-white font-medium text-sm group-hover:text-indigo-200 transition-colors">
                      {event.title}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* Main Calendar Section */}
      <section className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/80 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={prevMonth} className="px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm text-slate-600 transition-all font-medium">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="px-6 py-2 text-slate-800 font-bold font-outfit capitalize flex items-center justify-center min-w-[150px]">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </div>
              <button onClick={nextMonth} className="px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm text-slate-600 transition-all font-medium">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Central Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 flex-1 lg:px-4">
            <button
              onClick={() => handleDownloadPDF('events')}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-all font-semibold shadow-sm text-sm"
              title="Baixar Agenda em PDF"
            >
              <Download className="w-4 h-4" /> Agenda PDF
            </button>
            <button
              onClick={() => handleDownloadPDF('commemorative')}
              className="flex items-center gap-2 px-4 py-2.5 bg-fuchsia-50 text-fuchsia-700 rounded-xl border border-fuchsia-100 hover:bg-fuchsia-100 transition-all font-semibold shadow-sm text-sm"
              title="Baixar Feriados em PDF"
            >
              <Download className="w-4 h-4" /> Feriados PDF
            </button>
          </div>

          <div className="flex flex-wrap gap-4 w-full lg:w-auto items-center">
            {/* Multi-Category Checkboxes */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white transition-all cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.events}
                  onChange={() => setFilters({ ...filters, events: !filters.events })}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">Eventos</span>
              </label>

              <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white transition-all cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.commemorative}
                  onChange={() => setFilters({ ...filters, commemorative: !filters.commemorative })}
                  className="w-4 h-4 rounded border-slate-300 text-fuchsia-600 focus:ring-fuchsia-500 cursor-pointer"
                />
                <span className="text-sm font-bold text-slate-700 group-hover:text-fuchsia-600 transition-colors">Datas</span>
              </label>

              <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white transition-all cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.leaders}
                  onChange={() => setFilters({ ...filters, leaders: !filters.leaders })}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">Líderes</span>
              </label>
            </div>

            <div className="flex-1 lg:flex-none flex items-center gap-2 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200">
              <Filter className="h-4 w-4 text-slate-400 shrink-0" />
              <select
                className="bg-transparent border-none text-sm focus:ring-0 text-slate-700 font-medium w-full outline-none"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="">Todos Departamentos</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <button onClick={handleShareWhatsApp} className="flex-1 lg:flex-none justify-center flex items-center gap-2 bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/20 px-4 py-2.5 rounded-xl hover:bg-[#25D366]/20 transition-all shadow-sm text-sm font-medium">
              <Share2 className="h-4 w-4" /> Compartilhar
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/80">
            {weekDays.map(day => (
              <div key={day} className="py-4 text-center text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr">
            {days.map((day, i) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toString()}
                  className={`min-h-[100px] sm:min-h-[140px] p-1 sm:p-2 border-b border-r border-slate-100 transition-colors 
                    ${!isCurrentMonth ? 'bg-slate-50/40 text-slate-400' : 'bg-white hover:bg-slate-50/40'} 
                    ${isToday ? 'bg-indigo-50/20 shadow-[inset_0_2px_0_0_rgba(79,70,229,1)]' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2 px-1">
                    <span className={`text-sm sm:text-base font-bold w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full transition-all ${isToday ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : isCurrentMonth ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-400'}`}>
                      {format(day, dateFormat)}
                    </span>
                  </div>

                  <div className="space-y-1 sm:space-y-2 overflow-y-auto max-h-[100px] nice-scrollbar px-1">
                    {dayEvents.map(event => {
                      const isSpecial = event.type !== 'Interno';
                      const isFamilyCult = event.title.toUpperCase().includes('FAMÍLIA');
                      const isSelected = selectedEventId === event.id;

                      return (
                        <div
                          key={event.id}
                          onClick={() => setSelectedEventId(isSelected ? null : event.id)}
                          className={`group cursor-pointer rounded-lg border transition-all duration-200 overflow-hidden
                            ${isSelected
                              ? isSpecial ? 'bg-fuchsia-600 border-fuchsia-600 shadow-md transform scale-[1.01]' : isFamilyCult ? 'bg-orange-600 border-orange-600 shadow-md transform scale-[1.02]' : 'bg-indigo-600 border-indigo-600 shadow-md transform scale-[1.02]'
                              : isSpecial ? 'bg-fuchsia-50/50 border-fuchsia-100 hover:border-fuchsia-300' : isFamilyCult ? 'bg-orange-50/80 border-orange-200 hover:border-orange-400' : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'}`}
                        >
                          <div className={`px-2 py-1.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                            {!isSpecial && (
                              <span className={`text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md w-fit ${isSelected ? 'bg-white/20 text-white' : isFamilyCult ? 'bg-orange-100 text-orange-800' : 'bg-indigo-50 text-indigo-700'}`}>
                                {event.time}
                              </span>
                            )}
                            {isSpecial && (
                              <Sparkles className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-fuchsia-500'}`} />
                            )}
                            <span className={`${isSpecial ? 'text-[9px] sm:text-[11px]' : 'text-[10px] sm:text-xs'} font-semibold line-clamp-2 ${isSelected ? 'text-white' : isSpecial ? 'text-fuchsia-900' : isFamilyCult ? 'text-orange-950 font-bold' : 'text-slate-800'}`} translate="no">
                              {event.title}
                            </span>
                          </div>

                          {/* Expanded View */}
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className={`px-3 pb-3 pt-1 text-[11px] sm:text-xs flex flex-col gap-1.5 border-t ${isSpecial ? 'text-fuchsia-50 border-fuchsia-500/30' : 'text-indigo-100 border-white/20'}`}
                              >
                                <div className="flex items-start gap-1.5">
                                  {isSpecial ? <Globe className="w-3.5 h-3.5 mt-0.5 opacity-70 shrink-0" /> : <MapPin className="w-3.5 h-3.5 mt-0.5 opacity-70 shrink-0" />}
                                  <span className="line-clamp-2">{event.location}</span>
                                </div>

                                {event.description && (
                                  <p className="opacity-80 leading-relaxed italic">"{event.description}"</p>
                                )}

                                {isSpecial ? (
                                  <a
                                    href={`https://www.google.com/search?q=${encodeURIComponent(event.title)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="mt-1 flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 px-2 py-1.5 rounded text-[10px] font-bold transition-colors w-full"
                                  >
                                    <Search className="w-3 h-3" />
                                    Saber mais sobre esta data
                                  </a>
                                ) : (
                                  <>
                                    {event.department_name && (
                                      <div className="flex items-center gap-1.5 opacity-90 font-medium" translate="no">
                                        • {event.department_name}
                                      </div>
                                    )}
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleCancelRequest(event.id); }}
                                      className="mt-2 text-white bg-red-500/80 hover:bg-red-500 px-2 py-1.5 rounded text-[10px] font-bold w-full transition-colors flex justify-center"
                                    >
                                      Solicitar Cancelamento
                                    </button>
                                  </>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leaders Directory Section */}
        <AnimatePresence>
          {filters.leaders && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-12 space-y-6"
            >
              <div className="flex items-center gap-3 px-2">
                <div className="p-2 bg-emerald-500 rounded-lg shadow-lg shadow-emerald-500/20">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 font-outfit">Diretório de Líderes</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {leaders
                  .filter(l => !selectedDept || l.department_id === parseInt(selectedDept))
                  .filter(l => l.status === 'Ativo')
                  .map((leader, i) => (
                    <motion.div
                      key={leader.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                            {leader.name}
                          </h4>
                          <div className="text-xs font-medium text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded-full w-fit">
                            {leader.role || 'Líder'}
                          </div>
                        </div>
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all">
                          <Users className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-slate-50 pt-4 mt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Departamento</span>
                          <span className="font-bold text-slate-700">{leader.department_name || '-'}</span>
                        </div>
                        {leader.phone && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Contato</span>
                            <a
                              href={`https://wa.me/55${leader.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                            >
                              <Phone className="w-3.5 h-3.5" /> {leader.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}

                {leaders.filter(l => !selectedDept || l.department_id === parseInt(selectedDept)).filter(l => l.status === 'Ativo').length === 0 && (
                  <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-400 font-medium">Nenhum líder encontrado com os filtros selecionados.</p>
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
