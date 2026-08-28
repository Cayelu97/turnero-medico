import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Building2, 
  User, 
  ChevronDown,
  Sparkles,
  Share2,
  Tv,
  LogOut,
  KeyRound,
  Check,
  Cloud,
  PanelLeftOpen,
  PanelLeftClose,
  Menu,
  Search,
  Command,
  Upload,
  Download,
  RefreshCw,
  CheckCircle2,
  Moon,
  Sun
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LoginModal } from './LoginModal';
import { QuickSearchPalette } from './QuickSearchPalette';
import { ImportarPacientesModal } from '../admin/ImportarPacientesModal';

export const Navbar = ({ isSidebarCollapsed, onToggleSidebar }) => {
  const { 
    activeClinica, 
    allClinicas, 
    switchClinica, 
    currentUser,
    logoutUser,
    syncWithCloud, 
    pullFromCloudNow,
    showToast 
  } = useApp();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const [showImportPacientesModal, setShowImportPacientesModal] = useState(false);
  const [showSedesDropdown, setShowSedesDropdown] = useState(false);
  const [showCloudDropdown, setShowCloudDropdown] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('dark');
      localStorage.removeItem('saludnet_dark_mode');
    }
  }, []);

  // Atajo global Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowQuickSearch(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Copiar link exclusivo para que saquen turnos los pacientes
  const handleCopyPatientLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?view=paciente`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast('¡Enlace exclusivo para pacientes copiado! Pégalo en WhatsApp o redes.');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Abrir pantalla TV en otra pestaña para el monitor de sala de espera
  const handleOpenTvTab = () => {
    const url = `${window.location.origin}${window.location.pathname}?view=tv`;
    window.open(url, '_blank');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            
            {/* TOGGLE SIDEBAR + LOGO & CLINIC SELECTOR */}
            <div className="flex items-center gap-3">
              <button
                onClick={onToggleSidebar}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                title={isSidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
              >
                {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
              </button>

              <div 
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm"
                style={{ backgroundColor: activeClinica?.color_primario || '#0284c7' }}
              >
                <Stethoscope className="w-5 h-5" />
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm text-slate-900 tracking-tight leading-none">
                    SaludNet
                  </span>
                  <span className="text-[10px] font-black text-medical-700 bg-medical-50 px-1.5 py-0.2 rounded border border-medical-200 uppercase">
                    PRO
                  </span>
                </div>

                {/* Multi-Tenant Clinic Switcher */}
                <div className="relative mt-0.5">
                  <button
                    type="button"
                    onClick={() => setShowSedesDropdown(prev => !prev)}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 hover:text-medical-600 px-1.5 py-0.5 rounded-lg hover:bg-slate-100/80 transition cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5 text-medical-600" />
                    <span className="truncate max-w-[150px] sm:max-w-[200px] font-extrabold">{activeClinica?.nombre || 'Sede Central'}</span>
                    {allClinicas.length > 1 && <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showSedesDropdown ? 'rotate-180' : ''}`} />}
                  </button>

                  {showSedesDropdown && allClinicas.length > 1 && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowSedesDropdown(false)} 
                      />
                      <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-scaleIn">
                        <div className="px-3.5 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mb-1">
                          Cambiar Sede de Atención
                        </div>
                        {allClinicas.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              switchClinica(c.id);
                              setShowSedesDropdown(false);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                              c.id === activeClinica?.id ? 'bg-medical-50 text-medical-800 font-black' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color_primario || '#0284c7' }} />
                              <span className="truncate">{c.nombre}</span>
                            </div>
                            {c.id === activeClinica?.id && <span className="text-[10px] bg-medical-100 text-medical-700 px-1.5 py-0.5 rounded font-black">Activa</span>}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN RÁPIDA & PERFIL */}
            <div className="flex items-center gap-2">
              {/* Botón Búsqueda Rápida / Command Palette */}
              <button
                onClick={() => setShowQuickSearch(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-2xs border border-slate-200 cursor-pointer"
                title="Búsqueda rápida universal (Ctrl + K)"
              >
                <Search className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Buscar</span>
                <kbd className="hidden md:inline-block px-1.5 py-0.2 bg-white text-slate-500 rounded text-[10px] font-mono border border-slate-200 font-bold shadow-2xs">
                  Ctrl K
                </kbd>
              </button>



              {/* Menú de Sincronización con Supabase Cloud */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCloudDropdown(prev => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                  title="Sincronización con la base de datos Supabase"
                >
                  <Cloud className="w-3.5 h-3.5 text-sky-600" />
                  <span className="hidden md:inline">Sync Nube</span>
                  <ChevronDown className={`w-3 h-3 text-sky-600 transition-transform ${showCloudDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showCloudDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowCloudDropdown(false)} 
                    />
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-scaleIn text-left space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-black text-slate-800">Base de Datos Supabase</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          Conectado
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-tight">
                        Tus turnos, agendas, pacientes y sedes están resguardados en Supabase Cloud.
                      </p>

                      <div className="space-y-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            syncWithCloud();
                            setShowCloudDropdown(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-900 rounded-xl text-xs font-bold transition cursor-pointer border border-sky-200"
                        >
                          <Upload className="w-3.5 h-3.5 text-sky-700" />
                          <span>Guardar / Subir a la Nube</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            pullFromCloudNow();
                            setShowCloudDropdown(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-200"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-700" />
                          <span>Restaurar / Descargar de la Nube</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Botón Copiar Link Pacientes */}
              <button
                onClick={handleCopyPatientLink}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                title="Copiar enlace limpio exclusivo para que los pacientes saquen turnos"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-emerald-600" />}
                <span>{copiedLink ? '¡Copiado!' : 'Link Pacientes'}</span>
              </button>

              {/* Botón Abrir TV en Monitor de Sala */}
              <button
                onClick={handleOpenTvTab}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                title="Abrir el llamador en una ventana nueva para el monitor de la sala de espera"
              >
                <Tv className="w-3.5 h-3.5 text-rose-400" />
                <span>Abrir TV</span>
              </button>

              {/* Selector de Perfil / Login */}
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl text-xs transition text-left cursor-pointer"
              >
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-white text-[11px] font-black ${
                  currentUser?.rol === 'SUPERADMIN' ? 'bg-amber-500' :
                  currentUser?.rol === 'PROFESIONAL' ? 'bg-medical-600' :
                  'bg-slate-800'
                }`}>
                  {currentUser?.rol === 'PROFESIONAL' ? 'Dr' : currentUser?.rol === 'SUPERADMIN' ? 'SA' : 'Sec'}
                </div>
                <div className="hidden lg:block">
                  <span className="font-extrabold text-slate-800 block text-xs leading-none">
                    {currentUser?.nombre || 'Usuario'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {currentUser?.rol === 'ADMIN_CLINICA' ? 'Admin' :
                     currentUser?.rol === 'SUPERADMIN' ? 'SuperAdmin' :
                     currentUser?.rol === 'PROFESIONAL' ? 'Médico' : 'Secretaría'}
                  </span>
                </div>
              </button>

              {/* Botón Cerrar Sesión */}
              <button
                onClick={logoutUser}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl text-xs font-bold transition cursor-pointer"
                title="Cerrar sesión institucional y volver a la pantalla de login"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modal Switcher de Roles y Credenciales */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />

      {/* Paleta de Búsqueda Rápida Universal (Ctrl+K) */}
      <QuickSearchPalette
        isOpen={showQuickSearch}
        onClose={() => setShowQuickSearch(false)}
      />

      {/* Modal de Importación Masiva de Pacientes */}
      <ImportarPacientesModal
        isOpen={showImportPacientesModal}
        onClose={() => setShowImportPacientesModal(false)}
      />
    </>
  );
};
