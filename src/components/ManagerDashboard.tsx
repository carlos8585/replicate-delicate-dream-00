import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Package, Clock, CheckCircle, LogOut, User, MapPin, Calendar, Eye, Users } from 'lucide-react';
import PendingApproval from './PendingApproval';

interface ManagerDashboardProps {
  user: any;
  onLogout: () => void;
}

const ManagerDashboard = ({ user, onLogout }: ManagerDashboardProps) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const fetchData = async () => {
    try {
      // Fetch all orders
      const { data: allOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch pending users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .is('role', null)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      setOrders(allOrders || []);
      setMyOrders((allOrders || []).filter(order => order.responsible_id === user.id && order.status !== 'delivered'));
      setAvailableOrders((allOrders || []).filter(order => !order.responsible_id && order.status === 'pending'));
      setPendingUsers(users || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar dados.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStats = () => {
    const total = orders.length;
    const pending = orders.filter(order => order.status === 'pending').length;
    const myOrdersCount = myOrders.length;
    const inProgress = orders.filter(order => order.status === 'quoting' || order.status === 'purchased' || order.status === 'shipping').length;
    const delivered = orders.filter(order => order.status === 'delivered').length;
    
    return { total, pending, myOrdersCount, inProgress, delivered };
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'pending': return 1;
      case 'quoting': return 2;
      case 'purchased': return 3;
      case 'shipping': return 4;
      case 'delivered': return 5;
      default: return 1;
    }
  };

  const getNextStatus = (status: string) => {
    switch (status) {
      case 'pending': return 'quoting';
      case 'quoting': return 'purchased';
      case 'purchased': return 'shipping';
      case 'shipping': return 'delivered';
      default: return status;
    }
  };

  const getNextStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Em Cotação';
      case 'quoting': return 'Comprado';
      case 'purchased': return 'Saiu para Entrega';
      case 'shipping': return 'Entregue/Recebido';
      default: return '';
    }
  };

  const assumeOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          responsible_id: user.id,
          responsible_name: user.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Pedido assumido!",
        description: "Você agora é responsável por este pedido.",
      });

      fetchData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao assumir pedido.",
        variant: "destructive",
      });
    }
  };

  const advanceOrder = async (orderId: string, currentStatus: string) => {
    const nextStatus = getNextStatus(currentStatus);
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: nextStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Record the status change
      await supabase
        .from('order_updates')
        .insert([{
          order_id: orderId,
          previous_status: currentStatus,
          new_status: nextStatus,
          updated_by: user.id,
          updated_by_name: user.name
        }]);

      toast({
        title: "Status atualizado!",
        description: `Pedido avançado para: ${getNextStatusLabel(currentStatus)}`,
      });

      fetchData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status.",
        variant: "destructive",
      });
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'low': return 'Baixa';
      case 'normal': return 'Normal';
      case 'high': return 'Média';
      default: return 'Normal';
    }
  };

  const stats = getStats();

  if (activeTab === 'users') {
    return (
      <PendingApproval
        user={user}
        onLogout={onLogout}
        onBack={() => setActiveTab('available')}
      />
    );
  }

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
                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">Gestor</span>
              </div>
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Painel de Gestão</h2>
            <p className="text-gray-600">Gerencie todos os pedidos de materiais</p>
          </div>
          <Button 
            onClick={() => setActiveTab('users')}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Users className="w-4 h-4" />
            <span>Aprovar Usuários</span>
            {pendingUsers.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingUsers.length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                <p className="text-sm text-gray-600">Total</p>
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
              <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                <User className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.myOrdersCount}</p>
                <p className="text-sm text-gray-600">Meus Pedidos</p>
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available">
              Disponíveis ({availableOrders.length})
            </TabsTrigger>
            <TabsTrigger value="mine">
              Meus Pedidos ({myOrders.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              <Eye className="w-4 h-4 mr-2" />
              Painel Geral ({orders.length})
            </TabsTrigger>
          </TabsList>

          {/* Available Orders */}
          <TabsContent value="available" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <p>Carregando pedidos...</p>
              </div>
            ) : availableOrders.length === 0 ? (
              <Card className="p-8 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum pedido disponível</h3>
                <p className="text-gray-600">Todos os pedidos já foram assumidos.</p>
              </Card>
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
                {availableOrders.map((order) => (
                  <Card key={order.id} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge 
                        variant={order.urgency === 'high' ? 'destructive' : order.urgency === 'normal' ? 'secondary' : 'outline'} 
                        className="text-xs"
                      >
                        {getUrgencyLabel(order.urgency)}
                      </Badge>
                      <Badge variant="secondary">Pendente</Badge>
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
                    <div className="space-y-2 text-sm mb-4">
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
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-800 mb-1">Materiais:</p>
                      <p className="text-sm text-gray-600">{order.materials}</p>
                    </div>

                    <Button 
                      onClick={() => assumeOrder(order.id)}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      📋 Assumir Pedido
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Orders */}
          <TabsContent value="mine" className="space-y-4">
            {myOrders.length === 0 ? (
              <Card className="p-8 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum pedido assumido</h3>
                <p className="text-gray-600">Você ainda não assumiu nenhum pedido.</p>
              </Card>
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
                {myOrders.map((order) => (
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
                         order.status === 'quoting' ? 'Em Cotação' : 
                         order.status === 'purchased' ? 'Comprado' :
                         order.status === 'shipping' ? 'Saiu para Entrega' :
                         order.status === 'delivered' ? 'Entregue/Recebido' : 'Pendente'}
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
                    <div className="space-y-2 text-sm mb-4">
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
                      <div className="flex items-center text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        Responsável: {order.responsible_name}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-800 mb-1">Materiais:</p>
                      <p className="text-sm text-gray-600">{order.materials}</p>
                    </div>

                    {order.status !== 'delivered' && (
                      <Button 
                        onClick={() => advanceOrder(order.id, order.status)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        🔄 Avançar para: {getNextStatusLabel(order.status)}
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* All Orders (Panel Geral) */}
          <TabsContent value="all" className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-900">Painel Geral de Acompanhamento</h3>
                  <p className="text-sm text-blue-700">Visualize todos os pedidos do sistema, incluindo os assumidos por outros gestores</p>
                </div>
              </div>
            </div>

            {orders.length === 0 ? (
              <Card className="p-8 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum pedido encontrado</h3>
                <p className="text-gray-600">Ainda não há pedidos no sistema.</p>
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
                      <Badge 
                        variant={
                          order.status === 'delivered' ? 'default' :
                          order.status === 'pending' ? 'secondary' : 'outline'
                        }
                      >
                        {order.status === 'pending' ? 'Pendente' : 
                         order.status === 'quoting' ? 'Em Cotação' : 
                         order.status === 'purchased' ? 'Comprado' :
                         order.status === 'shipping' ? 'Saiu para Entrega' :
                         order.status === 'delivered' ? 'Entregue/Recebido' : 'Pendente'}
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
                                  ? order.status === 'delivered' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-400'
                              }`}
                            >
                              {step <= getStatusStep(order.status) && order.status === 'delivered' ? '✓' : step}
                            </div>
                            {step < 5 && (
                              <div 
                                className={`w-8 h-0.5 ${
                                  step < getStatusStep(order.status) 
                                    ? order.status === 'delivered' ? 'bg-green-600' : 'bg-blue-600'
                                    : 'bg-gray-200'
                                }`} 
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="space-y-2 text-sm mb-4">
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

                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-800 mb-1">Materiais:</p>
                      <p className="text-sm text-gray-600">{order.materials}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ManagerDashboard;