import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  ArrowLeft, Download, Upload, FileSpreadsheet, CheckCircle2,
  AlertCircle, X, Trash2, Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { useBulkCreateExercises } from '../../hooks/useExercises';
import type { Exercise } from '../../types';

// ---------------------------------------------------------------------------
// Constants matching ExerciciosPage
// ---------------------------------------------------------------------------
const MUSCLE_GROUPS = [
  'Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps',
  'Abdômen', 'Panturrilha', 'Glúteos', 'Cardio',
];
const EQUIPMENT_OPTIONS = ['Barra', 'Máquina', 'Polia', 'Halteres', 'Corporal', 'Cabo', 'Elástico', 'Kettlebell'];
const LEVEL_OPTIONS     = ['iniciante', 'intermediario', 'avancado'];
const TYPE_OPTIONS      = ['Força', 'Hipertrofia', 'Resistência', 'Mobilidade'];

// ---------------------------------------------------------------------------
// Template columns definition
// ---------------------------------------------------------------------------
interface TemplateColumn {
  key: keyof Omit<Exercise, 'id' | 'tips' | 'primaryMuscles' | 'secondaryMuscles'>;
  header: string;
  required: boolean;
  example: string;
  note: string;
}

const COLUMNS: TemplateColumn[] = [
  { key: 'name',         header: 'Nome*',              required: true,  example: 'Supino Reto',         note: 'Nome do exercício (obrigatório)' },
  { key: 'muscleGroup',  header: 'Grupo Muscular*',    required: true,  example: 'Peito',               note: MUSCLE_GROUPS.join(' | ') },
  { key: 'description',  header: 'Descrição',          required: false, example: 'Exercício de empurrar com barra', note: 'Descrição opcional' },
  { key: 'equipment',    header: 'Equipamento',        required: false, example: 'Barra',               note: EQUIPMENT_OPTIONS.join(' | ') },
  { key: 'level',        header: 'Nível',              required: false, example: 'iniciante',           note: LEVEL_OPTIONS.join(' | ') },
  { key: 'exerciseType', header: 'Tipo',               required: false, example: 'Força',               note: TYPE_OPTIONS.join(' | ') },
  { key: 'videoUrl',     header: 'URL da Mídia',       required: false, example: 'https://youtube.com/watch?v=...', note: 'Link de vídeo ou imagem' },
  { key: 'suggestedSets',header: 'Séries Sugeridas',   required: false, example: '3',                  note: 'Número inteiro' },
  { key: 'suggestedReps',header: 'Repetições Sugeridas', required: false, example: '8-12',             note: 'Ex: 8-12 ou 10' },
  { key: 'suggestedRest',header: 'Descanso (s)',       required: false, example: '60',                 note: 'Em segundos (número inteiro)' },
];

// ---------------------------------------------------------------------------
// Download template
// ---------------------------------------------------------------------------
function downloadTemplate() {
  const wb = XLSX.utils.book_new();

  // Sheet 1: template
  const headers = COLUMNS.map((c) => c.header);
  const example = COLUMNS.map((c) => c.example);
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);

  // Column widths
  ws['!cols'] = COLUMNS.map((c) => ({ wch: Math.max(c.header.length + 4, 24) }));

  XLSX.utils.book_append_sheet(wb, ws, 'Exercícios');

  // Sheet 2: reference values
  const refData: string[][] = [
    ['Campo', 'Valores aceitos'],
    ['Grupo Muscular*', MUSCLE_GROUPS.join(', ')],
    ['Equipamento', EQUIPMENT_OPTIONS.join(', ')],
    ['Nível', LEVEL_OPTIONS.join(', ')],
    ['Tipo', TYPE_OPTIONS.join(', ')],
  ];
  const wsRef = XLSX.utils.aoa_to_sheet(refData);
  wsRef['!cols'] = [{ wch: 22 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsRef, 'Referência');

  XLSX.writeFile(wb, 'modelo_importacao_exercicios.xlsx');
}

// ---------------------------------------------------------------------------
// Row parsing
// ---------------------------------------------------------------------------
interface ParsedRow {
  row: number;
  data: Omit<Exercise, 'id'>;
  errors: string[];
}

