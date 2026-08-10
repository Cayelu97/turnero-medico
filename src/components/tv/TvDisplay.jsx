import React, { useState, useEffect, useRef } from 'react';
import { Tv, Volume2, VolumeX, Building2, Clock, User, DoorClosed, Maximize2, Radio, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CloudSyncService } from '../../services/cloudSync';
import { StorageService } from '../../services/storage';

export const TvDisplay = () => {
  const { clinica } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tvCallsList, setTvCallsList] = useState(() => StorageService.getTvCalls());
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isNewCallFlashing, setIsNewCallFlashing] = useState(false);
  const lastCallIdRef = useRef(null);

  const latestCall = tvCallsList[0] || null;
  const previousCalls = tvCallsList.slice(1, 6);

  // Reloj en tiempo real
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. REPRODUCIR TIMBRE (Web Audio API)
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Oscilador 1 (Nota D5 587.33Hz)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc1.frequency.setValueAtTime(880.00, ctx.currentTime + 0.35); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 1.8);
      osc2.stop(ctx.currentTime + 1.8);
    } catch (e) {
      console.log('Audio chime error:', e);
    }
  };

  // 2. LOCUCIÓN POR VOZ (Text-To-Speech en Español)
  const speakCall = (call) => {
    if (!('speechSynthesis' in window) || !call) return;
    try {
      window.speechSynthesis.cancel(); // Cancelar locución anterior
      const text = `Paciente ${call.paciente_nombre}. Dirigirse a ${call.consultorio || 'Consultorio'}.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-AR';
      utterance.rate = 0.95; // Velocidad pausada y clara
      utterance.pitch = 1.0;

      // Buscar voz en español
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice = voices.find(v => v.lang.includes('es') || v.lang.includes('ES'));
      if (spanishVoice) utterance.voice = spanishVoice;

      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 700);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
    }
  };

  // Procesar nuevo llamado entrante (Efecto sonoro + Flash visual)
  const handleIncomingCall = (call) => {
    if (!call) return;
    
    // Actualizar lista
    const currentList = StorageService.getTvCalls();
    const exists = currentList.some(c => c.id === call.id);
    if (!exists) {
      const updated = [call, ...currentList].slice(0, 10);
      localStorage.setItem('mediturnos_tv_calls', JSON.stringify(updated));
      setTvCallsList(updated);
    } else {
      setTvCallsList(currentList);
    }

    // Disparar Chime y Locución
    playChime();
    speakCall(call);

    // Flash visual en pantalla
    setIsNewCallFlashing(true);
    setTimeout(() => setIsNewCallFlashing(false), 6000);
  };

  // 3. SUSCRIPCIÓN EN TIEMPO REAL VÍA SUPABASE WEBSOCKET
  useEffect(() => {
    const unsubscribe = CloudSyncService.subscribeTvCalls((incomingCall) => {
      console.log('🔔 [TV REALTIME] Nuevo llamado recibido:', incomingCall);
      handleIncomingCall(incomingCall);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 4. POLLING EN LA NUBE CADA 3 SEGUNDOS (Para Smart TVs donde WebSockets no esté soportado)
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const pullRes = await CloudSyncService.pullFromCloud();
        if (pullRes && pullRes.success) {
          const cloudCalls = StorageService.getTvCalls();
          if (cloudCalls.length > 0) {
            const firstCall = cloudCalls[0];
            if (firstCall && firstCall.id !== lastCallIdRef.current) {
              lastCallIdRef.current = firstCall.id;
              setTvCallsList(cloudCalls);
              handleIncomingCall(firstCall);
            }
          }
        }
      } catch (e) {
        // Silently retry
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, []);

  // Activar audio y pantalla completa
  const handleEnableAudioAndFullscreen = () => {
    setIsAudioEnabled(true);
    playChime();

    // Pantalla completa
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    }
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-white p-6 sm:p-10 flex flex-col justify-between select-none transition-colors duration-500 ${
      isNewCallFlashing ? 'bg-indigo-950' : 'bg-slate-950'
    }`}>
      
      {/* HEADER TV CON INDICADOR EN VIVO */}
      <header className="flex items-center justify-between border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-medical-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <Building2 className="w-9 h-9" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{clinica.nombre}</h1>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-black uppercase tracking-wider animate-pulse">
                <Radio className="w-3.5 h-3.5" />
                En Vivo (Nube)
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-sky-400">Sala de Espera & Llamador Institucional</p>
          </div>
        </div>

        {/* RELOJ DIGITAL Y BOTONES DE MANDO */}
        <div className="flex items-center gap-6">
          <button
            onClick={handleEnableAudioAndFullscreen}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-2 border shadow-lg cursor-pointer ${
              isAudioEnabled 
                ? 'bg-slate-800 text-slate-300 border-slate-700' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 animate-bounce'
            }`}
            title="Activar audio y pantalla completa en el Smart TV"
          >
            {isAudioEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-white" />}
            <span>{isAudioEnabled ? 'Sonido Activo' : 'Activar Sonido & Pantalla Completa'}</span>
          </button>

          <div className="text-right hidden sm:block">
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-emerald-400">
              {currentTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {currentTime.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </header>

      {/* CUERPO PRINCIPAL DEL LLAMADOR */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-6">
        
        {/* TARJETA GIGANTE DE LLAMADO ACTUAL (8 COLS) */}
        <div className={`lg:col-span-8 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 rounded-3xl p-8 sm:p-14 shadow-2xl flex flex-col justify-center items-center text-center relative overflow-hidden transition-all duration-300 ${
          isNewCallFlashing ? 'border-sky-400 ring-8 ring-sky-500/20 scale-[1.01]' : 'border-sky-500/30'
        }`}>
          <div className="absolute top-0 inset-x-0 h-2.5 bg-gradient-to-r from-medical-500 via-sky-400 to-indigo-500 animate-pulse" />

          <div className="inline-flex items-center gap-2 px-5 py-2 bg-sky-500/20 text-sky-300 border border-sky-500/40 rounded-full text-sm font-black uppercase tracking-widest mb-6">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Llamando a Consulta</span>
          </div>

          {latestCall ? (
            <div className="space-y-8 w-full max-w-2xl">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  Paciente
                </span>
                <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-none text-balance animate-scaleIn">
                  {latestCall.paciente_nombre}
                </h2>
                <div className="inline-block font-mono text-base sm:text-xl font-black text-sky-300 bg-slate-800/90 border border-slate-700 px-5 py-1.5 rounded-2xl mt-4 shadow-inner">
                  Turno: {latestCall.codigo_reserva}
                </div>
              </div>

              <div className="pt-8 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                <div className="flex items-center justify-center sm:justify-start gap-4 p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl">
                  <div className="p-3.5 bg-medical-600 rounded-2xl text-white shadow-md">
                    <DoorClosed className="w-9 h-9" />
                  </div>
                  <div className="text-left">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Presentarse en</span>
                    <strong className="text-2xl sm:text-3xl font-black text-sky-300">{latestCall.consultorio || 'Consultorio 1'}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-4 p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl text-left">
                  <div className="p-3.5 bg-indigo-600 rounded-2xl text-white shadow-md">
                    <User className="w-9 h-9" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Atendido por</span>
                    <strong className="text-lg sm:text-xl font-bold text-white block">{latestCall.medico || 'Médico Tratante'}</strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 py-16">
              <Tv className="w-20 h-20 mx-auto mb-4 opacity-30 animate-pulse" />
              <p className="text-2xl font-extrabold text-slate-300">Sala de Espera Disponible</p>
              <p className="text-sm text-slate-500 mt-1">Los llamados de los consultorios aparecerán aquí en vivo</p>
            </div>
          )}
        </div>

        {/* HISTORIAL DE LLAMADOS PREVIOS (4 COLS) */}
        <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Últimos Llamados
              </h3>
              <span className="text-[11px] font-bold text-slate-500">Historial</span>
            </div>

            <div className="space-y-2.5">
              {previousCalls.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-10">Sin llamados anteriores registrados</p>
              ) : (
                previousCalls.map((c) => (
                  <div key={c.id} className="p-3.5 bg-slate-800/60 border border-slate-700/50 rounded-2xl flex items-center justify-between shadow-2xs">
                    <div>
                      <h4 className="font-black text-sm text-slate-200">{c.paciente_nombre}</h4>
                      <p className="text-xs text-sky-400 font-semibold">{c.consultorio}</p>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-xl">
                      {new Date(c.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <button
              onClick={playChime}
              className="font-bold hover:text-white flex items-center gap-1.5 transition cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-sky-400" />
              <span>Probar Timbre</span>
            </button>
            <span className="font-mono text-[11px] text-slate-600">SaludNet TV Engine</span>
          </div>
        </div>
      </main>

      {/* FOOTER TV */}
      <footer className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-semibold gap-2">
        <span>Por favor tome asiento y aguarde a ser llamado en esta pantalla.</span>
        <span>{clinica.direccion} • Tel: {clinica.telefono}</span>
      </footer>
    </div>
  );
};
