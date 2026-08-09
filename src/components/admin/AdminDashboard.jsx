import React, { useState } from 'react';
import { 
  Stethoscope, 
  ShieldCheck, 
  UserCheck, 
  DoorClosed, 
  BookOpen, 
  CalendarOff, 
  Building, 
  CalendarRange,
  Building2,
  AlertCircle,
  Users,
  KeyRound
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AbmEspecialidades } from './AbmEspecialidades';
import { AbmServicios } from './AbmServicios';
import { AbmObrasSociales } from './AbmObrasSociales';
import { AbmProfesionales } from './AbmProfesionales';
import { AbmConsultorios } from './AbmConsultorios';
import { AbmNomenclador } from './AbmNomenclador';
import { AbmBloqueos } from './AbmBloqueos';
import { AbmMotivos } from './AbmMotivos';
import { AbmPacientes } from './AbmPacientes';
import { AbmUsuarios } from './AbmUsuarios';
import { AbmClinicas } from './AbmClinicas';
import { ConfigClinica } from './ConfigClinica';
import { ConfigurarAgendaModal } from '../secretary/ConfigurarAgendaModal';

export const AdminDashboard = () => {
  const { 
    adminTab = 'pacientes', 
    setAdminTab,
    especialidades = [],
    servicios = [],
    obrasSociales = [],
    planes = [],
    profesionales = [],
    consultorios = [],
    nomenclador = [],
    bloqueos = [],
    motivos = [],
    pacientes = [],
    users = [],
    allClinicas = []
  } = useApp();

  const [showAgendaModal, setShowAgendaModal] = useState(false);

  const tabs = [
    {
      id: 'usuarios',
      label: 'Usuarios & Accesos',
      icon: KeyRound,
      count: users?.length || 0,
      subCount: 'Credenciales'
    },
    {
      id: 'pacientes',
      label: 'Padrón Pacientes',
      icon: Users,
      count: pacientes?.length || 0,
      subCount: 'Padrón Central'
    },
    {
      id: 'especialidades',
      label: 'Especialidades',
      icon: Stethoscope,
      count: especialidades?.length || 0,
      subCount: 'Especialidades'
    },
    {
      id: 'servicios',
      label: 'Servicios & Agendas',
      icon: Stethoscope,
      count: servicios?.length || 0,
      subCount: 'Líneas de atención'
    },
    {
      id: 'obras_sociales',
      label: 'Obras Sociales & Planes',
      icon: ShieldCheck,
      count: obrasSociales?.length || 0,
      subCount: `${planes?.length || 0} planes`
    },
    {
      id: 'profesionales',
      label: 'Profesionales & Médicos',
      icon: UserCheck,
      count: profesionales?.length || 0,
      subCount: 'Médicos'
    },
    {
      id: 'consultorios',
      label: 'Consultorios Físicos',
      icon: DoorClosed,
      count: consultorios?.length || 0,
      subCount: 'Espacios'
    },
    {
      id: 'nomenclador',
      label: 'Nomenclador PMO',
      icon: BookOpen,
      count: nomenclador?.length || 0,
      subCount: 'Prácticas'
    },
    {
      id: 'bloqueos',
      label: 'Vacaciones & Feriados',
      icon: CalendarOff,
      count: bloqueos?.length || 0,
      subCount: 'Bloqueos'
    },
    {
      id: 'motivos',
      label: 'Motivos Cancel / Reprog',
      icon: AlertCircle,
      count: motivos?.length || 0,
      subCount: 'Catálogo'
    },
    {
      id: 'clinicas_saas',
      label: 'Centros Médicos (SaaS)',
      icon: Building2,
      count: allClinicas?.length || 0,
      subCount: 'Clientes'
    },
    {
      id: 'clinica',
      label: 'Configuración & Supabase',
      icon: Building,
      count: null,
      subCount: 'Ajustes'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header del Panel de Configuración */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Panel de Configuración y Maestros (ABM)
            </h1>
            <span className="px-2.5 py-1 text-xs font-bold bg-medical-50 text-medical-700 rounded-lg border border-medical-200">
              Administración
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Administra especialidades médicas, obras sociales, planes, profesionales, consultorios físicos, feriados y centros médicos multi-tenant.
          </p>
        </div>

        <button
          onClick={() => setShowAgendaModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-md transition"
        >
          <CalendarRange className="w-4 h-4 text-sky-400" />
          <span>Configurar Agendas de Médicos</span>
        </button>
      </div>

      {/* Grid de pestañas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = adminTab === t.id;

          return (
            <button
              key={t.id}
              onClick={() => setAdminTab(t.id)}
              className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                isActive
                  ? 'bg-medical-700 text-white border-medical-800 shadow-md shadow-medical-900/10'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-medical-300 hover:bg-slate-50 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-medical-600'}`} />
                {t.count !== null && (
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {t.count}
                  </span>
                )}
              </div>
              <div className="mt-2">
                <p className="font-bold text-xs leading-tight line-clamp-1">{t.label}</p>
                <span className={`text-[10px] font-medium block mt-0.5 ${isActive ? 'text-sky-100' : 'text-slate-400'}`}>
                  {t.subCount}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Contenido según la pestaña activa */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        {adminTab === 'usuarios' && <AbmUsuarios />}
        {adminTab === 'pacientes' && <AbmPacientes />}
        {adminTab === 'especialidades' && <AbmEspecialidades />}
        {adminTab === 'servicios' && <AbmServicios />}
        {adminTab === 'obras_sociales' && <AbmObrasSociales />}
        {adminTab === 'profesionales' && <AbmProfesionales />}
        {adminTab === 'consultorios' && <AbmConsultorios />}
        {adminTab === 'nomenclador' && <AbmNomenclador />}
        {adminTab === 'bloqueos' && <AbmBloqueos />}
        {adminTab === 'motivos' && <AbmMotivos />}
        {adminTab === 'clinicas_saas' && <AbmClinicas />}
        {adminTab === 'clinica' && <ConfigClinica />}
      </div>

      {/* Modal Configurador de Agendas */}
      <ConfigurarAgendaModal
        isOpen={showAgendaModal}
        onClose={() => setShowAgendaModal(false)}
      />
    </div>
  );
};
