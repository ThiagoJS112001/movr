import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudents, useBlockStudent } from '../../hooks/useStudents';
import { useAssessments } from '../../hooks/useAssessments';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import {
  ArrowLeft, Camera, Trash2, Plus, Save, User,
  MapPin, Phone, FileText, Calendar, AlertCircle,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface EmergencyContact {
  name: string;
  phone: string;
}

interface StudentFormData {
  name: string;
  phone: string;
  birthDate: string;
  gender: string;
  cpf: string;
  rg: string;
  profession: string;
  cep: string;
  address: string;
  addressNumber: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  howMet: string;
  status: 'ativo' | 'bloqueado';
  internalNotes: string;
  emergencyContacts: EmergencyContact[];
  avatarUrl: string;
}

const BLANK_FORM: StudentFormData = {
  name: '', phone: '', birthDate: '', gender: '',
  cpf: '', rg: '', profession: '',
  cep: '', address: '', addressNumber: '', complement: '',
  neighborhood: '', city: '', state: '',
  howMet: '', status: 'ativo', internalNotes: '',
  emergencyContacts: [], avatarUrl: '',
};

const INPUT_CLS =
  'w-full bg-white dark:bg-[#0D1025] border border-slate-200 dark:border-white/[0.07] rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors';
const SELECT_CLS =
  'w-full bg-white dark:bg-[#0D1025] border border-slate-200 dark:border-white/[0.07] rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors';
const LABEL_CLS = 'block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5';

const HOW_MET_OPTIONS = [
  'Indicação', 'Instagram', 'Google', 'Academia', 'WhatsApp', 'Evento', 'Outros',
];

const TABS = [
  { key: 'dados', label: 'Dados pessoais' },
  { key: 'objetivos', label: 'Objetivos e avaliação' },
  { key: 'planos', label: 'Planos' },
  { key: 'observacoes', label: 'Observações' },
] as const;
type TabKey = typeof TABS[number]['key'];

// ── Helper: avatar initials ───────────────────────────────────────────────────
function initials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
}

