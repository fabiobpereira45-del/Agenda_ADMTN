import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, X, Trash2, Edit2, Plus, Calendar as CalendarIcon, Filter, Search, Clock, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { parseDateLocal } from '../../utils/dateUtils';
import { supabase } from '../../supabaseClient';

export default function ManageEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '', date: '', time: '', location: '', department_id: '', description: '', status: 'Aprovado', type: 'Interno'
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [{ data: eventsData, error: eventsError }, { data: deptsData, error: deptsError }] = await Promise.all([
        supabase
          .from('events')
          .select('*, departments(name)')
          .order('date', { ascending: true }),
        supabase
          .from('departments')
          .select('*')
          .order('name')
      ]);

      if (eventsError) throw eventsError;
      if (deptsError) throw deptsError;

      const mappedEvents = (eventsData || []).map((e: any) => ({
        ...e,
        department_name: e.departments?.name
      }));

      setEvents(mappedEvents);
      setDepartments(deptsData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'Aprovado' })
        .eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (e: any) {
      alert(e.message || 'Erro ao aprovar evento');
    }
  };

  const handleReject = async (id: number) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'Rejeitado' })
        .eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (e: any) {
      alert(e.message || 'Erro ao rejeitar evento');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (e: any) {
      alert(e.message || 'Erro ao excluir evento');
    }
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      department_id: event.department_id || '',
      description: event.description || '',
      status: event.status,
      type: event.type
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = {
        title: formData.title,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        department_id: formData.department_id || null,
        description: formData.description,
        status: formData.status,
        type: formData.type
      };

      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update(dataToSave)
          .eq('id', editingEvent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('events')
          .insert([dataToSave]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      setEditingEvent(null);
      fetchData();
    } catch (e: any) {
      alert(e.message || 'Erro ao salvar evento');
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229);
    doc.text('ADMTN - Relatório de Eventos', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')} `, 14, 30);

    const tableData = filteredEvents.map(e => [
      format(parseDateLocal(e.date), 'dd/MM/yyyy'),
      e.time,
      e.title,
      e.location,
      e.department_name || 'Geral'
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Data', 'Hora', 'Evento', 'Local', 'Departamento']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 10 }
    });

    doc.save(`eventos - admtn - ${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aprovado': return 'bg-emerald-100/80 text-emerald-800 border-emerald-200';
      case 'Pendente': return 'bg-amber-100/80 text-amber-800 border-amber-200';
      case 'Rejeitado': return 'bg-rose-100/80 text-rose-800 border-rose-200';
      case 'Cancelamento Solicitado': return 'bg-orange-100/80 text-orange-800 border-orange-200';
      default: return 'bg-slate-100/80 text-slate-800 border-slate-200';
    }
  };

  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filteredEvents = events
    .filter(e => e.type === 'Interno')
    .filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase()) || e.location.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(e => !filterDept || e.department_id?.toString() === filterDept)
    .filter(e => !filterStatus || e.status === filterStatus)
    .sort((a, b) => parseDateLocal(a.date).getTime() - parseDateLocal(b.date).getTime());

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-sm border border-slate-200/60">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3 font-outfit">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <CalendarIcon className="h-6 w-6" />
            </div>
            Gerenciamento de Eventos
          </h2>
          <p className="text-slate-500 mt-2 text-sm ml-14">Aprove pré-agendas, agende novos cultos e administre o calendário geral.</p>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar título ou local..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
          >
            <option value="">Todos Departamentos</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
          >
            <option value="">Todos Status</option>
            <option value="Aprovado">Aprovado</option>
            <option value="Pendente">Pendente</option>
            <option value="Rejeitado">Rejeitado</option>
            <option value="Cancelamento Solicitado">Solic. Cancelamento</option>
          </select>

          <button
            onClick={downloadPDF}
            className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all shadow-sm"
            title="Baixar Relatório PDF"
          >
            <FileDown className="h-5 w-5" />
          </button>

          <button
            onClick={() => {
              setEditingEvent(null);
              setFormData({ title: '', date: '', time: '', location: '', department_id: '', description: '', status: 'Aprovado', type: 'Interno' });
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all font-medium whitespace-nowrap"
          >
            <Plus className="h-5 w-5" /> <span className="hidden sm:inline">Novo Evento</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <th className="p-5 font-outfit">Data / Hora</th>
                <th className="p-5 font-outfit">Evento</th>
                <th className="p-5 font-outfit">Departamento</th>
                <th className="p-5 font-outfit">Status</th>
                <th className="p-5 text-right font-outfit">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              <AnimatePresence>
                {filteredEvents.map((event, i) => (
                  <motion.tr
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-indigo-50/30 transition-colors group"
                  >
                    <td className="p-5">
                      <div className="font-semibold text-slate-800">{format(parseDateLocal(event.date), 'dd/MM/yyyy')}</div>
                      <div className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {event.time}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="font-semibold text-slate-800">{event.title}</div>
                      <div className="text-sm text-slate-500 mt-0.5" title={event.location}>{event.location}</div>
                    </td>
                    <td className="p-5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200/50">
                        {event.department_name || 'Geral'}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className={`px - 3 py - 1.5 rounded - full text - xs font - bold border shadow - sm ${getStatusColor(event.status)} `}>
                        {event.status}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex justify-end items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        {event.status === 'Pendente' && (
                          <>
                            <button onClick={() => handleApprove(event.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 hover:shadow shadow-emerald-500/10 rounded-xl transition-all" title="Aprovar">
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleReject(event.id)} className="p-2 text-rose-600 hover:bg-rose-50 hover:shadow shadow-rose-500/10 rounded-xl transition-all" title="Rejeitar">
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button onClick={() => handleEdit(event)} className="p-2 text-indigo-600 hover:bg-indigo-50 hover:shadow shadow-indigo-500/10 rounded-xl transition-all" title="Editar">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(event.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:shadow shadow-rose-500/10 rounded-xl transition-all" title="Excluir">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>

              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <CalendarIcon className="h-12 w-12 text-slate-300 mb-4" />
                      <p className="text-lg font-medium text-slate-600">Nenhum evento encontrado.</p>
                      <p className="text-sm mt-1">Experimente ajustar os filtros ou cadastrar um novo evento.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 border border-slate-200"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-800 font-outfit">
                  {editingEvent ? 'Editar Evento' : 'Novo Evento'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6">
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Título do Evento</label>
                    <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all" placeholder="Ex: Culto de Jovens" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Data</label>
                    <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Hora</label>
                    <input type="time" required value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Localização</label>
                    <input type="text" required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all" placeholder="Ex: Templo Principal" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Departamento Responsável</label>
                    <select required value={formData.department_id} onChange={e => setFormData({ ...formData, department_id: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all">
                      <option value="">Geral da Igreja</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Status de Aprovação</label>
                    <select required value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all">
                      <option value="Aprovado">Aprovado (Visível)</option>
                      <option value="Pendente">Pendente (Pré-agenda)</option>
                      <option value="Rejeitado">Rejeitado</option>
                      <option value="Cancelamento Solicitado">Cancelamento Solicitado</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Descrição</label>
                    <textarea rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all" placeholder="Detalhes adicionais sobre o evento..."></textarea>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 active:scale-95">
                    {editingEvent ? 'Salvar Alterações' : 'Criar Evento'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
