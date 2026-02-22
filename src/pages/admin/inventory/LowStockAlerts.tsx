import { useState, useEffect } from 'react';
import { AlertTriangle, Check, X, Eye, Package, ArrowRight } from 'lucide-react';
import type { LowStockAlert } from '@/types';
import { getLowStockProducts } from '@/services/inventoryService';

interface LowStockAlertsProps {
  companyId?: string;
  maxItems?: number;
  showViewAll?: boolean;
}

export function LowStockAlerts({ 
  companyId, 
  maxItems = 5,
  showViewAll = true 
}: LowStockAlertsProps) {
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRead, setIsRead] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAlerts();
  }, [companyId]);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      const data = await getLowStockProducts(companyId);
      setAlerts(data);
    } catch (error) {
      console.error('Error loading low stock alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = (alertId: string) => {
    setIsRead(prev => new Set([...prev, alertId]));
  };

  const getStockPercentage = (current: number, threshold: number) => {
    return Math.min(100, Math.round((current / threshold) * 100));
  };

  const getStockStatus = (current: number, threshold: number) => {
    const percentage = getStockPercentage(current, threshold);
    if (percentage === 0) return 'critical';
    if (percentage <= 30) return 'critical';
    if (percentage <= 60) return 'warning';
    return 'ok';
  };

  const filteredAlerts = alerts.filter(alert => !isRead.has(alert.id));
  const displayAlerts = filteredAlerts.slice(0, maxItems);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (filteredAlerts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <Check className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="font-bold text-gray-900">Stock Saludable</h3>
        </div>
        <p className="text-gray-600 text-sm">
          Todos tus productos tienen stock adecuado.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Stock Bajo</h3>
              <p className="text-sm text-gray-600">
                {filteredAlerts.length} producto{filteredAlerts.length !== 1 ? 's' : ''} con stock bajo
              </p>
            </div>
          </div>
          {showViewAll && filteredAlerts.length > maxItems && (
            <button className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
              Ver todas
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Alerts List */}
      <div className="divide-y divide-gray-100">
        {displayAlerts.map((alert) => {
          const status = getStockStatus(alert.current_stock, alert.low_stock_threshold);
          const percentage = getStockPercentage(alert.current_stock, alert.low_stock_threshold);

          return (
            <div 
              key={alert.id} 
              className={`p-4 hover:bg-gray-50 transition-colors ${
                status === 'critical' ? 'bg-red-50/50' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Product Image */}
                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {alert.product_image ? (
                    <img 
                      src={alert.product_image} 
                      alt={alert.product_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900 truncate">
                        {alert.product_name}
                      </p>
                      {alert.variant_name && (
                        <p className="text-sm text-gray-500">{alert.variant_name}</p>
                      )}
                      <p className="text-xs text-gray-400">SKU: {alert.sku}</p>
                    </div>
                    <button
                      onClick={() => handleMarkAsRead(alert.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      title="Marcar como leída"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Stock Bar */}
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className={`font-medium ${
                        status === 'critical' ? 'text-red-600' : 
                        status === 'warning' ? 'text-amber-600' : 'text-green-600'
                      }`}>
                        {alert.current_stock} unidades
                      </span>
                      <span className="text-gray-500">Mínimo: {alert.low_stock_threshold}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          status === 'critical' ? 'bg-red-500' : 
                          status === 'warning' ? 'bg-amber-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {filteredAlerts.length > maxItems && (
        <div className="p-4 bg-gray-50 border-t">
          <button className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 font-medium">
            Ver {filteredAlerts.length - maxItems} alertas más
          </button>
        </div>
      )}
    </div>
  );
}

// Compact version for dashboard widgets
export function LowStockAlertsCompact({ companyId }: { companyId?: string }) {
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, [companyId]);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      const data = await getLowStockProducts(companyId);
      setAlerts(data);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
    );
  }

  const criticalCount = alerts.filter(a => a.current_stock === 0).length;
  const warningCount = alerts.length - criticalCount;

  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <Check className="w-5 h-5" />
        <span className="text-sm font-medium">Stock OK</span>
      </div>
    );
  }

  return (
    <button className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors">
      <AlertTriangle className="w-4 h-4" />
      <span className="text-sm font-medium">
        {criticalCount > 0 && `${criticalCount} críticos`}
        {criticalCount > 0 && warningCount > 0 && ', '}
        {warningCount > 0 && `${warningCount} bajos`}
      </span>
    </button>
  );
}
