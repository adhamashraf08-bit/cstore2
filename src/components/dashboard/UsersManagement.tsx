import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { Users, Search, UserPlus, Mail, Calendar, Shield, Loader2 } from 'lucide-react';
import { format, subDays, startOfDay, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface UserProfile {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at: string | null;
    login_methods: string[] | null;
    role: string | null;
}

export function UsersManagement() {
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            // Fetch profiles
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('*');

            if (profilesError) throw profilesError;

            // Fetch roles
            const { data: rolesData, error: rolesError } = await supabase
                .from('user_roles')
                .select('user_id, role');

            if (rolesError) throw rolesError;

            const combinedData: UserProfile[] = (profilesData || []).map(profile => ({
                id: profile.id,
                email: profile.email,
                created_at: profile.created_at,
                last_sign_in_at: (profile as any).last_sign_in_at || null,
                login_methods: (profile as any).login_methods || null,
                role: rolesData?.find(r => r.user_id === profile.user_id)?.role || 'viewer'
            }));

            setProfiles(combinedData);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Prepare chart data (Last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return {
            date: format(date, 'MMM d'),
            fullDate: startOfDay(date),
            count: 0
        };
    });

    profiles.forEach(profile => {
        const signupDate = new Date(profile.created_at);
        const dayMatch = last7Days.find(day =>
            signupDate.getDate() === day.fullDate.getDate() &&
            signupDate.getMonth() === day.fullDate.getMonth() &&
            signupDate.getFullYear() === day.fullDate.getFullYear()
        );
        if (dayMatch) {
            dayMatch.count++;
        }
    });

    const filteredUsers = profiles.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" />
                        Users
                    </h2>
                    <p className="text-muted-foreground">Manage users and view signups over time.</p>
                </div>
                <div className="flex items-center gap-2 self-start md:self-auto">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchUsers}
                        disabled={isLoading}
                        className="hover:text-primary transition-colors"
                    >
                        <Loader2 className={cn("w-4 h-4", isLoading && "animate-spin")} />
                    </Button>
                    <Button className="gradient-primary shadow-lg">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add User
                    </Button>
                </div>
            </div>

            {/* Signups Chart */}
            <Card className="border-0 shadow-card bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle className="text-lg font-display">Signups</CardTitle>
                        <CardDescription>New user registrations</CardDescription>
                    </div>
                    <div className="bg-muted px-3 py-1 rounded-full text-xs font-medium">Last 7 days</div>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={last7Days} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    fontSize={12}
                                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    fontSize={12}
                                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--primary))', opacity: 0.1 }}
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        backdropFilter: 'blur(8px)',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                    }}
                                    labelStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                                    itemStyle={{ color: '#6366f1' }}
                                    formatter={(value) => [value, 'New Users']}
                                />
                                <Bar
                                    dataKey="count"
                                    radius={[6, 6, 0, 0]}
                                    animationDuration={1500}
                                >
                                    {last7Days.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={index === last7Days.length - 1 ? '#6366f1' : '#cbd5e1'}
                                            className="transition-all duration-300 hover:opacity-80"
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card className="border-0 shadow-card">
                <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-lg font-display">User Directory</CardTitle>
                        <CardDescription>View and manage individual users.</CardDescription>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-muted/50 border-0 focus-visible:ring-primary/30"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p>Loading user data...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Name / Email</th>
                                        <th className="px-6 py-4 font-medium">Role</th>
                                        <th className="px-6 py-4 font-medium">Login methods</th>
                                        <th className="px-6 py-4 font-medium">Last signed in</th>
                                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="group hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm",
                                                        user.role === 'admin' ? "bg-indigo-600" : "bg-pink-600"
                                                    )}>
                                                        {user.email.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                            {user.email}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">Joined {format(new Date(user.created_at), 'MMM d, yyyy')}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={cn(
                                                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold",
                                                    user.role === 'admin'
                                                        ? "bg-primary/10 text-primary border border-primary/20"
                                                        : "bg-muted text-muted-foreground"
                                                )}>
                                                    {user.role}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {(user.login_methods || ['Email']).map((method) => (
                                                        <span key={method} className="bg-muted px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                                            {method}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-foreground">
                                                {user.last_sign_in_at
                                                    ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true })
                                                    : 'Never'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="sm" className="hover:text-primary">
                                                    Manage
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                                No users found matching your search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                            <span className="bg-muted px-2 py-1 rounded">10 users per page</span>
                            <span>{filteredUsers.length} users found</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>Page 1 of 1</span>
                            <div className="flex gap-1">
                                <Button variant="outline" size="icon" className="w-8 h-8" disabled>
                                    <span className="sr-only">Previous page</span>
                                    <span aria-hidden="true">&lt;</span>
                                </Button>
                                <Button variant="outline" size="icon" className="w-8 h-8" disabled>
                                    <span className="sr-only">Next page</span>
                                    <span aria-hidden="true">&gt;</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
