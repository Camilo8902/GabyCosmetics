import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  Check,
  X,
  Users,
  Mail,
  Phone,
  Calendar,
  Download,
  Edit,
  Trash2,
  MoreVertical,
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  Loader2,
  Plus,
  Settings,
} from 'lucide-react';
import { useCompanies, useCompanyRequests, useApproveRequest, useRejectRequest, useRequestsStats, useDeleteCompany, useToggleCompanyActive, useCompanyStats } from '@/hooks';
import { useGlobalMetrics } from '@/hooks/useGlobalMetrics';
import { cn } from '@/lib/utils';
import { formatDate, formatCurrency } from '@/utils/formatters';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Company } from '@/types';
import type { CompanyRequest } from '@/hooks/useCompanyRequests';
import toast from 'react-hot-toast';

// Tabs del módulo
type Tab = 'all' | 'pending' | 'approved' | 'suspended' | 'requests';

// Status config for requests
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

export function CompaniesListPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [requestFilter, setRequestFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedRequest, setSelectedRequest] = useState<CompanyRequest | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [notes, setNotes] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const { data: companiesData, isLoading: companiesLoading } = useCompanies({}, page, 20);
  const { data: requestsData, isLoading: requestsLoading } = useCompanyRequests();
  const { data: requestsStats } = useRequestsStats();
  const { data: metrics } = useGlobalMetrics();
  const approveMutation = useApproveRequest();
  const rejectMutation = useRejectRequest();
  const deleteCompany = useDeleteCompany();
  const toggleActive = useToggleCompanyActive();

  const isLoading = companiesLoading || requestsLoading;

  // Filtrar empresas según tab
  const filteredCompanies = companiesData?.data?.filter((company: Company) => {
    const matchesSearch = searchQuery
      ? company.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    if (!matchesSearch) return false;

    switch (activeTab) {
      case 'pending':
        return !company.is_active;
      case 'approved':
        return company.is_active && company.is_verified;
      case 'suspended':
        return !company.is_active;
      default:
        return true;
    }
  }) || [];

  // Filtrar solicitudes
  const filteredRequests = requestsData?.filter((request: CompanyRequest) => {
    const matchesFilter = requestFilter === 'all' || request.status === requestFilter;
    const matchesSearch = searchQuery
      ? request.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.owner_name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesFilter && matchesSearch;
  }) || [];

  // Contar por estado - usar datos reales
  const counts = {
    all: companiesData?.total || 0,
    pending: requestsStats?.pending || 0,
    approved: companiesData?.data?.filter((c: Company) => c.is_active && c.is_verified).length || 0,
    suspended: companiesData?.data?.filter((c: Company) => !c.is_active).length || 0,
    requests: requestsStats?.total || 0,
    approvedRequests: requestsStats?.approved || 0,
    rejectedRequests: requestsStats?.rejected || 0,
  };

  // Handlers para solicitudes
  const handleApprove = (request: CompanyRequest) => {
    approveMutation.mutate({ requestId: request.id, notes });
    setShowActionModal(false);
    setSelectedRequest(null);
    setNotes('');
  };

  const handleReject = (request: CompanyRequest) => {
    rejectMutation.mutate({ requestId: request.id, notes });
    setShowActionModal(false);
    setSelectedRequest(null);
    setNotes('');
  };

  const openActionModal = (request: CompanyRequest, type: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(type);
    setShowActionModal(true);
  };

  // Handlers para empresas
  const handleToggleActive = async (company: Company) => {
    try {
      await toggleActive.mutateAsync({ id: company.id, isActive: !company.is_active });
    } catch (error) {
      console.error('Error toggling company status:', error);
    }
    setActionMenuId(null);
  };

  const handleDelete = async () => {
    if (!selectedCompany) return;
    try {
      await deleteCompany.mutateAsync(selectedCompany.id);
      setShowDeleteModal(false);
      setSelectedCompany(null);
    } catch (error) {
      console.error('Error deleting company:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Empresas</h1>
          <p className="text-gray-500">Administra empresas afiliadas y solicitudes de registro</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Building2 className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{counts.all}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md"
          onClick={() => setActiveTab('requests')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{counts.pending}</p>
              <p className="text-sm text-gray-500">Solicitudes</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{counts.approved}</p>
              <p className="text-sm text-gray-500">Activas</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{counts.suspended}</p>
              <p className="text-sm text-gray-500">Suspendidas</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{metrics?.totalUsers || 0}</p>
              <p className="text-sm text-gray-500">Usuarios</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs and Search */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'Empresas' },
              { key: 'requests', label: `Solicitudes (${counts.pending})` },
              { key: 'approved', label: 'Activas' },
              { key: 'suspended', label: 'Suspendidas' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as Tab);
                  setPage(1);
                }}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? 'bg-rose-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === 'requests' ? "Buscar solicitudes..." : "Buscar empresas..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'requests' ? (
        // REQUESTS TAB
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Request Filters */}
          <div className="flex gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setRequestFilter(status)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  requestFilter === status
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {status === 'all' ? 'Todas' : statusConfig[status]?.label}
              </button>
            ))}
          </div>

          {/* Requests Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Propietario</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredRequests.map((request: CompanyRequest) => {
                      const StatusIcon = statusConfig[request.status as keyof typeof statusConfig]?.icon || Clock;
                      const statusStyle = statusConfig[request.status as keyof typeof statusConfig];

                      return (
                        <tr key={request.id} className="hover:bg-gray-50">
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
                                    onClick={() => openActionModal(request, 'approve')}
                                    className="p-2 text-green-500 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                                  >
                                    <Check className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => openActionModal(request, 'reject')}
                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay solicitudes</h3>
                <p className="text-gray-500">No se encontraron solicitudes con los filtros actuales</p>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        // COMPANIES TAB
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm overflow-hidden"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredCompanies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Registro
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCompanies.map((company: Company) => (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                            {company.logo_url ? (
                              <img
                                src={company.logo_url}
                                alt={company.company_name || ''}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Building2 className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <Link
                              to={`/admin/companies/${company.id}`}
                              className="font-medium text-gray-900 hover:text-rose-600"
                            >
                              {company.company_name}
                            </Link>
                            {company.description && (
                              <p className="text-sm text-gray-500 line-clamp-1">
                                {company.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {company.phone && (
                          <p className="text-sm text-gray-500">{company.phone}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={cn(
                              'px-2 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1 w-fit',
                              company.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            )}
                          >
                            {company.is_active ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Activa
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                Inactiva
                              </>
                            )}
                          </span>
                          {company.is_verified && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 w-fit">
                              Verificada
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {formatDate(company.created_at)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/companies/${company.id}`}
                            className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/admin/companies/${company.id}/edit`}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleToggleActive(company)}
                            className={cn(
                              'p-2 rounded-lg transition-colors',
                              company.is_active
                                ? 'text-gray-500 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                            )}
                            title={company.is_active ? 'Suspender' : 'Activar'}
                          >
                            {company.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCompany(company);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No se encontraron empresas' : 'No hay empresas registradas'}
              </h3>
              <p className="text-gray-500">
                {searchQuery
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Las empresas aparecerán aquí cuando se registren'}
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link
          to="/admin/users"
          className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
        >
          <Users className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-medium text-blue-700">Usuarios de Empresas</p>
            <p className="text-sm text-blue-600">Gestionar accesos</p>
          </div>
        </Link>
        <Link
          to="/admin/reports"
          className="flex items-center gap-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
        >
          <Building2 className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-medium text-green-700">Reportes de Empresas</p>
            <p className="text-sm text-green-600">Ver métricas</p>
          </div>
        </Link>
        <Link
          to="/admin/orders"
          className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
        >
          <ShoppingCart className="w-5 h-5 text-purple-600" />
          <div>
            <p className="font-medium text-purple-700">Pedidos</p>
            <p className="text-sm text-purple-600">Ver todos los pedidos</p>
          </div>
        </Link>
      </div>

      {/* Request Detail Modal */}
      <AnimatePresence>
        {selectedRequest && !showActionModal && (
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
                    onClick={() => openActionModal(selectedRequest, 'reject')}
                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => openActionModal(selectedRequest, 'approve')}
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
        {showActionModal && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowActionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b">
                <h3 className="text-lg font-bold text-gray-900">
                  {actionType === 'approve' ? 'Aprobar Solicitud' : 'Rechazar Solicitud'}
                </h3>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  placeholder="Agrega una nota para el vendedor..."
                />
              </div>

              <div className="p-6 border-t bg-gray-50 flex gap-4 justify-end">
                <button
                  onClick={() => setShowActionModal(false)}
                  className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                {actionType === 'reject' ? (
                  <button
                    onClick={() => handleReject(selectedRequest)}
                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Rechazar
                  </button>
                ) : (
                  <button
                    onClick={() => handleApprove(selectedRequest)}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Aprobar
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Company Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedCompany && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Eliminar Empresa</h3>
                    <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <p className="text-gray-700">
                  ¿Estás seguro de que deseas eliminar la empresa <strong>{selectedCompany.company_name}</strong>?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  La empresa será desactivada y no aparecerá en el listado.
                </p>
              </div>

              <div className="p-6 border-t bg-gray-50 flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteCompany.isPending}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleteCompany.isPending ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
