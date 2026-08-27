import React from 'react';
import { 
  Calendar, 
  Users, 
  Tv, 
  Settings, 
  FileText, 
  DollarSign, 
  Stethoscope, 
  UserCheck, 
  Wallet,
  Globe,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutGrid
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getLocalDateString } from '../../utils/dateUtils';

export const Sidebar = ({ isCollapsed, onToggleCollapse }) => {
  const { 
    currentView, 
    setCurrentView, 
    adminTab,
    setAdminTab,
    turnos = [], 
    pacientes = [],
    currentUser 
  } = useApp();

  const todayStr = getLocalDateString(new Date());
  const turnosHoy = turnos.filter(t => t.fecha === todayStr && t.estado !== 'CANCELADO');
  const enEsperaCount = turnosHoy.filter(t => t.estado === 'EN_ESPERA').length;

  const allNavItems = [
    { id: 'agenda', label: 'Agenda Secretaría', icon: Calendar, badge: turnosHoy.length > 0 ? turnosHoy.length : null, badgeColor: 'bg-medical-500', roles: ['ADMIN_CLINICA', 'SUPERADMIN', 'SECRETARIA'] },
    { id: 'recepcion', label: 'Recepción & Espera', icon: UserCheck, badge: enEsperaCount > 0 ? `${enEsperaCount}` : null, badgeColor: 'bg-amber-500', roles: ['ADMIN_CLINICA', 'SUPERADMIN', 'SECRETARIA'] },
    { id: 'doctor', label: 'Portal Consultorio', icon: Stethoscope, badge: enEsperaCount > 0 ? `${enEsperaCount}` : null, badgeColor: 'bg-purple-600', roles: ['ADMIN_CLINICA', 'SUPERADMIN', 'PROFESIONAL'] },
    { id: 'caja', label: 'Caja Recaudadora', icon: Wallet, badge: 'Cobros', badgeColor: 'bg-emerald-600', roles: ['ADMIN_CLINICA', 'SUPERADMIN', 'SECRETARIA'] },
    { id: 'hce', label: 'Historia Clínica (HCE)', icon: FileText, badge: null, roles: ['ADMIN_CLINICA', 'SUPERADMIN', 'PROFESIONAL'] },
    { id: 'facturacion', label: 'Facturación & Obras Soc.', icon: DollarSign, badge: null, roles: ['ADMIN_CLINICA', 'SUPERADMIN'] },
    { id: 'admin', label: 'Configuración & ABM', icon: Settings, badge: null, roles: ['ADMIN_CLINICA', 'SUPERADMIN'] },
    { id: 'pacientes_abm', label: 'Pacientes', icon: Users, badge: pacientes?.length > 0 ? `${pacientes.length}` : null, badgeColor: 'bg-purple-600', roles: ['ADMIN_CLINICA', 'SUPERADMIN', 'SECRETARIA'] },
    { id: 'paciente', label: 'Turnero Pacientes', icon: Globe, badge: null, roles: ['ADMIN_CLINICA', 'SUPERADMIN', 'SECRETARIA'] }
  ];

  const userRole = currentUser?.rol || 'ADMIN_CLINICA';
  const navItems = allNavItems.filter(item => item.roles.includes(userRole));

  const handleNavClick = (itemId) => {
    if (itemId === 'pacientes_abm') {
      setCurrentView('pacientes');
    } else {
      setCurrentView(itemId);
    }
  };

  return (
    <aside
      className={`bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300 flex flex-col justify-between flex-shrink-0 z-30 shadow-xs ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* ITEMS DE NAVEGACIÓN */}
      <div className="p-3 space-y-1.5 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Menú Principal
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === 'pacientes_abm' 
            ? (currentView === 'pacientes' || (currentView === 'admin' && adminTab === 'pacientes'))
            : (currentView === item.id);

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              title={isCollapsed ? `${item.label}` : undefined}
              className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                isCollapsed ? 'justify-center px-0' : 'justify-between'
              } ${
                isActive
                  ? 'bg-medical-600 text-white font-black shadow-md shadow-medical-600/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                {!isCollapsed && (
                  <span className="truncate max-w-[130px]">{item.label}</span>
                )}
              </div>

              {!isCollapsed && item.badge && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full text-white ${
                  isActive ? 'bg-white/20' : (item.badgeColor || 'bg-slate-800')
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* BOTÓN COLAPSAR / EXPANDIR SIDEBAR */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 hidden sm:block">
        <button
          onClick={onToggleCollapse}
          className={`w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer ${
            isCollapsed ? 'justify-center' : 'justify-start'
          }`}
          title={isCollapsed ? "Expandir menú" : "Colapsar menú lateral"}
        >
          {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          {!isCollapsed && <span>Ocultar Barra</span>}
        </button>
      </div>
    </aside>
  );
};