function parseSheet(wb: XLSX.WorkBook): { valid: ParsedRow[]; invalid: ParsedRow[] } {
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

  const valid: ParsedRow[] = [];
  const invalid: ParsedRow[] = [];

  rows.forEach((raw, idx) => {
    // Skip the example row (first data row) if it matches example name
    const rowNum = idx + 2; // 1-indexed, offset by header row

    const name        = String(raw['Nome*']             ?? raw['Nome']          ?? '').trim();
    const muscleGroup = String(raw['Grupo Muscular*']   ?? raw['Grupo Muscular']?? '').trim();
    const description = String(raw['Descrição']         ?? '').trim() || undefined;
    const equipment   = String(raw['Equipamento']       ?? '').trim() || undefined;
    const level       = String(raw['Nível']             ?? '').trim().toLowerCase() || undefined;
    const exerciseType= String(raw['Tipo']              ?? '').trim() || undefined;
    const videoUrl    = String(raw['URL da Mídia']      ?? '').trim() || undefined;
    const setsRaw     = raw['Séries Sugeridas'];
    const repsRaw     = raw['Repetições Sugeridas'];
    const restRaw     = raw['Descanso (s)'];

    const suggestedSets = setsRaw !== '' && setsRaw !== undefined ? Number(setsRaw) : undefined;
    const suggestedReps = repsRaw !== '' && repsRaw !== undefined ? String(repsRaw).trim() : undefined;
    const suggestedRest = restRaw !== '' && restRaw !== undefined ? Number(restRaw) : undefined;

    const errors: string[] = [];

    if (!name) errors.push('Nome é obrigatório');
    if (!muscleGroup) {
      errors.push('Grupo Muscular é obrigatório');
    } else if (!MUSCLE_GROUPS.includes(muscleGroup)) {
      errors.push(`Grupo Muscular inválido: "${muscleGroup}". Use: ${MUSCLE_GROUPS.join(', ')}`);
    }
    if (equipment && !EQUIPMENT_OPTIONS.includes(equipment)) {
      errors.push(`Equipamento inválido: "${equipment}". Use: ${EQUIPMENT_OPTIONS.join(', ')}`);
    }
    if (level && !LEVEL_OPTIONS.includes(level)) {
      errors.push(`Nível inválido: "${level}". Use: ${LEVEL_OPTIONS.join(', ')}`);
    }
    if (exerciseType && !TYPE_OPTIONS.includes(exerciseType)) {
      errors.push(`Tipo inválido: "${exerciseType}". Use: ${TYPE_OPTIONS.join(', ')}`);
    }
    if (suggestedSets !== undefined && isNaN(suggestedSets)) {
      errors.push('Séries Sugeridas deve ser um número');
    }
    if (suggestedRest !== undefined && isNaN(suggestedRest)) {
      errors.push('Descanso deve ser um número');
    }

    const parsed: ParsedRow = {
      row: rowNum,
      data: {
        name,
        muscleGroup,
        description,
        equipment,
        level,
        exerciseType,
        videoUrl,
        suggestedSets: suggestedSets !== undefined && !isNaN(suggestedSets) ? suggestedSets : undefined,
        suggestedReps,
        suggestedRest: suggestedRest !== undefined && !isNaN(suggestedRest) ? suggestedRest : undefined,
      },
      errors,
    };

    if (errors.length === 0) valid.push(parsed);
    else invalid.push(parsed);
  });

  return { valid, invalid };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface Props {
  onBack: () => void;
}

export default function ImportarExerciciosPage({ onBack }: Props) {
  const bulkMutation = useBulkCreateExercises();

  const [dragOver,   setDragOver]   = useState(false);
  const [fileName,   setFileName]   = useState<string | null>(null);
  const [validRows,   setValidRows]   = useState<ParsedRow[]>([]);
  const [invalidRows, setInvalidRows] = useState<ParsedRow[]>([]);
  const [showErrors,  setShowErrors]  = useState(false);
  const [parsing,     setParsing]     = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('Arquivo inválido. Envie um arquivo .xlsx ou .xls');
      return;
    }
    setParsing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      // Defer heavy CPU work so the loading state renders first
      setTimeout(() => {
        try {
          const data = new Uint8Array(e.target!.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const { valid, invalid } = parseSheet(wb);
          setFileName(file.name);
          setValidRows(valid);
          setInvalidRows(invalid);
          setShowErrors(invalid.length > 0);
          if (valid.length === 0 && invalid.length === 0) {
            toast.error('Nenhuma linha encontrada na planilha.');
          }
        } catch {
          toast.error('Erro ao ler o arquivo. Verifique se é um Excel válido.');
        } finally {
          setParsing(false);
        }
      }, 0);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  function clearFile() {
    setFileName(null);
    setValidRows([]);
    setInvalidRows([]);
    setShowErrors(false);
  }

  function handleImport() {
    if (validRows.length === 0) return;
    bulkMutation.mutate(
      validRows.map((r) => r.data),
      {
        onSuccess: (inserted) => {
          toast.success(`${inserted.length} exercício(s) importado(s) com sucesso!`);
          onBack();
        },
        onError: () => toast.error('Erro ao importar exercícios. Tente novamente.'),
      },
    );
  }

  const hasFile = fileName !== null;

  return (
    <div className="p-5 max-w-screen-xl mx-auto flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-white">Importar Exercícios</h1>
          <p className="text-sm text-slate-400">Adicione vários exercícios de uma vez via planilha Excel</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column: instructions + download */}
        <div className="flex flex-col gap-4">
          {/* Step 1 */}
          <div className="bg-[#0D1025] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 text-sm font-bold flex items-center justify-center shrink-0">1</span>
              <h2 className="font-medium text-white">Baixar modelo</h2>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Baixe a planilha modelo e preencha com os dados dos exercícios. A aba <span className="text-white font-medium">Referência</span> lista todos os valores aceitos em cada campo.
            </p>
            <button
              onClick={downloadTemplate}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 font-medium text-sm border border-indigo-500/25 transition-colors"
            >
              <Download className="w-4 h-4" />
              Baixar arquivo modelo (.xlsx)
            </button>
          </div>

          {/* Step 2 info */}
          <div className="bg-[#0D1025] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 text-sm font-bold flex items-center justify-center shrink-0">2</span>
              <h2 className="font-medium text-white">Preencher e enviar</h2>
            </div>
            <ul className="text-sm text-slate-400 leading-relaxed space-y-1.5">
              <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">•</span>Campos com <span className="text-white">*</span> são obrigatórios</li>
              <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">•</span>Não altere os nomes das colunas</li>
              <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">•</span>Apague a linha de exemplo antes de enviar</li>
              <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">•</span>URL da Mídia: cole o link do vídeo/imagem</li>
              <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">•</span>Linhas com erros serão ignoradas</li>
            </ul>
          </div>

          {/* Columns reference */}
          <div className="bg-[#0D1025] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-slate-300">
              <Info className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium">Colunas disponíveis</span>
            </div>
            <div className="flex flex-col divide-y divide-white/[0.04]">
              {COLUMNS.map((col) => {
                const values = col.note.includes(' | ') ? col.note.split(' | ') : null;
                return (
                  <div key={col.key} className="py-2 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-xs font-semibold ${col.required ? 'text-white' : 'text-slate-300'}`}>
                        {col.header}
                      </span>
                      {col.required && (
                        <span className="text-[10px] font-medium text-rose-400 bg-rose-400/10 px-1.5 py-0.5 rounded-full leading-none">obrigatório</span>
                      )}
                    </div>
                    {values ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {values.map((v) => (
                          <span key={v} className="text-[10px] text-slate-400 bg-white/[0.05] border border-white/[0.08] rounded px-1.5 py-0.5 leading-none">{v}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 leading-tight">{col.note}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: upload + preview */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Drop zone */}
          <div className="bg-[#0D1025] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 text-sm font-bold flex items-center justify-center shrink-0">3</span>
              <h2 className="font-medium text-white">Enviar planilha</h2>
            </div>

            {parsing ? (
              <div className="border-2 border-dashed border-indigo-500/40 rounded-xl flex flex-col items-center justify-center gap-3 py-12 bg-indigo-500/5">
                <span className="w-8 h-8 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                <p className="text-slate-400 text-sm">Lendo planilha...</p>
              </div>
            ) : !hasFile ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center gap-3 py-12 ${
                  dragOver
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                }`}
              >
                <Upload className="w-8 h-8 text-slate-500" />
                <div className="text-center">
                  <p className="text-slate-300 font-medium">Arraste o arquivo aqui</p>
                  <p className="text-slate-500 text-sm">ou clique para selecionar</p>
                </div>
                <span className="text-xs text-slate-600 bg-white/[0.04] px-3 py-1 rounded-full">.xlsx · .xls</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.07]">
                <FileSpreadsheet className="w-8 h-8 text-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{fileName}</p>
                  <p className="text-slate-400 text-xs">
                    {validRows.length} válido(s)
                    {invalidRows.length > 0 && `, ${invalidRows.length} com erro(s)`}
                  </p>
                </div>
                <button
                  onClick={clearFile}
                  className="p-1.5 rounded-lg hover:bg-white/[0.08] text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleInputChange}
            />
          </div>

          {/* Validation errors */}
          {invalidRows.length > 0 && (
            <div className="bg-[#0D1025] border border-red-500/20 rounded-2xl p-5 flex flex-col gap-3">
              <button
                onClick={() => setShowErrors((v) => !v)}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 font-medium text-sm">
                    {invalidRows.length} linha(s) com erro serão ignoradas
                  </span>
                </div>
                <span className="text-slate-500 text-xs">{showErrors ? 'Ocultar' : 'Ver detalhes'}</span>
              </button>
              {showErrors && (
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {invalidRows.map((r) => (
                    <div key={r.row} className="text-xs bg-red-500/5 border border-red-500/15 rounded-lg p-2.5">
                      <span className="text-red-400 font-medium">Linha {r.row}:</span>
                      <span className="text-slate-400 ml-1">{r.data.name || '(sem nome)'}</span>
                      <ul className="mt-1 space-y-0.5">
                        {r.errors.map((err, i) => (
                          <li key={i} className="text-red-300/80 flex items-start gap-1">
                            <span className="shrink-0">–</span>{err}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Preview table */}
          {validRows.length > 0 && (
            <div className="bg-[#0D1025] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-medium text-sm">
                    {validRows.length} exercício(s) prontos para importar
                  </span>
                </div>
                <button
                  onClick={clearFile}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpar
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-white/[0.04] border-b border-white/[0.06]">
                      <th className="text-left px-3 py-2 text-slate-400 font-medium whitespace-nowrap">#</th>
                      <th className="text-left px-3 py-2 text-slate-400 font-medium whitespace-nowrap">Nome</th>
                      <th className="text-left px-3 py-2 text-slate-400 font-medium whitespace-nowrap">Grupo</th>
                      <th className="text-left px-3 py-2 text-slate-400 font-medium whitespace-nowrap">Equipamento</th>
                      <th className="text-left px-3 py-2 text-slate-400 font-medium whitespace-nowrap">Nível</th>
                      <th className="text-left px-3 py-2 text-slate-400 font-medium whitespace-nowrap">Tipo</th>
                      <th className="text-left px-3 py-2 text-slate-400 font-medium whitespace-nowrap">Séries</th>
                      <th className="text-left px-3 py-2 text-slate-400 font-medium whitespace-nowrap">Reps</th>
                      <th className="text-left px-3 py-2 text-slate-400 font-medium whitespace-nowrap">Mídia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {validRows.map((r, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                        <td className="px-3 py-2 text-white font-medium max-w-[160px] truncate">{r.data.name}</td>
                        <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{r.data.muscleGroup}</td>
                        <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.data.equipment || '—'}</td>
                        <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.data.level || '—'}</td>
                        <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.data.exerciseType || '—'}</td>
                        <td className="px-3 py-2 text-slate-400 whitespace-nowrap text-center">{r.data.suggestedSets ?? '—'}</td>
                        <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.data.suggestedReps || '—'}</td>
                        <td className="px-3 py-2 text-slate-400 max-w-[120px] truncate">
                          {r.data.videoUrl
                            ? <span className="text-indigo-400">✓ link</span>
                            : '—'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Import button */}
              <div className="flex justify-end">
                <button
                  onClick={handleImport}
                  disabled={bulkMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
                >
                  {bulkMutation.isPending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Importar {validRows.length} exercício(s)
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
