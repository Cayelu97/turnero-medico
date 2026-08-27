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
  KeyRound,
  ChevronDown,
  ChevronRight,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Layers,
  Settings2
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
    adminTab = 'usuarios', 
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Módulos organizados por categorías funcionales
  const categories = [
    {
      category: 'Seguridad & Pacientes',
      items: [
        { id: 'usuarios', label: 'Usuarios & Accesos', icon: KeyRound, count: users?.length || 0, color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'pacientes', label: 'Padrón de Pacientes', icon: Users, count: pacientes?.length || 0, color: 'text-sky-600', bg: 'bg-sky-50' }
      ]
    },
    {
      category: 'Estructura Médica',
      items: [
        { id: 'profesionales', label: 'Profesionales & Médicos', icon: UserCheck, count: profesionales?.length || 0, color: 'text-purple-600', bg: 'bg-purple-50' },
        { id: 'especialidades', label: 'Especialidades Médicas', icon: Stethoscope, count: especialidades?.length || 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { id: 'servicios', label: 'Servicios & Agendas', icon: Layers, count: servicios?.length || 0, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { id: 'consultorios', label: 'Consultorios Físicos', icon: DoorClosed, count: consultorios?.length || 0, color: 'text-teal-600', bg: 'bg-teal-50' }
      ]
    },
    {
      category: 'Coberturas & Nomenclador',
      items: [
        { id: 'obras_sociales', label: 'Obras Sociales & Planes', icon: ShieldCheck, count: obrasSociales?.length || 0, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'nomenclador', label: 'Nomenclador PMO', icon: BookOpen, count: nomenclador?.length || 0, color: 'text-cyan-600', bg: 'bg-cyan-50' },
        { id: 'bloqueos', label: 'Vacaciones & Feriados', icon: CalendarOff, count: bloqueos?.length || 0, color: 'text-rose-600', bg: 'bg-rose-50' },
        { id: 'motivos', label: 'Motivos Cancel / Reprog', icon: AlertCircle, count: motivos?.length || 0, color: 'text-orange-600', bg: 'bg-orange-50' }
      ]
    },
    {
      category: 'Sistema & Ajustes',
      items: [
        { id: 'clinicas_saas', label: 'Centros Médicos (SaaS)', icon: Building2, count: allClinicas?.length || 0, color: 'text-slate-600', bg: 'bg-slate-50' },
        { id: 'clinica', label: 'Configuración & Nube', icon: Settings2, count: null, color: 'text-slate-600', bg: 'bg-slate-50' }
      ]
    }
  ];

  // Encontrar el módulo activo actual
  const allItems = categories.flatMap(c => c.items);
  const activeItem = allItems.find(i => i.id === adminTab) || allItems[0];
  const ActiveIcon = activeItem?.icon || Settings2;

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
      
      {/* HEADER COMPACTO Y MODERNO */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition hidden md:flex items-center justify-center shadow-2xs"
            title={isSidebarCollapsed ? "Expandir menú de módulos" : "Colapsar menú para mayor espacio"}
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-2xl ${activeItem.bg} ${activeItem.color} border border-slate-200/60 shadow-2xs`}>
              <ActiveIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  {activeItem.label}
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase bg-medical-50 text-medical-700 rounded-md border border-medical-200">
                  Módulo de Gestión
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Panel de Administración y Control Maestro
              </p>
            </div>
          </div>
        </div>

        {/* SELECTOR DESPLEGABLE RÁPIDO & BOTÓN DE AGENDA */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Dropdown Selector para cambiar de módulo con 1 clic */}
          <div className="relative inline-block flex-1 sm:flex-initial">
            <select
              value={adminTab}
              onChange={(e) => setAdminTab(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-2xl text-xs font-black text-slate-800 cursor-pointer focus:ring-2 focus:ring-medical-500 shadow-2xs pr-8"
            >
              {categories.map((cat) => (
                <optgroup key={cat.category} label={`── ${cat.category} ──`}>
                  {cat.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label} {item.count !== null ? `(${item.count})` : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Botón Configurar Agendas Semanales */}
          <button
            onClick={() => setShowAgendaModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-md transition whitespace-nowrap cursor-pointer"
          >
            <CalendarRange className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Configurar Agendas Médicas</span>
            <span className="sm:hidden">Agendas</span>
          </button>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL: SIDEBAR COLAPSABLE + ÁREA DE TRABAJO */}
      <div className="flex gap-5 items-start">
        
        {/* SIDEBAR LATERAL DESPLEGABLE / COLAPSABLE (DESKTOP) */}
        <aside
          className={`transition-all duration-300 bg-white border border-slate-200/80 rounded-3xl shadow-xs p-3 hidden md:flex flex-col gap-4 flex-shrink-0 ${
            isSidebarCollapsed ? 'w-16 items-center' : 'w-64'
          }`}
        >
          {categories.map((cat) => (
            <div key={cat.category} className="w-full space-y-1">
              {!isSidebarCollapsed && (
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1 block">
                  {cat.category}
                </span>
              )}

              <div className="space-y-1">
                {cat.items.map((item) => {
                  const ItemIcon = item.icon;
                  const isActive = adminTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setAdminTab(item.id)}
                      title={`${item.label} (${item.count !== null ? item.count : ''})`}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-xs font-bold transition-all ${
                        isSidebarCollapsed ? 'justify-center px-0' : 'justify-between'
                      } ${
                        isActive
                          ? 'bg-medical-600 text-white shadow-md shadow-medical-600/20 font-black'
                          : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <ItemIcon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : item.color}`} />
                        {!isSidebarCollapsed && (
                          <span className="truncate max-w-[130px]">{item.label}</span>
                        )}
                      </div>

                      {!isSidebarCollapsed && item.count !== null && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* ÁREA DE CONTENIDO ADAPTABLE AL 100% DEL ESPACIO */}
        <main className="flex-1 min-w-0 w-full bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-7 overflow-x-auto animate-fadeIn">
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
        </main>
      </div>

      {/* Modal Configurador de Agendas */}
      <ConfigurarAgendaModal
        isOpen={showAgendaModal}
        onClose={() => setShowAgendaModal(false)}
      />
    </div>
  );
};
