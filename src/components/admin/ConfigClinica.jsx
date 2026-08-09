import React, { useState } from 'react';
import { Building, Database, Download, Upload, RefreshCw, CheckCircle2, AlertCircle, Save, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';

export const ConfigClinica = () => {
  const { clinica, setClinica, showToast, refreshAll } = useApp();

  const [form, setForm] = useState({ ...clinica });
  const [supabaseCfg, setSupabaseCfg] = useState(() => StorageService.getSupabaseConfig());
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState(null);

  const handleSaveClinica = (e) => {
    e.preventDefault();
    StorageService.updateClinica(form);
    setClinica(form);
    showToast('Datos de la institución actualizados');
  };

  const handleTestSupabase = async () => {
    setTestingSupabase(true);
    setSupabaseStatus(null);
    try {
      StorageService.saveSupabaseConfig(supabaseCfg);
      const client = StorageService.getSupabaseClient();
      if (!client) {
        setSupabaseStatus({ ok: false, msg: 'Faltan credenciales URL o Anon Key' });
      } else {
        // Test query
        const { data, error } = await client.from('clinicas').select('count', { count: 'exact', head: true });
        if (error) {
          setSupabaseStatus({ ok: false, msg: `Conexión fallida: ${error.message}` });
        } else {
          setSupabaseStatus({ ok: true, msg: '¡Conexión exitosa a Supabase Cloud!' });
          StorageService.saveSupabaseConfig({ ...supabaseCfg, connected: true });
        }
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
    <div className="space-y-8 max-w-4xl">
      {/* 1. Datos de la Clínica */}
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
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CUIT</label>
              <input
                type="text"
                value={form.cuit}
                onChange={(e) => setForm({ ...form, cuit: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Dirección Física</label>
              <input
                type="text"
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono Fijo / Central</label>
              <input
                type="text"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp de Turnos</label>
              <input
                type="text"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mensaje de Bienvenida en Turnero</label>
            <textarea
              rows="2"
              value={form.mensaje_bienvenida}
              onChange={(e) => setForm({ ...form, mensaje_bienvenida: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-500 bg-white"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-medical-600 hover:bg-medical-700 text-white rounded-xl font-bold text-sm shadow-md shadow-medical-600/20"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios de la Clínica</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Conexión Supabase Cloud */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-extrabold text-slate-900">Conexión a Base de Datos Supabase (PostgreSQL Cloud)</h2>
        </div>

        <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
          <p className="text-xs text-slate-600">
            Ingresa las credenciales de tu proyecto en <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-medical-600 font-bold underline">Supabase</a> para sincronización en la nube y tiempo real. Si aún no las tienes, el sistema opera de forma local y persistente.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">SUPABASE URL</label>
              <input
                type="text"
                placeholder="https://xxxxxxxx.supabase.co"
                value={supabaseCfg.url}
                onChange={(e) => setSupabaseCfg({ ...supabaseCfg, url: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-medical-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">SUPABASE ANON KEY</label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                value={supabaseCfg.anonKey}
                onChange={(e) => setSupabaseCfg({ ...supabaseCfg, anonKey: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-medical-500 bg-white"
              />
            </div>
          </div>

          {supabaseStatus && (
            <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              supabaseStatus.ok ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}>
              {supabaseStatus.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{supabaseStatus.msg}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <span className="text-[11px] text-slate-500">
              Esquemas listos en <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">supabase_schema.sql</code>
            </span>
            <button
              type="button"
              onClick={handleTestSupabase}
              disabled={testingSupabase}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20"
            >
              <RefreshCw className={`w-4 h-4 ${testingSupabase ? 'animate-spin' : ''}`} />
              <span>{testingSupabase ? 'Verificando...' : 'Guardar y Probar Conexión'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Copia de Seguridad & Restablecimiento */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-5 h-5 text-slate-700" />
          <h2 className="text-base font-extrabold text-slate-900">Copias de Seguridad y Mantenimiento</h2>
        </div>

        <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-slate-900">Exportar e Importar Datos</h4>
            <p className="text-xs text-slate-500">
              Descarga un archivo JSON con toda la información (turnos, obras sociales, profesionales, agendas) o restaura una copia anterior.
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
