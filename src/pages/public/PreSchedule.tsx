import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, AlignLeft, Send, CheckCircle2, LayoutTemplate } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../supabaseClient';

export default function PreSchedule() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    department_id: '',
    description: '',
    type: 'Interno',
    name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      if (error) throw error;
      setDepartments(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;

    // Máscara de telefone (WA)
    if (name === 'phone') {
      value = value.replace(/\D/g, ''); // Remove não números
      if (value.length > 2 && value.length <= 6) {
        value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
      } else if (value.length > 6 && value.length <= 10) {
        value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
      } else if (value.length > 10) {
        value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  const [showCollisionModal, setShowCollisionModal] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent, bypassCollision = false) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Verificar colisão de data/hora (apenas se não estiver ignorando)
      if (!bypassCollision) {
        const { data: conflictingEvents, error: collisionError } = await supabase
          .from('events')
          .select('title, time, status')
          .eq('date', formData.date)
          .eq('time', formData.time)
          .neq('status', 'Rejeitado') // Ignorar eventos rejeitados
          .limit(1);

        if (collisionError) throw collisionError;

        if (conflictingEvents && conflictingEvents.length > 0) {
          const conflict = conflictingEvents[0];
          setShowCollisionModal(conflict);
          setLoading(false);
          return;
        }
      }

      // 2. Prosseguir com a inserção
      // Remover os campos name e phone do envio direto (pois a tabela usa applicant_name e applicant_phone)
      const { name, phone, ...eventData } = formData;

      const { error } = await supabase
        .from('events')
        .insert([{
          ...eventData,
          department_id: formData.department_id || null,
          status: 'Pendente',
          applicant_name: name,
          applicant_phone: phone
        }]);

      if (error) throw error;

      // 3. Notificar via WhatsApp (n8n Webhook)
      const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

      try {
        await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicant_name: name,
            applicant_phone: phone,
            title: formData.title,
            date: formData.date,
            time: formData.time
          })
        });
      } catch (webhookErr) {
        console.error('Erro ao disparar webhook de notificação:', webhookErr);
      }

      setSuccess(true);
      setShowCollisionModal(null);
      setFormData({
        title: '', date: '', time: '', location: '', department_id: '', description: '', type: 'Interno', name: '', phone: ''
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar pré-agenda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 font-inter">
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mt-10 p-10 bg-white rounded-[2rem] shadow-xl border border-green-100 flex flex-col items-center text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-green-400 rounded-full blur-[100px] opacity-20"></div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
              className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-8 relative z-10 shadow-inner"
            >
              <CheckCircle2 className="w-12 h-12" />
            </motion.div>

            <h2 className="text-4xl font-extrabold text-slate-800 mb-4 font-outfit relative z-10">Solicitação Enviada!</h2>
            <p className="text-slate-500 mb-10 text-lg max-w-md relative z-10 leading-relaxed font-light">
              Sua pré-agenda foi registrada com sucesso e encaminhada para a aprovação da nossa diretoria.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSuccess(false)}
              className="relative z-10 inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-full text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-lg hover:shadow-xl"
            >
              Fazer Nova Solicitação
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-tr from-indigo-700 to-purple-800 px-8 py-12 md:px-12 md:py-16 text-white text-center sm:text-left overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-purple-500 rounded-full blur-[80px] opacity-50"></div>

              <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-center sm:items-start justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-100 text-xs font-bold uppercase tracking-wider backdrop-blur-sm shadow-sm md:hidden">
                    <LayoutTemplate className="w-3.5 h-3.5" /> Pré-Agenda
                  </div>
                  <h2 className="text-3xl md:text-5xl font-extrabold font-outfit tracking-tight text-white mb-2">Solicitar Agenda</h2>
                  <p className="text-indigo-100 text-base md:text-lg max-w-lg font-light leading-relaxed">
                    Preencha o formulário abaixo com os detalhes do seu evento para análise da coordenação.
                  </p>
                </div>
                <div className="hidden md:flex shrink-0 w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl items-center justify-center shadow-inner border border-white/20">
                  <LayoutTemplate className="w-10 h-10 text-indigo-100" />
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-8 bg-slate-50 relative">
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-100 to-transparent pointer-events-none"></div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="relative z-10 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm flex items-center gap-3 text-red-700"
                >
                  <span className="font-bold">Atenção:</span> {error}
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8 relative z-10">
                <div className="space-y-2 col-span-1 md:col-span-2 group">
                  <label className="block text-sm font-bold text-slate-700 group-focus-within:text-indigo-600 transition-colors uppercase tracking-wider text-xs">Título do Evento</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 focus:ring-0 focus:border-indigo-500 transition-all bg-white shadow-sm hover:border-slate-300 outline-none text-slate-800 font-medium"
                    placeholder="Ex: Culto de Jovens, Ensaio Geral..."
                  />
                </div>

                <div className="space-y-2 group">
                  <label className="block text-sm font-bold text-slate-700 group-focus-within:text-indigo-600 transition-colors uppercase tracking-wider text-xs flex items-center gap-2">Seu Nome (Solicitante)</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 focus:ring-0 focus:border-indigo-500 transition-all bg-white shadow-sm hover:border-slate-300 outline-none text-slate-800 font-medium"
                    placeholder="Como podemos lhe chamar?"
                  />
                </div>

                <div className="space-y-2 group">
                  <label className="block text-sm font-bold text-slate-700 group-focus-within:text-indigo-600 transition-colors uppercase tracking-wider text-xs flex items-center gap-2">WhatsApp p/ Contato</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 focus:ring-0 focus:border-indigo-500 transition-all bg-white shadow-sm hover:border-slate-300 outline-none text-slate-800 font-medium"
                    placeholder="(99) 99999-9999"
                    maxLength={15}
                  />
                </div>

                <div className="space-y-2 group">
                  <label className="block text-sm font-bold text-slate-700 group-focus-within:text-indigo-600 transition-colors uppercase tracking-wider text-xs flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" /> Data do Evento
                  </label>
                  <input
                    type="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 focus:ring-0 focus:border-indigo-500 transition-all bg-white shadow-sm hover:border-slate-300 outline-none text-slate-800 font-medium"
                  />
                </div>

                <div className="space-y-2 group">
                  <label className="block text-sm font-bold text-slate-700 group-focus-within:text-indigo-600 transition-colors uppercase tracking-wider text-xs flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" /> Horário
                  </label>
                  <input
                    type="time"
                    name="time"
                    required
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 focus:ring-0 focus:border-indigo-500 transition-all bg-white shadow-sm hover:border-slate-300 outline-none text-slate-800 font-medium"
                  />
                </div>

                <div className="space-y-2 group">
                  <label className="block text-sm font-bold text-slate-700 group-focus-within:text-indigo-600 transition-colors uppercase tracking-wider text-xs flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" /> Localização
                  </label>
                  <input
                    type="text"
                    name="location"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 focus:ring-0 focus:border-indigo-500 transition-all bg-white shadow-sm hover:border-slate-300 outline-none text-slate-800 font-medium"
                    placeholder="Ex: Templo Central, Congregação..."
                  />
                </div>

                <div className="space-y-2 group">
                  <label className="block text-sm font-bold text-slate-700 group-focus-within:text-indigo-600 transition-colors uppercase tracking-wider text-xs">Departamento Responsável</label>
                  <div className="relative">
                    <select
                      name="department_id"
                      required
                      value={formData.department_id}
                      onChange={handleChange}
                      className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 focus:ring-0 focus:border-indigo-500 transition-all bg-white shadow-sm hover:border-slate-300 outline-none text-slate-800 font-medium appearance-none"
                    >
                      <option value="" disabled>Selecione um departamento...</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 col-span-1 md:col-span-2 group">
                  <label className="block text-sm font-bold text-slate-700 group-focus-within:text-indigo-600 transition-colors uppercase tracking-wider text-xs flex items-center gap-2">
                    <AlignLeft className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" /> Descrição / Observações
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 focus:ring-0 focus:border-indigo-500 transition-all bg-white shadow-sm hover:border-slate-300 outline-none text-slate-800 font-medium resize-none"
                    placeholder="Forneça detalhes adicionais que possam ajudar na aprovação do evento..."
                  ></textarea>
                </div>
              </div>

              <div className="pt-8 flex justify-end relative z-10 border-t border-slate-200/60 w-full mt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto inline-flex items-center justify-center px-10 py-4 font-bold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-colors shadow-lg shadow-indigo-200 hover:shadow-indigo-300 disabled:opacity-70 disabled:cursor-not-allowed gap-3 text-lg"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></span>
                      Processando...
                    </span>
                  ) : (
                    <>
                      Solicitar <Send className="w-5 h-5 -mt-0.5" />
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Colisão de Datas */}
      <AnimatePresence>
        {showCollisionModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCollisionModal(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-8 md:p-10 max-w-lg w-full text-center overflow-hidden"
            >
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl"></div>

              <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-amber-200">
                <Calendar className="w-10 h-10" />
              </div>

              <h3 className="text-2xl font-extrabold text-slate-800 font-outfit mb-3">Conflito de Agenda!</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Já existe uma programação registrada para esta data e horário:
              </p>

              <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="font-bold text-slate-800">{showCollisionModal.title}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Horário: {showCollisionModal.time}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 mb-8 italic">
                Se decidir prosseguir, sua solicitação será analisada pela administração juntamente com o **Pastor Presidente**.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleSubmit(null as any, true)}
                  className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all shadow-lg text-sm"
                >
                  Desejo Prosseguir
                </button>
                <button
                  onClick={() => setShowCollisionModal(null)}
                  className="flex-1 py-4 bg-white hover:bg-slate-50 text-slate-600 rounded-2xl font-bold transition-all border border-slate-200 text-sm"
                >
                  Mudar Data/Hora
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