// ── Main component ────────────────────────────────────────────────────────────
export default function EditAlunoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { data: assessments = [] } = useAssessments(id ?? '');
  const blockMutation = useBlockStudent();

  const [activeTab, setActiveTab] = useState<TabKey>('dados');
  const [form, setForm] = useState<StudentFormData>(BLANK_FORM);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const student = students.find((s) => s.id === id);

  // Load profile data from supabase
  useEffect(() => {
    if (!id) return;
    supabase
      .from('profiles')
      .select('name, phone, birth_date, bio, address, city, state, avatar_url, is_blocked')
      .eq('id', id)
      .single()
      .then(({ data: d }) => {
        if (!d) return;
        const row = d as Record<string, unknown>;
        // Try to parse emergency contacts from bio field prefix (if encoded)
        setForm({
          name: (row.name as string) ?? '',
          phone: (row.phone as string) ?? '',
          birthDate: (row.birth_date as string) ?? '',
          gender: '',
          cpf: '',
          rg: '',
          profession: '',
          cep: '',
          address: (row.address as string) ?? '',
          addressNumber: '',
          complement: '',
          neighborhood: '',
          city: (row.city as string) ?? '',
          state: (row.state as string) ?? '',
          howMet: '',
          status: (row.is_blocked as boolean) ? 'bloqueado' : 'ativo',
          internalNotes: (row.bio as string) ?? '',
          emergencyContacts: [],
          avatarUrl: (row.avatar_url as string) ?? '',
        });
        setAvatarPreview((row.avatar_url as string) ?? '');
      });
  }, [id]);

  function setField<K extends keyof StudentFormData>(key: K, value: StudentFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function addEmergencyContact() {
    setField('emergencyContacts', [...form.emergencyContacts, { name: '', phone: '' }]);
  }

  function removeEmergencyContact(i: number) {
    setField('emergencyContacts', form.emergencyContacts.filter((_, idx) => idx !== i));
  }

  function updateEmergencyContact(i: number, field: keyof EmergencyContact, value: string) {
    const updated = form.emergencyContacts.map((c, idx) =>
      idx === i ? { ...c, [field]: value } : c,
    );
    setField('emergencyContacts', updated);
  }

  const handleSave = useCallback(async () => {
    if (!id || !user) return;
    if (!form.name.trim()) {
      toast.error('Nome é obrigatório.');
      return;
    }
    setSaving(true);
    try {
      let avatarUrl = form.avatarUrl;
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = `avatars/${id}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
          avatarUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          birth_date: form.birthDate || null,
          bio: form.internalNotes.trim() || null,
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          is_blocked: form.status === 'bloqueado',
          avatar_url: avatarUrl,
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Aluno atualizado com sucesso!');
      navigate(`/personal/alunos/${id}`);
    } catch {
      toast.error('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }, [id, user, form, avatarFile, navigate]);

  async function handleDelete() {
    if (!id || !student) return;
    // Block the student instead of deleting (soft delete)
    blockMutation.mutate({ studentId: id, blocked: true });
    toast.success('Aluno bloqueado.');
    navigate('/personal/alunos');
  }

  // Latest assessment for quick summary
  const latestAssessment = assessments.length > 0
    ? [...assessments].sort((a, b) => b.date.localeCompare(a.date))[0]
    : null;

  if (studentsLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-slate-700/50 rounded-xl" />
        <div className="h-64 bg-slate-700/30 rounded-2xl" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6 text-center text-slate-400 py-20">
        <p>Aluno não encontrado.</p>
        <button onClick={() => navigate('/personal/alunos')} className="mt-3 text-sm text-indigo-400 hover:underline">
          Voltar para Alunos
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#080B18]">
      {/* ── Header ── */}
      <div className="bg-white dark:bg-[#0D1025] border-b border-slate-200 dark:border-white/[0.07] px-6 py-4">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate(`/personal/alunos/${id}`)}
              className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition-colors mb-1"
            >
              <ArrowLeft size={14} /> Voltar para alunos
            </button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Editar aluno</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Atualize as informações do aluno.</p>
          </div>
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl border border-red-200 dark:border-red-500/30 transition-colors"
          >
            <Trash2 size={14} /> Excluir aluno
          </button>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">

          {/* ── Left: Form ── */}
          <div>
            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-200 dark:border-white/[0.07] mb-6">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                    activeTab === key
                      ? 'border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* ── Tab: Dados pessoais ── */}
            {activeTab === 'dados' && (
              <div className="space-y-5">
                {/* Informações pessoais */}
                <div className="bg-white dark:bg-[#0D1025] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-5">
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <User size={14} className="text-violet-400" /> Informações pessoais
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={LABEL_CLS}>Nome completo <span className="text-red-400">*</span></label>
                        <input value={form.name} onChange={(e) => setField('name', e.target.value)} className={INPUT_CLS} placeholder="João da Silva Santos" />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>E-mail</label>
                        <input value={student.email} disabled className={`${INPUT_CLS} opacity-60 cursor-not-allowed`} />
                      </div>
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Data de nascimento</label>
                      <input type="date" value={form.birthDate} onChange={(e) => setField('birthDate', e.target.value)} className={INPUT_CLS} />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Gênero</label>
                      <select value={form.gender} onChange={(e) => setField('gender', e.target.value)} className={SELECT_CLS}>
                        <option value="">Selecionar</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                        <option value="Outro">Outro</option>
                        <option value="Prefiro não informar">Prefiro não informar</option>
                      </select>
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Telefone</label>
                      <input value={form.phone} onChange={(e) => setField('phone', e.target.value)} className={INPUT_CLS} placeholder="(11) 98765-4321" />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>CPF</label>
                      <input value={form.cpf} onChange={(e) => setField('cpf', e.target.value)} className={INPUT_CLS} placeholder="123.456.789-00" />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>RG <span className="text-slate-400 font-normal">(opcional)</span></label>
                      <input value={form.rg} onChange={(e) => setField('rg', e.target.value)} className={INPUT_CLS} placeholder="12.345.678-9" />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Profissão <span className="text-slate-400 font-normal">(opcional)</span></label>
                      <input value={form.profession} onChange={(e) => setField('profession', e.target.value)} className={INPUT_CLS} placeholder="Engenheiro" />
                    </div>
                  </div>
                </div>

                {/* Endereço */}
                <div className="bg-white dark:bg-[#0D1025] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-5">
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <MapPin size={14} className="text-violet-400" /> Endereço
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <label className={LABEL_CLS}>CEP</label>
                      <input value={form.cep} onChange={(e) => setField('cep', e.target.value)} className={INPUT_CLS} placeholder="04567-000" />
                    </div>
                    <div className="col-span-2">
                      <label className={LABEL_CLS}>Rua</label>
                      <input value={form.address} onChange={(e) => setField('address', e.target.value)} className={INPUT_CLS} placeholder="Rua das Acácias" />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Número</label>
                      <input value={form.addressNumber} onChange={(e) => setField('addressNumber', e.target.value)} className={INPUT_CLS} placeholder="123" />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Complemento <span className="text-slate-400 font-normal">(opcional)</span></label>
                      <input value={form.complement} onChange={(e) => setField('complement', e.target.value)} className={INPUT_CLS} placeholder="Apto 45" />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Bairro</label>
                      <input value={form.neighborhood} onChange={(e) => setField('neighborhood', e.target.value)} className={INPUT_CLS} placeholder="Vila Nova Conceição" />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Cidade</label>
                      <input value={form.city} onChange={(e) => setField('city', e.target.value)} className={INPUT_CLS} placeholder="São Paulo" />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Estado</label>
                      <select value={form.state} onChange={(e) => setField('state', e.target.value)} className={SELECT_CLS}>
                        <option value="">UF</option>
                        {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                          <option key={uf} value={uf}>{uf}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Informações adicionais */}
                <div className="bg-white dark:bg-[#0D1025] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-5">
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <FileText size={14} className="text-violet-400" /> Informações adicionais
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className={LABEL_CLS}>Data de cadastro</label>
                      <input disabled value={new Date(student.id.substring(0, 8)).toLocaleDateString('pt-BR')} className={`${INPUT_CLS} opacity-60 cursor-not-allowed`} />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Como conheceu?</label>
                      <select value={form.howMet} onChange={(e) => setField('howMet', e.target.value)} className={SELECT_CLS}>
                        <option value="">Selecionar</option>
                        {HOW_MET_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Status</label>
                      <select value={form.status} onChange={(e) => setField('status', e.target.value as 'ativo' | 'bloqueado')} className={SELECT_CLS}>
                        <option value="ativo">Ativo</option>
                        <option value="bloqueado">Bloqueado</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab: Objetivos e avaliação ── */}
            {activeTab === 'objetivos' && (
              <div className="bg-white dark:bg-[#0D1025] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <Calendar size={14} className="text-violet-400" /> Objetivos e avaliação
                </h2>
                {latestAssessment ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    {latestAssessment.weight != null && (
                      <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-3">
                        <p className="text-xs text-slate-400 mb-0.5">Peso</p>
                        <p className="font-semibold text-slate-800 dark:text-white">{latestAssessment.weight} kg</p>
                      </div>
                    )}
                    {latestAssessment.bodyFat != null && (
                      <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-3">
                        <p className="text-xs text-slate-400 mb-0.5">% Gordura</p>
                        <p className="font-semibold text-slate-800 dark:text-white">{latestAssessment.bodyFat}%</p>
                      </div>
                    )}
                    {latestAssessment.muscleMass != null && (
                      <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-3">
                        <p className="text-xs text-slate-400 mb-0.5">Massa magra</p>
                        <p className="font-semibold text-slate-800 dark:text-white">{latestAssessment.muscleMass} kg</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Calendar size={32} className="mb-3 opacity-30" />
                    <p className="text-sm">Nenhuma avaliação registrada.</p>
                    <button
                      onClick={() => navigate(`/personal/alunos/${id}`)}
                      className="mt-2 text-xs text-violet-400 hover:underline"
                    >
                      Registrar na página do aluno
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Planos ── */}
            {activeTab === 'planos' && (
              <div className="bg-white dark:bg-[#0D1025] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Planos</h2>
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <FileText size={32} className="mb-3 opacity-30" />
                  <p className="text-sm">Gerencie treinos e dietas na página do aluno.</p>
                  <button
                    onClick={() => navigate(`/personal/alunos/${id}`)}
                    className="mt-2 text-xs text-violet-400 hover:underline"
                  >
                    Ir para página do aluno
                  </button>
                </div>
              </div>
            )}

            {/* ── Tab: Observações ── */}
            {activeTab === 'observacoes' && (
              <div className="space-y-5">
                {/* Internal notes */}
                <div className="bg-white dark:bg-[#0D1025] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-5">
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Observações internas <span className="text-xs font-normal text-slate-400">(visível apenas para você)</span>
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Anotações privadas sobre o aluno.</p>
                  <textarea
                    value={form.internalNotes}
                    onChange={(e) => setField('internalNotes', e.target.value)}
                    rows={5}
                    placeholder="Aluno muito dedicado e disciplinado. Responde bem a treinos de força."
                    className={`${INPUT_CLS} resize-none`}
                  />
                </div>

                {/* Emergency contacts */}
                <div className="bg-white dark:bg-[#0D1025] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <Phone size={14} className="text-violet-400" /> Contatos de emergência
                      </h2>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {form.emergencyContacts.map((contact, i) => (
                      <div key={i} className="flex gap-3 items-center">
                        <input
                          value={contact.name}
                          onChange={(e) => updateEmergencyContact(i, 'name', e.target.value)}
                          placeholder="Nome"
                          className={`${INPUT_CLS} flex-1`}
                        />
                        <input
                          value={contact.phone}
                          onChange={(e) => updateEmergencyContact(i, 'phone', e.target.value)}
                          placeholder="Telefone"
                          className={`${INPUT_CLS} flex-1`}
                        />
                        <button
                          onClick={() => removeEmergencyContact(i)}
                          className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addEmergencyContact}
                      className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      <Plus size={14} /> Adicionar contato
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Save / Cancel buttons */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-white/[0.07]">
              <button
                onClick={() => navigate(`/personal/alunos/${id}`)}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white border border-slate-200 dark:border-white/[0.07] rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <Save size={14} />
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>

          {/* ── Right: Photo + Quick summary ── */}
          <div className="flex flex-col gap-4">
            {/* Photo */}
            <div className="bg-white dark:bg-[#0D1025] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-5">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
                Foto do aluno
              </h3>
              <div className="flex flex-col items-center">
                <div className="relative mb-3">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-violet-600/20 border-2 border-white/10 flex items-center justify-center">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt={form.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-violet-400">{initials(form.name || student.name)}</span>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-violet-600 hover:bg-violet-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-colors">
                    <Camera size={14} className="text-white" />
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
                  </label>
                </div>
                <p className="text-xs text-slate-400 text-center">Formatos aceitos: JPG, PNG. Máx. 5MB.</p>
              </div>
            </div>

            {/* Quick summary */}
            {latestAssessment && (
              <div className="bg-white dark:bg-[#0D1025] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-5">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
                  Resumo rápido
                </h3>
                <div className="space-y-2.5">
                  {[
                    { label: 'Peso atual', value: latestAssessment.weight ? `${latestAssessment.weight} kg` : null, icon: '⚖️' },
                    { label: '% Gordura', value: latestAssessment.bodyFat ? `${latestAssessment.bodyFat}%` : null, icon: '🔥' },
                    { label: 'Massa magra', value: latestAssessment.muscleMass ? `${latestAssessment.muscleMass} kg` : null, icon: '💪' },
                    { label: 'Última avaliação', value: new Date(latestAssessment.date).toLocaleDateString('pt-BR'), icon: '📅' },
                  ].filter(r => r.value).map(({ label, value, icon }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <span>{icon}</span>{label}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0D1025] border border-slate-200 dark:border-white/[0.07] rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <AlertCircle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Excluir aluno?</h3>
                <p className="text-xs text-slate-500">O acesso do aluno será bloqueado.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
              Esta ação irá bloquear o acesso de <strong>{student.name}</strong> ao sistema.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium border border-slate-200 dark:border-white/[0.07] text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
