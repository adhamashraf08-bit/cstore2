import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, LogOut, Shield, Eye } from 'lucide-react';

export function DashboardHeader() {
  const { user, role, signOut, isAdmin } = useAuth();

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Candy Shop Logo"
                className="w-full h-full object-contain drop-shadow-sm hover:scale-105 transition-transform cursor-pointer"
                onClick={() => window.location.href = '/dashboard'}
              />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">
                cstore
              </h1>
              <p className="text-sm text-muted-foreground">
                Premium Store Analytics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge
                variant={isAdmin ? 'default' : 'secondary'}
                className={isAdmin ? 'gradient-primary' : ''}
              >
                {isAdmin ? (
                  <>
                    <Shield className="w-3 h-3 mr-1" />
                    Admin
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3 mr-1" />
                    Viewer
                  </>
                )}
              </Badge>
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user?.email}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
