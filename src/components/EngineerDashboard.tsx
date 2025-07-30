import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Package, Plus, Clock, CheckCircle, XCircle, LogOut, User, MapPin, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import CreateOrderForm from './CreateOrderForm';
import Comments from './Comments';

interface EngineerDashboardProps {
  user: any;
  onLogout: () => void;
}

const EngineerDashboard = ({ user, onLogout }: EngineerDashboardProps) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, [user.id]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('engineer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar pedidos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStats = () => {
    const total = orders.length;
    const pending = orders.filter(order => order.status === 'pending').length;
    const inProgress = orders.filter(order => order.status === 'approved').length;
    const delivered = orders.filter(order => order.status === 'delivered').length;
    
    return { total, pending, inProgress, delivered };
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'pending': return 1;
      case 'approved': return 2;
      case 'in_progress': return 3;
      case 'ready': return 4;
      case 'delivered': return 5;
      default: return 1;
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'low': return 'Baixa';
      case 'normal': return 'Média';
      case 'high': return 'Alta';
      default: return 'Média';
    }
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-teal-600 rounded flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-800">Sistema de Pedidos</h1>
                <p className="text-sm text-gray-500">Materiais de Construção</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{user.name}</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">Engenheiro</span>
              </div>
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Title and Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Meus Pedidos</h2>
            <p className="text-gray-600">Gerencie suas solicitações de materiais</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Novo Pedido
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Pedido</DialogTitle>
              </DialogHeader>
              <CreateOrderForm
                user={user}
                onBack={() => setIsDialogOpen(false)}
                onSuccess={() => {
                  setIsDialogOpen(false);
                  fetchOrders();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                <p className="text-sm text-gray-600">Total de Pedidos</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.pending}</p>
                <p className="text-sm text-gray-600">Pendentes</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.inProgress}</p>
                <p className="text-sm text-gray-600">Em Andamento</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.delivered}</p>
                <p className="text-sm text-gray-600">Entregues</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="text-center py-8">
            <p>Carregando pedidos...</p>
          </div>
        ) : orders.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum pedido encontrado</h3>
            <p className="text-gray-600 mb-4">Você ainda não criou nenhum pedido de material.</p>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {orders.map((order) => (
              <Card key={order.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge 
                    variant={order.urgency === 'high' ? 'destructive' : order.urgency === 'normal' ? 'secondary' : 'outline'} 
                    className="text-xs"
                  >
                    {getUrgencyLabel(order.urgency)}
                  </Badge>
                  <Badge variant="secondary">
                    {order.status === 'pending' ? 'Pendente' : 
                     order.status === 'approved' ? 'Aprovado' : 
                     order.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                  </Badge>
                </div>

                {/* Status Steps */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Pendente</span>
                    <span>Em Cotação</span>
                    <span>Comprado</span>
                    <span>Saiu para Entrega</span>
                    <span>Entregue/Recebido</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((step) => (
                      <div key={step} className="flex items-center">
                        <div 
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            step <= getStatusStep(order.status) 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          {step}
                        </div>
                        {step < 5 && (
                          <div 
                            className={`w-8 h-0.5 ${
                              step < getStatusStep(order.status) 
                                ? 'bg-blue-600' 
                                : 'bg-gray-200'
                            }`} 
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {order.cost_center}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    Prazo: {new Date(order.deadline).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    Criado: {new Date(order.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  {order.responsible_name && (
                    <div className="flex items-center text-gray-600">
                      <User className="w-4 h-4 mr-2" />
                      Responsável: {order.responsible_name}
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-800 mb-1">Materiais:</p>
                  <p className="text-sm text-gray-600">{order.materials}</p>
                </div>

                {/* Comentários */}
                <Comments orderId={order.id} user={user} />
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EngineerDashboard;