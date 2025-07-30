import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Calendar, Clock, AlertTriangle, AlertCircle } from 'lucide-react';

interface CreateOrderFormProps {
  user: any;
  onBack: () => void;
  onSuccess: () => void;
}

const CreateOrderForm = ({ user, onBack, onSuccess }: CreateOrderFormProps) => {
  const [formData, setFormData] = useState({
    materials: '',
    cost_center: '',
    deadline: '',
    urgency: 'normal',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const costCenters = [
    'Fazenda JFI',
    'Sítio 2 Meninos', 
    'Casa Felipe',
    'Casa Irineia',
    'Fazenda Palmeiras',
    'Fazenda Novo Horizonte',
    'Sítio Vale',
    'Quinta do Faia',
    'Sítio Varginha'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.materials || !formData.cost_center || !formData.deadline) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('orders')
        .insert([{
          engineer_id: user.id,
          engineer_name: user.name,
          materials: formData.materials,
          cost_center: formData.cost_center,
          deadline: formData.deadline,
          urgency: formData.urgency,
          status: 'pending',
        }]);

      if (error) throw error;

      toast({
        title: "Pedido criado!",
        description: "Seu pedido foi criado e está aguardando aprovação.",
      });

      setFormData({
        materials: '',
        cost_center: '',
        deadline: '',
        urgency: 'normal',
      });

      onSuccess();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar pedido. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Centro de Custo */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <MapPin className="w-4 h-4" />
            <span>Centro de Custo</span>
          </Label>
          <Select value={formData.cost_center} onValueChange={(value) => setFormData(prev => ({ ...prev, cost_center: value }))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {costCenters.map((center) => (
                <SelectItem key={center} value={center}>
                  {center}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Materiais Solicitados */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <Calendar className="w-4 h-4" />
            <span>Materiais Solicitados</span>
          </Label>
          <Textarea
            placeholder="Descreva os materiais necessários... Ex:&#10;- 50 sacos de cimento Portland&#10;- 10m³ de areia média&#10;- 5m³ de brita graduada&#10;- 200 tijolos cerâmicos furados"
            value={formData.materials}
            onChange={(e) => setFormData(prev => ({ ...prev, materials: e.target.value }))}
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Prazo para Compra */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <Calendar className="w-4 h-4" />
            <span>Prazo para Compra</span>
          </Label>
          <Input
            type="date"
            value={formData.deadline}
            onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
            min={new Date().toISOString().split('T')[0]}
            className="w-full"
          />
        </div>

        {/* Nível de Urgência */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <Clock className="w-4 h-4" />
            <span>Nível de Urgência</span>
          </Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={formData.urgency === 'normal' ? 'default' : 'outline'}
              onClick={() => setFormData(prev => ({ ...prev, urgency: 'normal' }))}
              className={`flex items-center justify-center space-x-2 h-16 ${
                formData.urgency === 'normal' 
                  ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200' 
                  : 'border-gray-300'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Normal</span>
            </Button>
            
            <Button
              type="button"
              variant={formData.urgency === 'low' ? 'default' : 'outline'}
              onClick={() => setFormData(prev => ({ ...prev, urgency: 'low' }))}
              className={`flex items-center justify-center space-x-2 h-16 ${
                formData.urgency === 'low' 
                  ? 'bg-yellow-100 border-yellow-300 text-yellow-700 hover:bg-yellow-200' 
                  : 'border-gray-300'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Média</span>
            </Button>
            
            <Button
              type="button"
              variant={formData.urgency === 'high' ? 'default' : 'outline'}
              onClick={() => setFormData(prev => ({ ...prev, urgency: 'high' }))}
              className={`flex items-center justify-center space-x-2 h-16 ${
                formData.urgency === 'high' 
                  ? 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200' 
                  : 'border-gray-300'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span>Alta</span>
            </Button>
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {isLoading ? 'Criando...' : 'Criar Pedido'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateOrderForm;