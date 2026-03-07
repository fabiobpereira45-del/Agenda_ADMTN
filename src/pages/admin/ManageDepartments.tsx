import React, { useState, useEffect } from 'react';
import { Tags, Plus, Trash2, X, Edit2, Search, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { supabase } from '../../supabaseClient';

export default function ManageDepartments() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      if (data) setDepartments(data);
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este departamento? Isso pode afetar líderes e eventos vinculados.')) return;
    try {
      // Check for related leaders or events first (Supabase won't allow if FK constraints exist, but we can be explicit)
      const { count: leadersCount } = await supabase
        .from('leaders')
        .select('*', { count: 'exact', head: true })
        .eq('department_id', id);

      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('department_id', id);

      if ((leadersCount || 0) > 0 || (eventsCount || 0) > 0) {
        alert('Não é possível excluir: existem líderes ou eventos vinculados a este departamento.');
        return;
      }

      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (e: any) {
      alert(e.message || 'Erro ao excluir departamento');
    }
  };

  const handleEdit = (dept: any) => {
    setEditingDept(dept);
    setName(dept.name);
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingDept) {
        const { error } = await supabase
          .from('departments')
          .update({ name })
          .eq('id', editingDept.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('departments')
          .insert([{ name }]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      setName('');
      setEditingDept(null);
      await fetchData();
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar departamento');
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229);
    doc.text('Relatório de Departamentos - ADMTN', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);

    const tableData = filteredDepartments.map(d => [
      d.name
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Nome do Departamento']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 10 }
    });

    doc.save(`departamentos-admtn-${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  const filteredDepartments = departments.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-sm border border-slate-200/60">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3 font-outfit">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Tags className="h-6 w-6" />
            </div>
            Departamentos
          </h2>
          <p className="text-slate-500 mt-2 text-sm ml-14">Crie e gerencie os grupos e departamentos da igreja.</p>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <button
            onClick={handleDownloadPDF}
            className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all shadow-sm"
            title="Baixar Relatório PDF"
          >
            <FileDown className="h-5 w-5" />
          </button>

          <button
            onClick={() => {
              setEditingDept(null);
              setName('');
              setError('');
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all font-medium whitespace-nowrap"
          >
            <Plus className="h-5 w-5" /> <span className="hidden sm:inline">Novo Departamento</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <th className="p-5 font-outfit">Nome do Departamento / Grupo</th>
                <th className="p-5 text-right font-outfit">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              <AnimatePresence>
                {filteredDepartments.map((dept, i) => (
                  <motion.tr
                    key={dept.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-indigo-50/30 transition-colors group"
                  >
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200/50">
                          <Tags className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-slate-800" translate="no">{dept.name}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex justify-end items-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                        <button onClick={() => handleEdit(dept)} className="p-2 text-indigo-600 hover:bg-indigo-50 hover:shadow shadow-indigo-500/10 rounded-xl transition-all" title="Editar">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(dept.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:shadow shadow-rose-500/10 rounded-xl transition-all" title="Excluir">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredDepartments.length === 0 && (
                <tr>
                  <td colSpan={2} className="p-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Tags className="h-12 w-12 text-slate-300 mb-4" />
                      <p className="text-lg font-medium text-slate-600">Nenhum departamento encontrado.</p>
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
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 border border-slate-200"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-800 font-outfit">{editingDept ? 'Editar Departamento' : 'Novo Departamento'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6">
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-medium">
                    {error}
                  </motion.div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Nome do Departamento/Grupo</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all" placeholder="Ex: Jovens, Crianças, Missões..." translate="no" />
                </div>
                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors">Cancelar</button>
                  <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 active:scale-95">Salvar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
