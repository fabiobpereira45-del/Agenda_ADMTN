import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, Trash2, Edit2, Plus, Sparkles, Search, Globe, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { parseDateLocal } from '../../utils/dateUtils';
import { supabase } from '../../supabaseClient';

export default function ManageCommemorative() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<any>(null);
    const [formData, setFormData] = useState({
        title: '', date: '', location: 'Nacional', description: '', status: 'Aprovado', type: 'Feriado'
    });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .neq('type', 'Interno')
                .order('date', { ascending: true });

            if (error) throw error;
            setEvents(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir esta data?')) return;
        try {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (e: any) {
            alert(e.message || 'Erro ao excluir data');
        }
    };

    const handleEdit = (event: any) => {
        setEditingEvent(event);
        setFormData({
            title: event.title,
            date: event.date,
            location: event.location,
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
                time: '00:00',
                location: formData.location,
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
            alert(e.message || 'Erro ao salvar data');
        }
    };

    const downloadPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.setTextColor(79, 70, 229);
        doc.text('Relatório de Datas Comemorativas - ADMTN', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);

        const tableData = filteredEvents.map(e => [
            format(parseDateLocal(e.date), 'dd/MM/yyyy'),
            e.title,
            e.location,
            e.type
        ]);

        autoTable(doc, {
            startY: 40,
            head: [['Data', 'Título', 'Escopo/Local', 'Tipo']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] },
            styles: { fontSize: 10 }
        });

        doc.save(`datas_comemorativas_admtn_${format(new Date(), 'yyyyMMdd')}.pdf`);
    };

    const [filterType, setFilterType] = useState('');
    const [filterScope, setFilterScope] = useState('');

    const filteredEvents = events
        .filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase()) || e.location.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter(e => !filterType || e.type === filterType)
        .filter(e => !filterScope || e.location === filterScope)
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
                        <div className="p-3 bg-fuchsia-50 text-fuchsia-600 rounded-xl">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        Datas Comemorativas
                    </h2>
                    <p className="text-slate-500 mt-2 text-sm ml-14">Gerencie feriados nacionais e datas mundiais.</p>
                </div>

                <div className="flex w-full sm:w-auto items-center gap-3">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar título ou local..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 outline-none transition-all"
                        />
                    </div>

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-fuchsia-500/50 outline-none transition-all"
                    >
                        <option value="">Todos Tipos</option>
                        <option value="Feriado">Feriado</option>
                        <option value="Comemorativo">Comemorativo</option>
                    </select>

                    <select
                        value={filterScope}
                        onChange={(e) => setFilterScope(e.target.value)}
                        className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-fuchsia-500/50 outline-none transition-all"
                    >
                        <option value="">Todas Abrangências</option>
                        <option value="Nacional">Nacional</option>
                        <option value="Mundial">Mundial</option>
                        <option value="Municipal">Municipal</option>
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
                            setFormData({ title: '', date: '', location: 'Nacional', description: '', status: 'Aprovado', type: 'Feriado' });
                            setIsModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 bg-fuchsia-600 text-white px-5 py-2.5 rounded-xl hover:bg-fuchsia-700 hover:shadow-lg hover:shadow-fuchsia-500/20 active:scale-95 transition-all font-medium whitespace-nowrap"
                    >
                        <Plus className="h-5 w-5" /> <span className="hidden sm:inline">Nova Data</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                                <th className="p-5 font-outfit">Data</th>
                                <th className="p-5 font-outfit">Título</th>
                                <th className="p-5 font-outfit">Abrangência</th>
                                <th className="p-5 font-outfit">Tipo</th>
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
                                        className="hover:bg-fuchsia-50/30 transition-colors group"
                                    >
                                        <td className="p-5">
                                            <div className="font-semibold text-slate-800">{format(parseDateLocal(event.date), 'dd/MM/yyyy')}</div>
                                        </td>
                                        <td className="p-5">
                                            <div className="font-semibold text-slate-800">{event.title}</div>
                                            <div className="text-xs text-slate-500 mt-0.5 max-w-[300px] truncate">{event.description}</div>
                                        </td>
                                        <td className="p-5">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200/50">
                                                {event.location}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${event.type === 'Feriado' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-sky-50 text-sky-700 border-sky-200'}`}>
                                                {event.type}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex justify-end items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(event)} className="p-2 text-fuchsia-600 hover:bg-fuchsia-50 hover:shadow shadow-fuchsia-500/10 rounded-xl transition-all" title="Editar">
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
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 border border-slate-200"
                        >
                            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="text-xl font-bold text-slate-800 font-outfit">
                                    {editingEvent ? 'Editar Data' : 'Nova Data Especial'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Título da Data</label>
                                    <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:bg-white outline-none transition-all" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Data</label>
                                        <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Tipo</label>
                                        <select required value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 outline-none transition-all">
                                            <option value="Feriado">Feriado</option>
                                            <option value="Comemorativo">Comemorativo</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Abrangência (Ex: Nacional, Mundial, Municipal)</label>
                                    <input type="text" required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Breve Descrição/Significado</label>
                                    <textarea rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 outline-none transition-all" placeholder="O que se comemora nesta data?"></textarea>
                                </div>

                                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors">Cancelar</button>
                                    <button type="submit" className="px-6 py-2.5 bg-fuchsia-600 text-white rounded-xl hover:bg-fuchsia-700 font-bold transition-all shadow-lg active:scale-95">Salvar</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
