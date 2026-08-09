import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { Toast } from './components/common/Toast';
import { TurneroWizard } from './components/patient/TurneroWizard';
import { MisTurnos } from './components/patient/MisTurnos';
import { AgendaView } from './components/secretary/AgendaView';
import { RecepcionView } from './components/reception/RecepcionView';
import { TvDisplay } from './components/tv/TvDisplay';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { HistoriaClinicaView } from './components/ehr/HistoriaClinicaView';
import { DoctorPortal } from './components/doctor/DoctorPortal';
import { FacturacionView } from './components/billing/FacturacionView';
import { CalendarPlus, Search, ArrowLeft } from 'lucide-react';

const MainContent = () => {
  const { currentView, setCurrentView } = useApp();
  const [patientSubView, setPatientSubView] = useState('nuevo'); // 'nuevo' | 'mis_turnos'

  // Si la vista es TV, pantalla completa dedicada
  if (currentView === 'tv') {
    return (
      <div className="relative">
        <button
          onClick={() => setCurrentView('agenda')}
          className="fixed top-4 right-4 z-50 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 backdrop-blur-xs border border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Salir de Pantalla TV</span>
        </button>
        <TvDisplay />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 pb-16">
        {/* VISTA PACIENTE / AFILIADOS */}
        {currentView === 'paciente' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Sub-selector de Paciente: Sacar Turno vs Mis Turnos */}
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

        {/* VISTA ADMINISTRACIÓN & ABMS */}
        {currentView === 'admin' && <AdminDashboard />}

        {/* VISTA HISTORIA CLÍNICA (HCE) */}
        {currentView === 'hce' && <HistoriaClinicaView />}

        {/* VISTA FACTURACIÓN & LIQUIDACIONES */}
        {currentView === 'facturacion' && <FacturacionView />}
      </main>

      {/* Footer General */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 font-medium no-print">
        <span>MediTurnos Pro • Sistema de Gestión de Consultorios Médicos & Turnero Online</span>
      </footer>

      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
