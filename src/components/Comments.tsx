import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Send, User, Clock } from 'lucide-react';

interface CommentsProps {
  orderId: string;
  user: any;
}

const Comments = ({ orderId, user }: CommentsProps) => {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
  }, [orderId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert([{
          order_id: orderId,
          user_id: user.id,
          user_name: user.name,
          comment: newComment.trim(),
        }]);

      if (error) throw error;

      setNewComment('');
      fetchComments();
      
      toast({
        title: "Comentário adicionado!",
        description: "Seu comentário foi salvo com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar comentário.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5" />
          <span>Comentários</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de comentários */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Nenhum comentário ainda. Seja o primeiro a comentar!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium">{comment.user_name}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {new Date(comment.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <p className="text-sm text-gray-700">{comment.comment}</p>
              </div>
            ))
          )}
        </div>

        {/* Adicionar novo comentário */}
        <div className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Adicionar um comentário..."
            rows={3}
          />
          <Button 
            onClick={addComment}
            disabled={!newComment.trim() || isLoading}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {isLoading ? 'Enviando...' : 'Adicionar Comentário'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Comments;