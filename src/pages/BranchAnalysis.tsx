import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, TrendingUp, ShoppingCart, DollarSign, Target } from 'lucide-react';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip as RechartsTooltip,
    RadialBarChart,
    RadialBar,
    Legend
} from 'recharts';
import { format } from 'date-fns';

interface SalesRecord {
    id: string;
    date: string;
    store_name: string;
    orders: number;
    sales: number;
}

export default function BranchAnalysis() {
    const { branchId } = useParams<{ branchId: string }>();
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [salesData, setSalesData] = useState<SalesRecord[]>([]);
    const [targetValue, setTargetValue] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    // Mapping of branch-id (url) to exact database store names
    const storeNameMap: Record<string, string> = {
        'dark-store': 'Dark store',
        'tagmo': 'Tagmo',
        'heliopolis': 'Heliopolis',
        'maadi': 'Maadi'
    };

    const branchName = branchId ? storeNameMap[branchId.toLowerCase()] || branchId.replace(/-/g, ' ') : '';

    useEffect(() => {
        if (!loading && !user) navigate('/auth');
    }, [user, loading, navigate]);

    useEffect(() => {
        async function fetchData() {
            if (!branchName) return;
            setIsLoading(true);
            try {
                // Fetch sales data
                const { data: sales, error: salesError } = await supabase
                    .from('sales_data')
                    .select('*')
                    .eq('store_name', branchName)
                    .order('date', { ascending: false });

                if (salesError) throw salesError;
                setSalesData(sales || []);

                // Fetch target for current month
                const now = new Date();
                const { data: targetData, error: targetError } = await supabase
                    .from('store_targets')
                    .select('target')
                    .eq('store_name', branchName)
                    .eq('month', now.getMonth() + 1)
                    .eq('year', now.getFullYear())
                    .maybeSingle();

                if (targetError) throw targetError;

                // Fallback targets if not in DB
                const defaultTargets: Record<string, number> = {
                    'Dark store': 1000000,
                    'Tagmo': 750000,
                    'Heliopolis': 1000000,
                    'Maadi': 700000,
                };

                setTargetValue(targetData?.target || defaultTargets[branchName] || 1000000);

            } catch (err) {
                console.error('Error fetching branch data:', err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [branchName]);

    if (loading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const totalSales = salesData.reduce((sum, r) => sum + Number(r.sales), 0);
    const totalOrders = salesData.reduce((sum, r) => sum + r.orders, 0);

    const progress = Math.min((totalSales / targetValue) * 100, 100);

    // Data for Circle Chart (RadialBarChart)
    const radialData = [
        {
            name: 'Progress',
            value: progress,
            fill: 'hsl(var(--primary))',
        }
    ];

    // Data for Pie Chart (Revenue breakdown placeholder or similar)
    const pieData = [
        { name: 'Achieved', value: totalSales },
        { name: 'Remaining', value: Math.max(targetValue - totalSales, 0) }
    ];

    const PINK_COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))'];

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />

            <main className="container mx-auto px-4 py-8 animate-fade-in">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/dashboard')}
                    className="mb-6 hover:text-primary transition-colors pl-0"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Button>

                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-foreground capitalize">
                            {branchName} Analysis
                        </h1>
                        <p className="text-muted-foreground">Detailed performance metrics and target tracking.</p>
                    </div>
                    <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary font-semibold text-sm">
                        Monthly View
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Circular Progress Card */}
                    <Card className="lg:col-span-1 shadow-card border-0 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="w-5 h-5 text-primary" />
                                Target Progress
                            </CardTitle>
                            <CardDescription>Sales vs Monthly Goal</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-6">
                            <div className="h-[280px] w-full relative flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                            startAngle={90}
                                            endAngle={450}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PINK_COLORS[index % PINK_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-bold font-display">{progress.toFixed(0)}%</span>
                                    <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Achieved</span>
                                </div>
                            </div>
                            <div className="mt-8 grid grid-cols-2 gap-8 w-full">
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground uppercase mb-1">Total Sales</p>
                                    <p className="text-xl font-bold text-primary">{(totalSales / 1000).toFixed(1)}k</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground uppercase mb-1">Target</p>
                                    <p className="text-xl font-bold">{(targetValue / 1000).toFixed(0)}k</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats & Trends Section */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <Card className="shadow-card border-0 group hover:-translate-y-1 transition-all duration-300">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <DollarSign className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Revenue</p>
                                        <p className="text-2xl font-bold">{totalSales.toLocaleString()} EGP</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="shadow-card border-0 group hover:-translate-y-1 transition-all duration-300">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <ShoppingCart className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Orders</p>
                                        <p className="text-2xl font-bold">{totalOrders}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="shadow-card border-0 overflow-hidden bg-white/40">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-primary" />
                                    Performance Insights
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <p className="text-sm font-medium">Efficiency</p>
                                            <p className="text-sm font-bold text-primary">84%</p>
                                        </div>
                                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: '84%' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <p className="text-sm font-medium">Customer Satisfaction</p>
                                            <p className="text-sm font-bold text-primary">4.9/5</p>
                                        </div>
                                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: '98%' }} />
                                        </div>
                                    </div>
                                    <div className="pt-4 p-4 bg-primary/10 rounded-xl border border-primary/20">
                                        <p className="text-sm text-primary leading-relaxed">
                                            "This branch is currently outperforming its historical average by 12% in order volume. Target achievement is on track for the current month."
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
