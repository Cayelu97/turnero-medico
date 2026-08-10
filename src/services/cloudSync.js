import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://pmqcqvuxecibnxfkxrks.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcWNxdnV4ZWNpYm54Zmt4cmtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyODc5MzMsImV4cCI6MjEwMTg2MzkzM30.A_uDL8BbDAIf21gVmWa8Nu1gI2Oimxe2dJ991zVCJrI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SYNC_KEYS = [
  'mediturnos_clinica',
  'mediturnos_clinicas_list',
  'mediturnos_users',
  'mediturnos_especialidades',
  'mediturnos_servicios',
  'mediturnos_consultorios',
  'mediturnos_obras_sociales',
  'mediturnos_planes',
  'mediturnos_nomenclador',
  'mediturnos_convenios_coseguros',
  'mediturnos_profesionales',
  'mediturnos_horarios',
  'mediturnos_bloqueos',
  'mediturnos_pacientes',
  'mediturnos_turnos',
  'mediturnos_atenciones_hce',
  'mediturnos_motivos',
  'mediturnos_movimientos_caja'
];

export const CloudSyncService = {
  // Exportar todo el estado actual a un objeto JSON
  getLocalBackupPayload: () => {
    const payload = {};
    SYNC_KEYS.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          payload[key] = JSON.parse(data);
        } catch {
          payload[key] = data;
        }
      }
    });
    return payload;
  },

  // Aplicar un estado JSON a localStorage
  applyRemotePayload: (payload) => {
    if (!payload || typeof payload !== 'object') return false;
    Object.keys(payload).forEach(key => {
      if (SYNC_KEYS.includes(key) && payload[key] !== undefined) {
        localStorage.setItem(key, JSON.stringify(payload[key]));
      }
    });
    return true;
  },

  // Subir estado actual a Supabase
  pushToCloud: async () => {
    try {
      const payload = CloudSyncService.getLocalBackupPayload();
      
      // Intentar guardar en tabla 'app_sync' de Supabase
      const { data, error } = await supabase
        .from('app_sync')
        .upsert({ 
          id: 'global_state', 
          payload, 
          updated_at: new Date().toISOString() 
        });

      if (error) {
        console.warn('Supabase app_sync upsert warning:', error.message);
        if (error.message.includes('app_sync') || error.message.includes('schema cache') || error.message.includes('relation')) {
          return { 
            success: false, 
            message: "Falta crear la tabla 'app_sync' en Supabase. Ve a Configuración > Supabase y ejecuta el script SQL de 1 minuto." 
          };
        }
        return { success: false, message: error.message };
      }

      localStorage.setItem('mediturnos_last_cloud_sync', new Date().toISOString());
      return { success: true, timestamp: new Date().toISOString() };
    } catch (err) {
      console.error('Error al sincronizar con Supabase Cloud:', err);
      return { success: false, message: err.message };
    }
  },

  // Descargar estado más reciente de Supabase
  pullFromCloud: async () => {
    try {
      const { data, error } = await supabase
        .from('app_sync')
        .select('payload, updated_at')
        .eq('id', 'global_state')
        .single();

      if (error) {
        console.warn('No se pudo obtener app_sync de Supabase:', error.message);
        return { success: false, message: error.message };
      }

      if (data && data.payload) {
        CloudSyncService.applyRemotePayload(data.payload);
        localStorage.setItem('mediturnos_last_cloud_sync', data.updated_at || new Date().toISOString());
        return { success: true, timestamp: data.updated_at };
      }

      return { success: false, message: 'No hay datos previos en la nube.' };
    } catch (err) {
      console.error('Error al descargar de Supabase Cloud:', err);
      return { success: false, message: err.message };
    }
  }
};
