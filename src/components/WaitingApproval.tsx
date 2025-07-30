import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, User, LogOut } from 'lucide-react';

interface WaitingApprovalProps {
  user: any;
  onLogout: () => void;
}

const WaitingApproval = ({ user, onLogout }: WaitingApprovalProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle>Aguardando Aprovação</CardTitle>
          <CardDescription>
            Sua conta foi criada com sucesso e está sendo analisada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span className="text-sm">{user?.name}</span>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                Um gestor irá revisar e aprovar sua conta em breve. 
                Você receberá um email quando sua conta estiver aprovada.
              </p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaitingApproval;