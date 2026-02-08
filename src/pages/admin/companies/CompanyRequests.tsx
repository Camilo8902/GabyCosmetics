import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  X, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  Download,
  Building2,
  Calendar,
  Mail,
  Phone
} from 'lucide-react';
import { useCompanyRequests, useApproveRequest, useRejectRequest, useRequestsStats } from '@/hooks/useCompanyRequests';
import type { CompanyRequest } from '@/hooks/useCompanyRequests';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const statusConfig = {
  pending: { 
    label: 'Pendiente', 
    icon: Clock, 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    iconColor: 'text-yellow-600'
  },
  approved: { 
    label: 'Aprobada', 
    icon: CheckCircle, 
    color: 'bg-green-100 text-green-800 border-green-200',
    iconColor: 'text-green-600'
  },
  rejected: { 
    label: 'Rechazada', 
    icon: XCircle, 
    color: 'bg-red-100 text-red-800 border-red-200',
    iconColor: 'text-red-600'
  },
};

export function CompanyRequests() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<CompanyRequest | null>(null);
  const [notes, setNotes] = useState('');
  const [showModal, setShowModal] = useState(false);

  const { data: requests, isLoading } = useCompanyRequests();
  const { data: stats } = useRequestsStats();
  const approveMutation = useApproveRequest();
  const rejectMutation = useRejectRequest();

  const filteredRequests = requests?.filter((request) => {
    const matchesFilter = filter === 'all' || request.status === filter;
    const matchesSearch = 
      request.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.owner_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  }) || [];

  const handleApprove = (request: CompanyRequest) => {
    approveMutation.mutate({ requestId: request.id, notes });
    setShowModal(false);
    setSelectedRequest(null);
    setNotes('');
  };

  const handleReject = (request: CompanyRequest) => {
    rejectMutation.mutate({ requestId: request.id, notes });
    setShowModal(false);
    setSelectedRequest(null);
    setNotes('');
  };

  const openActionModal = (request: CompanyRequest) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Vendedores</h1>
          <p className="text-gray-500">Gestiona las solicitudes para vender en GabyCosmetics</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Aprobadas</p>
              <p className="text-2xl font-bold text-green-600">{stats?.approved || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Rechazadas</p>
              <p className="text-2xl font-bold text-red-600">{stats?.rejected || 0}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o propietario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'Todas' : statusConfig[status as keyof typeof statusConfig]?.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Propietario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No hay solicitudes que coincidan con los filtros
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => {
                  const StatusIcon = statusConfig[request.status as keyof typeof statusConfig]?.icon || Clock;
                  const statusStyle = statusConfig[request.status as keyof typeof statusConfig];

                  return (
                    <motion.tr
                      key={request.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{request.business_name}</div>
                        {request.products_count && (
                          <div className="text-sm text-gray-500">{request.products_count} productos</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{request.owner_name}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            {request.email}
                          </div>
                          {request.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Phone className="w-4 h-4" />
                              {request.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                        {request.business_type || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusStyle.color}`}>
                          <StatusIcon className={`w-4 h-4 mr-1.5 ${statusStyle.iconColor}`} />
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDistanceToNow(new Date(request.created_at), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => openActionModal(request)}
                                className="p-2 text-green-500 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => openActionModal(request)}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRequest && !showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setSelectedRequest(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Detalles de la Solicitud</h2>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Status */}
                <div className="flex items-center gap-3">
                  {(() => {
                    const StatusIcon = statusConfig[selectedRequest.status as keyof typeof statusConfig]?.icon || Clock;
                    const statusStyle = statusConfig[selectedRequest.status as keyof typeof statusConfig];
                    return (
                      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${statusStyle.color}`}>
                        <StatusIcon className={`w-5 h-5 mr-2 ${statusStyle.iconColor}`} />
                        {statusStyle.label}
                      </span>
                    );
                  })()}
                </div>

                {/* Business Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Nombre de la Empresa</label>
                    <p className="text-gray-900 font-medium">{selectedRequest.business_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Propietario</label>
                    <p className="text-gray-900">{selectedRequest.owner_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                    <p className="text-gray-900">{selectedRequest.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Teléfono</label>
                    <p className="text-gray-900">{selectedRequest.phone || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Tipo de Negocio</label>
                    <p className="text-gray-900 capitalize">{selectedRequest.business_type || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Cantidad de Productos</label>
                    <p className="text-gray-900">{selectedRequest.products_count || '-'}</p>
                  </div>
                </div>

                {/* Message */}
                {selectedRequest.message && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Mensaje Adicional</label>
                    <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                      {selectedRequest.message}
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="flex gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Enviado: {new Date(selectedRequest.created_at).toLocaleDateString('es')}
                  </div>
                  {selectedRequest.reviewed_at && (
                    <div className="flex items-center gap-2">
                      Revisado: {new Date(selectedRequest.reviewed_at).toLocaleDateString('es')}
                    </div>
                  )}
                </div>

                {/* Notes */}
                {selectedRequest.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Notas</label>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-gray-700">
                      {selectedRequest.notes}
                    </div>
                  </div>
                )}
              </div>

              {selectedRequest.status === 'pending' && (
                <div className="p-6 border-t bg-gray-50 flex gap-4 justify-end">
                  <button
                    onClick={() => {
                      setShowModal(true);
                    }}
                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(true);
                    }}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Aprobar
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Modal */}
      <AnimatePresence>
        {showModal && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b">
                <h3 className="text-lg font-bold text-gray-900">Aprobar o Rechazar</h3>
                <p className="text-gray-500 text-sm">{selectedRequest.business_name}</p>
              </div>

              <div className="p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Agrega una nota para el vendedor..."
                />
              </div>

              <div className="p-6 border-t bg-gray-50 flex gap-4 justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleReject(selectedRequest)}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Rechazar
                </button>
                <button
                  onClick={() => handleApprove(selectedRequest)}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Aprobar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
