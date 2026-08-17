import React from 'react';
import { AlertTriangle, RefreshCw, Trash2, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    window.location.reload();
  };

  handleClearCacheAndReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = window.location.origin + window.location.pathname;
    } catch (e) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 max-w-xl w-full shadow-2xl text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/30 shadow-lg shadow-rose-950/40">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Se detectó una discrepancia en la pantalla
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                La aplicación encontró un error al renderizar la vista. Hemos protegido tus datos para que no se pierdan.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-left font-mono text-[11px] text-rose-300 max-h-36 overflow-y-auto">
                <span className="font-bold block mb-1">Detalle del Error:</span>
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-3 bg-medical-600 hover:bg-medical-500 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-sky-950/40 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recargar Pantalla</span>
              </button>

              <button
                onClick={this.handleClearCacheAndReset}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Limpiar Caché y Reiniciar</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
