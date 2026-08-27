import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { Toast } from './components/common/Toast';
import { LoginView } from './components/auth/LoginView';
import { TurneroWizard } from './components/patient/TurneroWizard';
import { MisTurnos } from './components/patient/MisTurnos';
import { AgendaView } from './components/secretary/AgendaView';
import { RecepcionView } from './components/reception/RecepcionView';
import { TvDisplay } from './components/tv/TvDisplay';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { HistoriaClinicaView } from './components/ehr/HistoriaClinicaView';
import { DoctorPortal } from './components/doctor/DoctorPortal';
import { FacturacionView } from './components/billing/FacturacionView';
import { CajaView } from './components/cash/CajaView';
import { AbmPacientes } from './components/admin/AbmPacientes';
import { CalendarPlus, Search, ArrowLeft, Stethoscope, Lock, Building, Sparkles } from 'lucide-react';

const MainContent = () => {
  const { currentView, setCurrentView, activeClinica, currentUser } = useApp();
  const [patientSubView, setPatientSubView] = useState('nuevo'); // 'nuevo' | 'mis_turnos'
  const [isPatientOnlyMode, setIsPatientOnlyMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Detección de parámetros en la URL (?view=paciente, ?view=tv, etc.)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view') || params.get('modo');
    const hash = window.location.hash.replace('#/', '').replace('#', '');

    if (viewParam === 'paciente' || hash === 'paciente') {
      setIsPatientOnlyMode(true);
      setCurrentView('paciente');
    } else if (viewParam === 'tv' || hash === 'tv') {
      setCurrentView('tv');
    }
  }, []);

  // 1. VISTA TV DEDICADA A PANTALLA COMPLETA (Para el monitor de sala de espera)
  if (currentView === 'tv') {
    return (
      <div className="relative min-h-screen bg-slate-950">
        <button
          onClick={() => setCurrentView('agenda')}
          className="fixed top-4 right-4 z-50 px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 backdrop-blur-md border border-slate-700 shadow-lg no-print cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-sky-400" />
          <span>Salir de Pantalla TV</span>
        </button>
        <TvDisplay />
        <Toast />
      </div>
    );
  }

  // 2. VISTA EXCLUSIVA Y LIMPIA PARA PACIENTES (Para compartir por WhatsApp / Redes)
  if (isPatientOnlyMode || (currentView === 'paciente' && !currentUser)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-sky-50/30 flex flex-col justify-between">
        {/* Header Institucional Limpio para el Paciente */}
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm"
                style={{ backgroundColor: activeClinica?.color_primario || '#0284c7' }}
              >
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-black text-slate-900 tracking-tight leading-tight">
                  {activeClinica?.nombre || 'Centro Médico San Lucas'}
                </h1>
                <span className="text-[11px] text-slate-500 font-bold block">
                  Turnero Online de Pacientes
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPatientSubView(patientSubView === 'nuevo' ? 'mis_turnos' : 'nuevo')}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                {patientSubView === 'nuevo' ? <Search className="w-3.5 h-3.5 text-medical-600" /> : <CalendarPlus className="w-3.5 h-3.5 text-medical-600" />}
                <span>{patientSubView === 'nuevo' ? 'Mis Turnos' : 'Sacar Turno'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Contenido del Turnero */}
        <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 flex-1">
          {patientSubView === 'nuevo' ? <TurneroWizard /> : <MisTurnos />}
        </main>

        {/* Footer del Portal del Paciente con acceso para el personal */}
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 space-y-2 no-print">
          <p className="font-semibold text-slate-700">
            {activeClinica?.nombre} • {activeClinica?.direccion || 'Av. Santa Fe 2450'} • Tel: {activeClinica?.telefono || '+54 11 4821-9000'}
          </p>
          <div>
            <button
              onClick={() => {
                setIsPatientOnlyMode(false);
                setCurrentView('login');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-bold transition cursor-pointer"
            >
              <Lock className="w-3 h-3 text-slate-500" />
              <span>Acceso para Personal Médico y Secretaría</span>
            </button>
          </div>
        </footer>

        <Toast />
      </div>
    );
  }

  // 3. PANTALLA DE LOGIN / BIENVENIDA (Si no ha iniciado sesión)
  if (!currentUser || currentView === 'login') {
    return (
      <>
        <LoginView onSelectPatientView={() => {
          setIsPatientOnlyMode(true);
          setCurrentView('paciente');
        }} />
        <Toast />
      </>
    );
  }

  // 4. VISTA PRINCIPAL DEL SISTEMA CON SIDEBAR LATERAL & HEADER COMPACTO
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header Superior Limpio */}
      <Navbar 
        isSidebarCollapsed={isSidebarCollapsed} 
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />

      {/* Contenedor Flex: Sidebar Izquierdo + Área de Contenido Principal */}
      <div className="flex flex-1 min-h-[calc(100vh-64px)]">
        {/* Sidebar Lateral Colapsable */}
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />

        {/* Contenido Dinámico según la Vista Activa */}
        <main className="flex-1 w-full overflow-x-hidden p-3 sm:p-6">
          {/* VISTA PACIENTE DENTRO DEL PANEL */}
          {currentView === 'paciente' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex justify-center">
                <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center gap-1 shadow-inner">
                  <button
                    onClick={() => setPatientSubView('nuevo')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition ${
                      patientSubView === 'nuevo'
                        ? 'bg-white text-medical-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CalendarPlus className="w-4 h-4 text-medical-600" />
                    <span>Sacar Nuevo Turno Online</span>
                  </button>
                  <button
                    onClick={() => setPatientSubView('mis_turnos')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition ${
                      patientSubView === 'mis_turnos'
                        ? 'bg-white text-medical-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Search className="w-4 h-4 text-medical-600" />
                    <span>Consultar / Cancelar Mis Turnos</span>
                  </button>
                </div>
              </div>

              {patientSubView === 'nuevo' ? <TurneroWizard /> : <MisTurnos />}
            </div>
          )}

          {/* VISTA AGENDA SECRETARÍA */}
          {currentView === 'agenda' && <AgendaView />}

          {/* VISTA RECEPCIÓN Y SALA DE ESPERA */}
          {currentView === 'recepcion' && <RecepcionView />}

          {/* VISTA PORTAL MÉDICO / CONSULTORIO DIGITAL */}
          {currentView === 'doctor' && <DoctorPortal />}

          {/* VISTA CAJA RECAUDADORA & ARQUEO DIARIO */}
          {currentView === 'caja' && <CajaView />}

          {/* VISTA ADMINISTRACIÓN & ABMS */}
          {currentView === 'admin' && <AdminDashboard />}

          {/* VISTA HISTORIA CLÍNICA (HCE) */}
          {currentView === 'hce' && <HistoriaClinicaView />}

          {/* VISTA FACTURACIÓN & LIQUIDACIONES */}
          {currentView === 'facturacion' && <FacturacionView />}

          {/* VISTA PADRÓN & IMPORTADOR DE PACIENTES DEDICADA A PANTALLA COMPLETA */}
          {currentView === 'pacientes' && (
            <div className="max-w-[1700px] mx-auto">
              <AbmPacientes />
            </div>
          )}
        </main>
      </div>

      {/* Footer General */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500 font-medium no-print">
        <span>SaludNet Pro • Sistema Integral de Consultorios Médicos & Turnero Online</span>
      </footer>

      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
