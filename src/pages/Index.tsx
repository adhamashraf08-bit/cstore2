import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { BarChart3, ArrowRight, Shield, Eye, Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 gradient-primary opacity-5" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-success/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10 text-center px-4 max-w-2xl mx-auto animate-scale-in">
        {/* Logo */}
        <div className="mx-auto w-24 h-24 mb-8">
          <img
            src="/logo.png"
            alt="cstore logo"
            className="w-full h-full object-contain drop-shadow-xl"
          />
        </div>

        <h1 className="text-5xl md:text-6xl font-display font-bold text-foreground mb-4">
          cstore
        </h1>

        <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
          Track your store performance, manage sales data, and monitor targets all in one place.
        </p>

        {/* Role badges */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full hover:bg-primary/20 transition-all cursor-default group">
            <Shield className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-primary">Admin Access</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full hover:bg-muted/80 transition-all cursor-default group">
            <Eye className="w-4 h-4 text-muted-foreground group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-muted-foreground">Viewer Access</span>
          </div>
        </div>

        <Button
          size="lg"
          onClick={() => navigate('/auth')}
          className="gradient-primary hover:opacity-90 transition-opacity shadow-lg"
        >
          Get Started
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Index;
