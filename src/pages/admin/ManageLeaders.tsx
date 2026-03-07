import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, X, FileDown, Search, Phone, Check } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../supabaseClient';

export default function ManageLeaders() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLeader, setEditingLeader] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '', department_id: '', phone: '', role: 'Líder', status: 'Ativo'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [{ data: leadersData, error: leadersError }, { data: deptsData, error: deptsError }] = await Promise.all([
        supabase
          .from('leaders')
          .select('*, departments(name)')
          .order('name'),
        supabase
          .from('departments')
          .select('*')
          .order('name')
      ]);

      if (leadersError) throw leadersError;
      if (deptsError) throw deptsError;

      // Map to maintain compatibility with l.department_name
      const mappedLeaders = (leadersData || []).map((l: any) => ({
        ...l,
        department_name: l.departments?.name
      }));

      setLeaders(mappedLeaders);
      setDepartments(deptsData || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      if (error) throw error;
      setDepartments(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (leader: any) => {
    fetchDepartments();
    setEditingLeader(leader);
    setFormData({
      name: leader.name,
      department_id: leader.department_id || '',
      phone: leader.phone || '',
      role: leader.role || 'Líder',
      status: leader.status || 'Ativo'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este líder?')) return;
    try {
      const { error } = await supabase
        .from('leaders')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (e: any) {
      alert(e.message || 'Erro ao excluir líder');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = {
        name: formData.name,
        department_id: formData.department_id || null,
        phone: formData.phone,
        role: formData.role,
        status: formData.status
      };

      if (editingLeader) {
        const { error } = await supabase
          .from('leaders')
          .update(dataToSave)
          .eq('id', editingLeader.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('leaders')
          .insert([dataToSave]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      setEditingLeader(null);
      fetchData();
    } catch (e: any) {
      alert(e.message || 'Erro ao salvar líder');
    }
  };

  const handleToggleStatus = async (leader: any) => {
    try {
      const newStatus = leader.status === 'Ativo' ? 'Inativo' : 'Ativo';
      const { error } = await supabase
        .from('leaders')
        .update({ status: newStatus })
        .eq('id', leader.id);
      if (error) throw error;
      fetchData();
    } catch (e: any) {
      alert(e.message || 'Erro ao alterar status');
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229);
    doc.text('Relatório Diretório de Líderes', 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`ADMTN — Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 22);

    const tableData = filteredLeaders.map(l => [
      l.name,
      l.role || 'Líder',
      l.department_name || '-',
      l.phone || '-',
      l.status || 'Ativo'
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['Nome', 'Função', 'Departamento', 'Telefone', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 9, cellPadding: 3 }
    });

    doc.save(`lideres-admtn-${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  const filteredLeaders = leaders.filter(l =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.department_name && l.department_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
              <Users className="h-6 w-6" />
            </div>
            Gerenciar Líderes
          </h2>
          <p className="text-slate-500 mt-2 text-sm ml-14">Diretório completo de toda a liderança da igreja.</p>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:w-56 order-3 sm:order-1 w-full mt-2 sm:mt-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar líderes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <button
            onClick={handleDownloadPDF}
            className="flex-1 sm:flex-none order-1 sm:order-2 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors font-medium shadow-sm active:scale-95"
          >
            <FileDown className="h-4 w-4" /> <span className="hidden sm:inline">Exportar</span> PDF
          </button>
          <button
            onClick={() => {
              fetchDepartments(); // Atualiza lista de departamentos
              setEditingLeader(null);
              setFormData({ name: '', department_id: '', phone: '', role: 'Líder', status: 'Ativo' });
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-none order-2 sm:order-3 flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all font-medium whitespace-nowrap"
          >
            <Plus className="h-5 w-5" /> Novo Líder
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <th className="p-5 font-outfit">Líder</th>
                <th className="p-5 font-outfit hidden sm:table-cell">Departamento</th>
                <th className="p-5 font-outfit hidden md:table-cell">Telefone</th>
                <th className="p-5 font-outfit">Status</th>
                <th className="p-5 text-right font-outfit">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              <AnimatePresence>
                {filteredLeaders.map((leader, i) => (
                  <motion.tr
                    key={leader.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-indigo-50/30 transition-colors group"
                  >
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-bold font-outfit border border-indigo-200/50">
                          {leader.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{leader.name}</div>
                          <div className="text-sm text-slate-500">{leader.role || 'Líder'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 hidden sm:table-cell">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200/50" translate="no">
                        {leader.department_name || 'Geral'}
                      </span>
                    </td>
                    <td className="p-5 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                        {leader.phone ? (
                          <>
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            {leader.phone}
                          </>
                        ) : '-'}
                      </div>
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm ${leader.status === 'Ativo' ? 'bg-emerald-100/80 text-emerald-800 border-emerald-200' : 'bg-slate-100/80 text-slate-800 border-slate-200'}`}>
                        {leader.status || 'Ativo'}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex justify-end items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleToggleStatus(leader)}
                          className={`p-2 rounded-xl transition-all ${leader.status === 'Ativo' ? 'text-rose-600 hover:bg-rose-50 hover:shadow shadow-rose-500/10' : 'text-emerald-600 hover:bg-emerald-50 hover:shadow shadow-emerald-500/10'}`}
                          title={leader.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                        >
                          {leader.status === 'Ativo' ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </button>
                        <button onClick={() => handleEdit(leader)} className="p-2 text-indigo-600 hover:bg-indigo-50 hover:shadow shadow-indigo-500/10 rounded-xl transition-all" title="Editar">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(leader.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:shadow shadow-rose-500/10 rounded-xl transition-all" title="Excluir">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredLeaders.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="h-12 w-12 text-slate-300 mb-4" />
                      <p className="text-lg font-medium text-slate-600">Nenhum líder encontrado.</p>
                      <p className="text-sm mt-1">Experimente buscar por outro nome ou adicionar um novo líder.</p>
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
                <h3 className="text-xl font-bold text-slate-800 font-outfit">{editingLeader ? 'Editar Líder' : 'Novo Líder'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Nome Completo</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all" placeholder="Ex: João da Silva" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Departamento Associado</label>
                  <select required value={formData.department_id} onChange={e => setFormData({ ...formData, department_id: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all" translate="no">
                    <option value="">Geral da Igreja</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Função</label>
                  <input type="text" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all" placeholder="Ex: Líder, Co-Líder, Secretário" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Telefone / WhatsApp</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all" placeholder="(00) 00000-0000" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Status</label>
                  <select required value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all">
                    <option value="Ativo">Líder Ativo</option>
                    <option value="Inativo">Líder Inativo</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors">Cancelar</button>
                  <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 active:scale-95">
                    {editingLeader ? 'Salvar Alterações' : 'Cadastrar Líder'}
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
