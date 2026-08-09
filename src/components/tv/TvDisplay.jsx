import React, { useState, useEffect } from 'react';
import { Tv, Volume2, Building2, Clock, User, DoorClosed } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TvDisplay = () => {
  const { clinica, tvCalls } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());

  const latestCall = tvCalls[0] || null;
  const previousCalls = tvCalls.slice(1, 6);

  // Reloj en tiempo real
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Chime sonoro con Web Audio API cuando entra un nuevo llamado
  useEffect(() => {
    if (latestCall) {
      playChime();
    }
  }, [latestCall?.id]);

  const playChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.setValueAtTime(880.00, ctx.currentTime + 0.3); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc1.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc1.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.log('Audio chime error:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-10 flex flex-col justify-between select-none">
      {/* Header TV */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-medical-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <Building2 className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">{clinica.nombre}</h1>
            <p className="text-sm font-semibold text-sky-400">Sala de Espera y Llamador de Pacientes</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-4xl font-black font-mono tracking-widest text-emerald-400">
            {currentTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            {currentTime.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </header>

      {/* Cuerpo Principal del Llamador */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 my-auto py-8">
        {/* LLAMADO PRINCIPAL (GRANDE) */}
        <div className="lg:col-span-2 bg-gradient-to-b from-slate-900 to-slate-900/90 border-2 border-medical-500/50 rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-medical-500 via-sky-400 to-tealmed-400 animate-pulse" />

          <span className="px-4 py-1.5 bg-medical-500/20 text-medical-300 border border-medical-500/40 rounded-full text-sm font-black uppercase tracking-widest mb-6 animate-bounce">
            Llamando a Consulta
          </span>

          {latestCall ? (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Paciente</span>
                <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none text-balance">
                  {latestCall.paciente_nombre}
                </h2>
                <span className="inline-block font-mono text-lg font-bold text-sky-400 bg-slate-800 px-4 py-1 rounded-xl mt-3">
                  {latestCall.codigo_reserva}
                </span>
              </div>

              <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-medical-600 rounded-2xl">
                    <DoorClosed className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-400 block uppercase">Dirigirse a</span>
                    <strong className="text-2xl sm:text-3xl font-black text-sky-300">{latestCall.consultorio}</strong>
                  </div>
                </div>

                <div className="text-left">
                  <span className="text-xs font-bold text-slate-400 block uppercase">Atendido por</span>
                  <strong className="text-xl sm:text-2xl font-bold text-white">{latestCall.medico}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 py-12">
              <Tv className="w-16 h-16 mx-auto mb-4 opacity-40" />
              <p className="text-xl font-extrabold text-slate-400">Sala de espera disponible</p>
              <p className="text-sm text-slate-600 mt-1">Los llamados aparecerán aquí automáticamente</p>
            </div>
          )}
        </div>

        {/* ÚLTIMOS LLAMADOS (HISTORIAL) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-3 mb-4">
              Llamados Recientes
            </h3>

            <div className="space-y-3">
              {previousCalls.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-6">Sin llamados previos</p>
              ) : (
                previousCalls.map((c) => (
                  <div key={c.id} className="p-3.5 bg-slate-800/60 border border-slate-700/50 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-200">{c.paciente_nombre}</h4>
                      <p className="text-xs text-sky-400 font-semibold">{c.consultorio}</p>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-400 bg-slate-900 px-2 py-1 rounded-lg">
                      {new Date(c.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-center">
            <button
              onClick={playChime}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto transition"
            >
              <Volume2 className="w-4 h-4" />
              <span>Probar Sonido de Timbre</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer TV */}
      <footer className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-500 font-semibold">
        <span>Por favor aguarde su llamado en la pantalla.</span>
        <span>{clinica.direccion} • Tel: {clinica.telefono}</span>
      </footer>
    </div>
  );
};
