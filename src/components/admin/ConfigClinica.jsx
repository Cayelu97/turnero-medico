import React, { useState } from 'react';
import { 
  Building, 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  ShieldAlert,
  Copy,
  Check,
  ExternalLink,
  Cloud,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';
import { CloudSyncService } from '../../services/cloudSync';

export const ConfigClinica = () => {
  const { clinica, setClinica, showToast, refreshAll, syncWithCloud, pullFromCloudNow } = useApp();

  const [form, setForm] = useState({ ...clinica });
  const [supabaseCfg, setSupabaseCfg] = useState(() => StorageService.getSupabaseConfig());
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const SQL_SCRIPT = `-- SCRIPT PARA HABILITAR SINCRONIZACIÓN EN LA NUBE (SUPABASE)
-- Copia y pega este script en: Supabase Dashboard > SQL Editor > New Query y haz clic en RUN

create table if not exists public.app_sync (
  id text primary key,
  payload jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar permisos de lectura y guardado
alter table public.app_sync enable row level security;

drop policy if exists "Permitir lectura publica" on public.app_sync;
create policy "Permitir lectura publica" on public.app_sync for select using (true);

drop policy if exists "Permitir escritura publica" on public.app_sync;
create policy "Permitir escritura publica" on public.app_sync for all using (true) with check (true);
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCRIPT);
    setCopiedSql(true);
    showToast('¡Script SQL copiado al portapapeles!');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleSaveClinica = (e) => {
    e.preventDefault();
    StorageService.saveClinica(form);
    setClinica(form);
    showToast('Datos de la institución actualizados');
  };

  const handleTestSupabase = async () => {
    setTestingSupabase(true);
    setSupabaseStatus(null);
    try {
      StorageService.saveSupabaseConfig(supabaseCfg);
      const res = await CloudSyncService.pushToCloud();
      if (res.success) {
        setSupabaseStatus({ ok: true, msg: '¡Conexión y Sincronización exitosa con Supabase Cloud!' });
        showToast('☁️ ¡Conexión con Supabase verificada y funcionando!');
      } else {
        setSupabaseStatus({ 
          ok: false, 
          msg: `Falta crear la tabla en Supabase: ${res.message}. Ejecuta el script SQL que figura abajo.` 
        });
      }
    } catch (err) {
      setSupabaseStatus({ ok: false, msg: `Error de red: ${err.message}` });
    } finally {
      setTestingSupabase(false);
    }
  };

  const handleExportBackup = () => {
    const jsonStr = StorageService.exportFullDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_mediturnos_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Copia de seguridad descargada');
  };

  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const ok = StorageService.importFullDatabaseJson(content);
      if (ok) {
        refreshAll();
        showToast('Base de datos restaurada correctamente');
      } else {
        showToast('Error al procesar el archivo de copia de seguridad', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleFactoryReset = () => {
    if (confirm('¿Está seguro de restablecer todos los datos a los valores de fábrica? Se reiniciarán obras sociales, turnos y agendas.')) {
      StorageService.resetToFactoryDefaults();
      refreshAll();
      showToast('Datos restablecidos a valores iniciales');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      
      {/* 1. SECCIÓN DESTACADA: SINCRONIZACIÓN EN LA NUBE CON SUPABASE */}
      <div className="bg-gradient-to-br from-sky-900 via-slate-900 to-slate-950 text-white p-6 sm:p-8 rounded-3xl border border-sky-500/30 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-500/20 text-sky-400 rounded-2xl border border-sky-500/30">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Sincronización en la Nube Supabase (PC ↔ Celular)</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                  En Tiempo Real
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Conecta tu base de datos Supabase para que cualquier cambio en la PC se vea al instante en el celular y en Vercel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={syncWithCloud}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-black transition shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Cloud className="w-4 h-4" />
              <span>Subir a la Nube</span>
            </button>
            <button
              type="button"
              onClick={pullFromCloudNow}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-sky-400" />
              <span>Descargar Cambios</span>
            </button>
          </div>
        </div>

        {/* GUÍA DE 1 CLIC PARA CREAR LA TABLA EN SUPABASE */}
        <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <strong className="text-xs font-black text-white">
                Paso Único: Crear la tabla de sincronización en Supabase (1 minuto)
              </strong>
            </div>
            <a
              href="https://supabase.com/dashboard/project/pmqcqvuxecibnxfkxrks/sql/new"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-sky-400 hover:text-sky-300 underline"
            >
              <span>Abrir SQL Editor en Supabase</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Para que Supabase acepte la sincronización, copia este código SQL y pégalo en tu <a href="https://supabase.com/dashboard/project/pmqcqvuxecibnxfkxrks/sql/new" target="_blank" rel="noreferrer" className="text-sky-400 font-bold underline">SQL Editor de Supabase</a> y presiona <strong>RUN</strong>:
          </p>

          <div className="relative bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
            <button
              type="button"
              onClick={handleCopySql}
              className="absolute top-2.5 right-2.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? '¡Copiado!' : 'Copiar Script SQL'}</span>
            </button>
            <pre>{SQL_SCRIPT}</pre>
          </div>
        </div>

        {/* CREDENCIALES SUPABASE */}
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">SUPABASE URL</label>
              <input
                type="text"
                placeholder="https://xxxxxxxx.supabase.co"
                value={supabaseCfg.url}
                onChange={(e) => setSupabaseCfg({ ...supabaseCfg, url: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">SUPABASE ANON KEY</label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                value={supabaseCfg.anonKey}
                onChange={(e) => setSupabaseCfg({ ...supabaseCfg, anonKey: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {supabaseStatus && (
            <div className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              supabaseStatus.ok ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            }`}>
              {supabaseStatus.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
              <span>{supabaseStatus.msg}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleTestSupabase}
              disabled={testingSupabase}
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${testingSupabase ? 'animate-spin' : ''}`} />
              <span>{testingSupabase ? 'Verificando con Supabase...' : 'Guardar y Probar Sincronización'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. DATOS DE LA CLÍNICA */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Building className="w-5 h-5 text-medical-600" />
          <h2 className="text-base font-extrabold text-slate-900">Identidad de la Clínica / Consultorios</h2>
        </div>

        <form onSubmit={handleSaveClinica} className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de la Institución *</label>
              <input
                type="text"
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-medical-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Dirección de Atención</label>
              <input
                type="text"
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-medical-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono Central</label>
              <input
                type="text"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-medical-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp de Turnos</label>
              <input
                type="text"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-medical-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mensaje de Bienvenida en Turnero</label>
            <textarea
              rows="2"
              value={form.mensaje_bienvenida}
              onChange={(e) => setForm({ ...form, mensaje_bienvenida: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-medical-500 bg-white"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-medical-600 hover:bg-medical-700 text-white rounded-xl font-bold text-xs shadow-md transition"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios de la Clínica</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. COPIAS DE SEGURIDAD LOCALES (JSON) */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-5 h-5 text-slate-700" />
          <h2 className="text-base font-extrabold text-slate-900">Copias de Seguridad en Archivo (JSON)</h2>
        </div>

        <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-slate-900">Exportar / Importar Backup</h4>
            <p className="text-xs text-slate-500">
              Descarga un archivo JSON completo con turnos, médicos y pacientes para respaldar en tu PC.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Backup JSON</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Importar Backup</span>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>

            <button
              type="button"
              onClick={handleFactoryReset}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition shadow-xs ml-2"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Reset de Fábrica</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
