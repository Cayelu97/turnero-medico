import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Shield, 
  KeyRound, 
  Stethoscope, 
  UserCheck, 
  Check, 
  X, 
  Lock, 
  Eye, 
  EyeOff, 
  Building2, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AbmUsuarios = () => {
  const { 
    users, 
    saveUser, 
    deleteUser, 
    profesionales, 
    allClinicas, 
    activeClinica,
    currentUser,
    showToast 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const initialForm = {
    id: null,
    nombre: '',
    email: '',
    password: '',
    rol: 'SECRETARIA', // 'ADMIN_CLINICA' | 'SECRETARIA' | 'PROFESIONAL'
    profesional_id: '',
    clinica_id: activeClinica?.id || '',
    activo: true
  };

  const [formData, setFormData] = useState(initialForm);

  const handleOpenModal = (user = null) => {
    if (user) {
      setFormData({
        ...user,
        password: user.password || ''
      });
    } else {
      setFormData({
        ...initialForm,
        clinica_id: activeClinica?.id || ''
      });
    }
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(initialForm);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.email.trim()) {
      showToast('Por favor complete el nombre y correo electrónico.', 'error');
      return;
    }

    if (!formData.id && !formData.password.trim()) {
      showToast('Debe asignar una contraseña para el nuevo usuario.', 'error');
      return;
    }

    if (formData.rol === 'PROFESIONAL' && !formData.profesional_id) {
      showToast('Debe vincular un profesional médico a este usuario.', 'error');
      return;
    }

    saveUser({
      ...formData,
      email: formData.email.trim().toLowerCase(),
      profesional_id: formData.rol === 'PROFESIONAL' ? formData.profesional_id : null
    });

    handleCloseModal();
  };

  const handleDelete = (user) => {
    if (user.id === currentUser?.id) {
      showToast('No puedes eliminar tu propio usuario actualmente en uso.', 'error');
      return;
    }
    if (window.confirm(`¿Está seguro de eliminar el usuario de "${user.nombre}"?`)) {
      deleteUser(user.id);
    }
  };

  // Filtrado de usuarios
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'TODOS' || u.rol === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER DE CONTROL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">ABM de Usuarios & Accesos por Rol</h2>
              <p className="text-xs text-slate-500">
                Gestione las credenciales del personal y vincule cada cuenta médica a su propio profesional
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-medical-600 hover:bg-medical-500 text-white rounded-2xl text-xs font-bold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo electrónico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-medical-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['TODOS', 'ADMIN_CLINICA', 'SECRETARIA', 'PROFESIONAL'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
                roleFilter === r
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {r === 'TODOS' ? 'Todos los Roles' :
               r === 'ADMIN_CLINICA' ? '👑 Administradores' :
               r === 'SECRETARIA' ? '👩‍💼 Secretaría' : '👨‍⚕️ Profesionales'}
            </button>
          ))}
        </div>
      </div>

      {/* LISTA / TABLA DE USUARIOS */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Usuario / Nombre</th>
                <th className="py-3.5 px-4">Email de Acceso</th>
                <th className="py-3.5 px-4">Rol del Sistema</th>
                <th className="py-3.5 px-4">Médico Vinculado</th>
                <th className="py-3.5 px-4">Sede / Centro</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No se encontraron usuarios registrados con esos criterios.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const linkedDoctor = profesionales.find(p => p.id === u.profesional_id);
                  const linkedClinica = allClinicas.find(c => c.id === u.clinica_id);

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white ${
                            u.rol === 'ADMIN_CLINICA' || u.rol === 'SUPERADMIN' ? 'bg-amber-500' :
                            u.rol === 'PROFESIONAL' ? 'bg-medical-600' : 'bg-slate-800'
                          }`}>
                            {u.rol === 'ADMIN_CLINICA' || u.rol === 'SUPERADMIN' ? <Shield className="w-4 h-4" /> :
                             u.rol === 'PROFESIONAL' ? <Stethoscope className="w-4 h-4" /> :
                             <UserCheck className="w-4 h-4" />}
                          </div>
                          <div>
                            <strong className="font-extrabold text-slate-900 block">{u.nombre}</strong>
                            {u.id === currentUser?.id && (
                              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                Tu sesión actual
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700 font-medium">
                        {u.email}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          u.rol === 'ADMIN_CLINICA' || u.rol === 'SUPERADMIN' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          u.rol === 'PROFESIONAL' ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                          'bg-sky-50 text-sky-800 border border-sky-200'
                        }`}>
                          {u.rol === 'ADMIN_CLINICA' || u.rol === 'SUPERADMIN' ? '👑 Admin' :
                           u.rol === 'PROFESIONAL' ? '👨‍⚕️ Profesional' : '👩‍💼 Secretaría'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {linkedDoctor ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: linkedDoctor.color_agenda || '#0284c7' }} />
                            <span className="font-bold text-slate-800">
                              Dr(a). {linkedDoctor.nombre} {linkedDoctor.apellido}
                            </span>
                          </div>
                        ) : u.rol === 'PROFESIONAL' ? (
                          <span className="text-[11px] text-amber-600 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Sin vincular
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">N/A (Personal General)</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {linkedClinica ? linkedClinica.nombre : 'Todas las Clínicas'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          u.activo !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {u.activo !== false ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenModal(u)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition"
                            title="Editar usuario y clave"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(u)}
                            disabled={u.id === currentUser?.id}
                            className={`p-1.5 rounded-lg transition ${
                              u.id === currentUser?.id
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'
                            }`}
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE ALTA / EDICIÓN DE USUARIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-medical-50 text-medical-700 rounded-2xl border border-medical-200">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">
                    {formData.id ? 'Editar Usuario & Permisos' : 'Nuevo Usuario del Sistema'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure los datos de acceso y el rol operativo</p>
                </div>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre y Apellido */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Nombre Completo / Cargo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: Dra. Sofía Ramírez o Recepcionista Turno Mañana"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-medical-500"
                />
              </div>

              {/* Email / Usuario */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Correo Electrónico / Usuario de Acceso <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="ej: sramirez@centrosanlucas.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-medical-500 font-mono"
                />
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  {formData.id ? 'Contraseña (dejar en blanco para no modificar)' : 'Contraseña de Acceso *'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!formData.id}
                    placeholder={formData.id ? '••••••••' : 'Ingrese clave segura'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-medical-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Rol del Sistema */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Rol y Nivel de Acceso <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    rol: e.target.value,
                    profesional_id: e.target.value === 'PROFESIONAL' ? formData.profesional_id : ''
                  })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-medical-500 font-bold"
                >
                  <option value="SECRETARIA">👩‍💼 Secretaría / Recepción (Agenda, Turnos, Sala de Espera y Llamador TV)</option>
                  <option value="PROFESIONAL">👨‍⚕️ Profesional Médico (Consultorio Propio, Llamar a TV, Historia Clínica)</option>
                  <option value="ADMIN_CLINICA">👑 Administrador del Centro (ABMs, Obras Sociales, Médicos y Facturación)</option>
                </select>
              </div>

              {/* VINCULACIÓN CON PROFESIONAL (Solo si rol === PROFESIONAL) */}
              {formData.rol === 'PROFESIONAL' && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                    <Stethoscope className="w-4 h-4 text-purple-600" />
                    <span>Vincular con Médico del Catálogo:</span>
                  </div>
                  <p className="text-[11px] text-purple-700">
                    Al vincular este usuario con el médico, cuando inicie sesión **solo verá sus propios turnos y pacientes asignados**.
                  </p>
                  <select
                    required
                    value={formData.profesional_id}
                    onChange={(e) => setFormData({ ...formData, profesional_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-purple-300 rounded-xl text-xs font-bold text-purple-950 focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">-- Seleccione el profesional correspondiente --</option>
                    {profesionales.map(p => (
                      <option key={p.id} value={p.id}>
                        Dr(a). {p.nombre} {p.apellido} — {p.especialidad} (Mat: {p.matricula || 'S/M'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sede / Clínica */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Sede / Centro Asignado</label>
                <select
                  value={formData.clinica_id}
                  onChange={(e) => setFormData({ ...formData, clinica_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-medical-500 font-medium"
                >
                  {allClinicas.map(c => (
                    <option key={c.id} value={c.id}>
                      🏥 {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Activo / Inactivo */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="user_activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="w-4 h-4 text-medical-600 rounded border-slate-300 focus:ring-medical-500"
                />
                <label htmlFor="user_activo" className="text-xs font-bold text-slate-700">
                  Usuario activo (puede iniciar sesión en el sistema)
                </label>
              </div>

              {/* BOTONES */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-medical-600 hover:bg-medical-500 text-white rounded-xl text-xs font-black shadow-md transition"
                >
                  {formData.id ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
