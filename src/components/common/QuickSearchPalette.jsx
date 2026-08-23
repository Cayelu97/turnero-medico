import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  User, 
  Calendar, 
  Stethoscope, 
  DollarSign, 
  BookOpen, 
  FileText, 
  ShieldCheck, 
  Tv, 
  Layers, 
  Brain, 
  Clock, 
  ArrowRight, 
  X,
  Command
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateAR } from '../../utils/formatters';

export const QuickSearchPalette = ({ isOpen, onClose }) => {
  const { 
    pacientes, 
    profesionales, 
    turnos, 
    nomenclador, 
    comprobantesArca, 
    setCurrentView, 
    setAdminTab 
  } = useApp();

  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Listener para Ctrl+K o Esc
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  // Búsqueda de Pacientes
  const matchPacientes = q ? pacientes.filter(p => 
    `${p.nombre} ${p.apellido}`.toLowerCase().includes(q) ||
    p.dni.includes(q) ||
    p.telefono_whatsapp?.includes(q)
  ).slice(0, 4) : [];

  // Búsqueda de Profesionales
  const matchProfesionales = q ? profesionales.filter(p => 
    `${p.nombre} ${p.apellido}`.toLowerCase().includes(q) ||
    p.especialidad?.toLowerCase().includes(q) ||
    p.matricula_provincial?.toLowerCase().includes(q) ||
    p.matricula_nacional?.toLowerCase().includes(q)
  ).slice(0, 3) : [];

  // Búsqueda de Turnos
  const matchTurnos = q ? turnos.filter(t => 
    t.codigo_reserva?.toLowerCase().includes(q) ||
    t.numero_bono?.toLowerCase().includes(q)
  ).slice(0, 4) : [];

  // Búsqueda de Prácticas Nomenclador
  const matchPracticas = q ? nomenclador.filter(nom => 
    nom.codigo_pmo?.toLowerCase().includes(q) ||
    nom.descripcion?.toLowerCase().includes(q)
  ).slice(0, 4) : [];

  // Búsqueda de Comprobantes ARCA
  const matchArca = q ? (comprobantesArca || []).filter(c => 
    c.numero_completo?.toLowerCase().includes(q) ||
    c.cae?.includes(q) ||
    c.receptor?.nombre?.toLowerCase().includes(q)
  ).slice(0, 3) : [];

  // Acciones Rápidas
  const quickActions = [
    { label: 'Ir a Agenda de Secretaría', icon: Calendar, action: () => { setCurrentView('agenda'); onClose(); } },
    { label: 'Ir a Recepción & Turnos del Día', icon: Calendar, action: () => { setCurrentView('recepcion'); onClose(); } },
    { label: 'Ir a Portal de Consultorio Médico', icon: Stethoscope, action: () => { setCurrentView('doctor'); onClose(); } },
    { label: 'Ir a Caja Recaudadora & Cobros', icon: DollarSign, action: () => { setCurrentView('caja'); onClose(); } },
    { label: 'Ir a Historia Clínica Electrónica (HCE)', icon: FileText, action: () => { setCurrentView('hce'); onClose(); } },
    { label: 'Ir a Facturación & Obras Sociales', icon: DollarSign, action: () => { setCurrentView('facturacion'); onClose(); } },
    { label: 'Ir a Configuración & ABMs', icon: BookOpen, action: () => { setCurrentView('admin'); setAdminTab('profesionales'); onClose(); } },
    { label: 'Ir a Pantalla TV de Sala de Espera', icon: Tv, action: () => { setCurrentView('tv'); onClose(); } }
  ].filter(a => !q || a.label.toLowerCase().includes(q));

  const totalResults = matchPacientes.length + matchProfesionales.length + matchTurnos.length + matchPracticas.length + matchArca.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input de Búsqueda */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/80">
          <Search className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar pacientes por DNI/nombre, turnos por código, prácticas CPPC o facturas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-none text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] font-mono text-slate-500 font-bold shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Resultados */}
        <div className="overflow-y-auto p-4 space-y-4 text-xs divide-y divide-slate-100">
          
          {/* PACIENTES */}
          {matchPacientes.length > 0 && (
            <div className="space-y-1.5 pt-2 first:pt-0">
              <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">
                Pacientes ({matchPacientes.length})
              </span>
              {matchPacientes.map(pac => (
                <div 
                  key={pac.id}
                  onClick={() => {
                    setCurrentView('recepcion');
                    onClose();
                  }}
                  className="p-2.5 rounded-xl hover:bg-indigo-50/60 flex items-center justify-between cursor-pointer transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-slate-900 block">{pac.apellido}, {pac.nombre}</strong>
                      <span className="text-[11px] text-slate-400">DNI: {pac.dni} • Cel: {pac.telefono_whatsapp || 'S/D'}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          )}

          {/* PROFESIONALES */}
          {matchProfesionales.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider block">
                Profesionales & Especialistas ({matchProfesionales.length})
              </span>
              {matchProfesionales.map(prof => (
                <div 
                  key={prof.id}
                  onClick={() => {
                    setCurrentView('doctor');
                    onClose();
                  }}
                  className="p-2.5 rounded-xl hover:bg-purple-50/60 flex items-center justify-between cursor-pointer transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-slate-900 block">{prof.nombre} {prof.apellido}</strong>
                      <span className="text-[11px] text-slate-400">{prof.especialidad} • {prof.matricula_provincial || prof.matricula_nacional}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          )}

          {/* TURNOS */}
          {matchTurnos.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] font-black uppercase text-sky-700 tracking-wider block">
                Turnos & Reservas ({matchTurnos.length})
              </span>
              {matchTurnos.map(t => (
                <div 
                  key={t.id}
                  onClick={() => {
                    setCurrentView('recepcion');
                    onClose();
                  }}
                  className="p-2.5 rounded-xl hover:bg-sky-50/60 flex items-center justify-between cursor-pointer transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-slate-900 font-mono block">{t.codigo_reserva} ({t.estado})</strong>
                      <span className="text-[11px] text-slate-400">{formatDateAR(t.fecha)} {t.hora_inicio} hs</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          )}

          {/* NOMENCLADOR */}
          {matchPracticas.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider block">
                Nomenclador & Prestaciones ({matchPracticas.length})
              </span>
              {matchPracticas.map(nom => (
                <div 
                  key={nom.id}
                  onClick={() => {
                    setCurrentView('admin');
                    setAdminTab('nomenclador');
                    onClose();
                  }}
                  className="p-2.5 rounded-xl hover:bg-amber-50/60 flex items-center justify-between cursor-pointer transition"
                >
                  <div>
                    <strong className="text-slate-900 font-mono block">{nom.codigo_pmo} - {nom.descripcion}</strong>
                    <span className="text-[11px] text-slate-500 font-bold">${Number(nom.valor_particular || 0).toLocaleString('es-AR')}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          )}

          {/* COMPROBANTES ARCA */}
          {matchArca.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider block">
                Facturas ARCA AFIP ({matchArca.length})
              </span>
              {matchArca.map(cbte => (
                <div 
                  key={cbte.id}
                  onClick={() => {
                    setCurrentView('facturacion');
                    onClose();
                  }}
                  className="p-2.5 rounded-xl hover:bg-emerald-50/60 flex items-center justify-between cursor-pointer transition"
                >
                  <div>
                    <strong className="text-slate-900 font-mono block">{cbte.numero_completo} - {cbte.receptor?.nombre}</strong>
                    <span className="text-[11px] text-emerald-700 font-mono font-bold">CAE: {cbte.cae} • ${Number(cbte.importe_total || 0).toLocaleString('es-AR')}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          )}

          {/* NAVEGACIÓN RÁPIDA */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Accesos Rápidos del Sistema
            </span>
            {quickActions.map((qa, idx) => {
              const Icon = qa.icon;
              return (
                <div
                  key={idx}
                  onClick={qa.action}
                  className="p-2.5 rounded-xl hover:bg-slate-100 flex items-center justify-between cursor-pointer transition font-bold text-slate-700"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-slate-500" />
                    <span>{qa.label}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Usa <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono font-bold text-slate-600">Ctrl + K</kbd> en cualquier momento para abrir esta búsqueda universal</span>
          <span>Antigravity Medical 2.0</span>
        </div>
      </div>
    </div>
  );
};
