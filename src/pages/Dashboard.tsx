import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { StorePerformance } from '@/components/dashboard/StorePerformance';
import { ExcelUploader } from '@/components/dashboard/ExcelUploader';
import { UsersManagement } from '@/components/dashboard/UsersManagement';
import { SalesTable } from '@/components/dashboard/SalesTable';
import { AIChatButton } from '@/components/dashboard/AIChatButton';
import { ShoppingCart, DollarSign, TrendingUp, Store, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface SalesRecord {
  id: string;
  date: string;
  store_name: string;
  orders: number;
  sales: number;
}

interface StoreTarget {
  store_name: string;
  target: number;
}

export default function Dashboard() {
  const { user, loading, isAdmin, role } = useAuth();
  const navigate = useNavigate();
  const [salesData, setSalesData] = useState<SalesRecord[]>([]);
  const [storeTargets, setStoreTargets] = useState<StoreTarget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: sales, error: salesError } = await supabase
        .from('sales_data')
        .select('*')
        .order('date', { ascending: false });

      if (salesError) throw salesError;
      setSalesData(sales || []);

      const { data: targets, error: targetsError } = await supabase
        .from('store_targets')
        .select('*');

      if (!targetsError && targets) {
        setStoreTargets(targets);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate statistics
  const totalSales = salesData.reduce((sum, r) => sum + Number(r.sales), 0);
  const totalOrders = salesData.reduce((sum, r) => sum + r.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  // Default targets based on the Excel file
  const defaultTargets: Record<string, number> = {
    'Dark store': 1000000,
    'Tagmo': 750000,
    'Heliopolis': 1000000,
    'Maadi': 700000,
  };

  // Calculate store performance
  const storePerformance = ['Dark store', 'Tagmo', 'Heliopolis', 'Maadi'].map((storeName) => {
    const storeData = salesData.filter((r) => r.store_name === storeName);
    const sales = storeData.reduce((sum, r) => sum + Number(r.sales), 0);
    const orders = storeData.reduce((sum, r) => sum + r.orders, 0);
    const target = storeTargets.find((t) => t.store_name === storeName)?.target || defaultTargets[storeName];
    const progress = target > 0 ? (sales / target) * 100 : 0;

    return {
      name: storeName,
      sales,
      orders,
      target,
      progress: Math.min(progress, 100),
    };
  });

  // Prepare chart data (daily aggregates)
  const chartData = Object.entries(
    salesData.reduce((acc, record) => {
      const dateKey = record.date;
      if (!acc[dateKey]) {
        acc[dateKey] = { sales: 0, orders: 0 };
      }
      acc[dateKey].sales += Number(record.sales);
      acc[dateKey].orders += record.orders;
      return acc;
    }, {} as Record<string, { sales: number; orders: number }>)
  )
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, values]) => ({
      date: format(new Date(date), 'MMM d'),
      sales: values.sales,
      orders: values.orders,
    }))
    .slice(-10);

  const totalTarget = Object.values(defaultTargets).reduce((sum, t) => sum + t, 0);
  const targetProgress = totalTarget > 0 ? ((totalSales / totalTarget) * 100).toFixed(0) : 0;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Sales"
            value={`${(totalSales / 1000).toFixed(0)}K EGP`}
            subtitle={`${targetProgress}% of monthly target`}
            icon={<DollarSign className="w-6 h-6 text-primary-foreground" />}
            variant="primary"
          />
          <StatsCard
            title="Total Orders"
            value={totalOrders}
            subtitle={`${salesData.length > 0 ? (totalOrders / (new Set(salesData.map(r => r.date)).size)).toFixed(0) : 0} avg/day`}
            icon={<ShoppingCart className="w-6 h-6 text-primary" />}
          />
          <StatsCard
            title="Avg Order Value"
            value={`${avgOrderValue.toFixed(0)} EGP`}
            icon={<TrendingUp className="w-6 h-6 text-success" />}
          />
          <StatsCard
            title="Active Stores"
            value={4}
            subtitle="All locations operational"
            icon={<Store className="w-6 h-6 text-info" />}
          />
        </div>

        {/* Charts and Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <SalesChart data={chartData} title="Sales Trend" type="area" />
          </div>
          <div>
            <StorePerformance stores={storePerformance} />
          </div>
        </div>

        {/* User Management Section (Admin Only) */}
        {isAdmin && (
          <div className="mb-12">
            <div className="h-px bg-border w-full mb-8" />
            <UsersManagement />
          </div>
        )}

        {/* Upload Section (Admin Only) and Recent Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isAdmin && (
            <ExcelUploader onUploadSuccess={fetchData} />
          )}
          <div className={isAdmin ? '' : 'lg:col-span-2'}>
            <SalesTable data={salesData} />
          </div>
        </div>

        {/* Waiting for role assignment message */}
        {role === null && !isLoading && (
          <div className="mt-8 p-4 bg-warning/10 border border-warning/20 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              Your account is pending role assignment. Please contact an administrator.
            </p>
          </div>
        )}
      </main>

      {/* AI Chat Assistant */}
      <AIChatButton
        dashboardContext={{
          totalSales,
          totalOrders,
          avgOrderValue,
          storePerformance,
          salesData,
        }}
      />
    </div>
  );
}
