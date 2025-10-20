import React, { useMemo } from 'react';
import { base44 } from "@/api";
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, TrendingUp, Users, Heart, MessageSquare, ShieldAlert, BarChart3, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { groupBy, countBy } from 'lodash';

const StatCard = ({ title, value, icon }) => {
    const Icon = icon;
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
};

const getFunnelStepCount = (events, users, stepType, distinctUsers) => {
    if (stepType === 'signUp') {
        const signUps = users.filter(u => new Date(u.created_date) >= subDays(new Date(), 7));
        signUps.forEach(u => distinctUsers.add(u.email));
        return distinctUsers.size;
    }
    const usersInStep = new Set();
    events.forEach(e => {
        if (e.type === stepType && distinctUsers.has(e.user_email)) {
            usersInStep.add(e.user_email);
        }
    });
    return usersInStep.size;
};

export default function AnalyticsDashboard() {
    const navigate = useNavigate();

    const { data: currentUser } = useQuery({
        queryKey: ['current-user'],
        queryFn: () => base44.auth.me(),
        onSuccess: (user) => {
            if (user?.role !== 'admin') {
                navigate(createPageUrl('Discover'));
                toast.error("Access Denied", { description: "You do not have permission to view this page." });
            }
        },
    });

    const { data: allUsers, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['all-users-admin-analytics'],
        queryFn: () => base44.entities.User.list(),
        enabled: !!currentUser && currentUser.role === 'admin',
    });

    const { data: events, isLoading: isLoadingEvents } = useQuery({
        queryKey: ['analytics-events-7d'],
        queryFn: () => base44.entities.AnalyticsEvents.filter({ created_date: { $gte: subDays(new Date(), 7).toISOString() } }),
        enabled: !!currentUser && currentUser.role === 'admin',
    });

    const analyticsData = useMemo(() => {
        if (!events || !allUsers) return null;

        // --- Funnel ---
        const signedUpUsers = new Set();
        const funnel = {
            signUp: getFunnelStepCount(events, allUsers, 'signUp', signedUpUsers),
            onboardingComplete: getFunnelStepCount(events, allUsers, 'onboardingComplete', signedUpUsers),
            firstLike: getFunnelStepCount(events, allUsers, 'likeSent', signedUpUsers),
            firstMatch: getFunnelStepCount(events, allUsers, 'matchCreated', signedUpUsers),
            firstMessage: getFunnelStepCount(events, allUsers, 'messageSent', signedUpUsers),
        };
        const funnelData = [
            { name: 'Sign Up', value: funnel.signUp, conversion: funnel.signUp > 0 ? 100 : 0 },
            { name: 'Onboarded', value: funnel.onboardingComplete, conversion: funnel.signUp > 0 ? (funnel.onboardingComplete / funnel.signUp * 100).toFixed(1) : 0 },
            { name: 'First Like', value: funnel.firstLike, conversion: funnel.signUp > 0 ? (funnel.firstLike / funnel.signUp * 100).toFixed(1) : 0 },
            { name: 'First Match', value: funnel.firstMatch, conversion: funnel.signUp > 0 ? (funnel.firstMatch / funnel.signUp * 100).toFixed(1) : 0 },
            { name: 'First Message', value: funnel.firstMessage, conversion: funnel.signUp > 0 ? (funnel.firstMessage / funnel.signUp * 100).toFixed(1) : 0 },
        ];

        // --- Daily Trends ---
        const eventsByDay = groupBy(events, 'day');
        const dailyTrends = Array.from({ length: 7 }).map((_, i) => {
            const date = subDays(new Date(), 6 - i);
            const day = format(date, 'yyyy-MM-dd');
            const dayEvents = eventsByDay[day] || [];
            return {
                name: format(date, 'MMM d'),
                DAU: new Set(dayEvents.map(e => e.user_email)).size,
                Matches: dayEvents.filter(e => e.type === 'matchCreated').length,
                Messages: dayEvents.filter(e => e.type === 'messageSent').length,
            };
        });

        // --- Safety Metrics ---
        const reportEvents = events.filter(e => e.type === 'reportSubmitted');
        const reportReasons = countBy(reportEvents, 'context.reason');
        const mostCommonReports = Object.entries(reportReasons).sort((a, b) => b[1] - a[1]).slice(0, 5);

        return { funnelData, dailyTrends, mostCommonReports, totalUsers: allUsers.length, totalEvents: events.length };
    }, [events, allUsers]);

    if (!currentUser || currentUser.role !== 'admin') {
        return <div className="h-screen w-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }
    
    if (isLoadingEvents || isLoadingUsers) {
        return <div className="h-screen w-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-rose-600" />
                        Analytics Dashboard
                    </h1>
                    <p className="text-gray-600 mt-1">Key metrics for YouDating platform health.</p>
                </header>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Total Users" value={analyticsData?.totalUsers || 0} icon={Users} />
                    <StatCard title="Total Events (7d)" value={analyticsData?.totalEvents || 0} icon={TrendingUp} />
                    <StatCard title="Matches (7d)" value={analyticsData?.dailyTrends.reduce((acc, cur) => acc + cur.Matches, 0) || 0} icon={Heart} />
                    <StatCard title="Messages (7d)" value={analyticsData?.dailyTrends.reduce((acc, cur) => acc + cur.Messages, 0) || 0} icon={MessageSquare} />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>7-Day Activation Funnel</CardTitle>
                        <CardDescription>How new users are moving through the signup and activation flow.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={analyticsData?.funnelData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip formatter={(value, name, props) => [`${value} users`, `Conversion: ${props.payload.conversion}%`]}/>
                                <Legend />
                                <Bar dataKey="value" fill="#fb7185" name="Users Reached" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Daily Trends (Last 7 Days)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analyticsData?.dailyTrends}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="DAU" stroke="#8884d8" name="Daily Active Users" />
                                <Line type="monotone" dataKey="Matches" stroke="#82ca9d" />
                                <Line type="monotone" dataKey="Messages" stroke="#ffc658" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Safety & Quality Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Report Reason</TableHead>
                                    <TableHead>Count (7d)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {analyticsData?.mostCommonReports.length > 0 ? analyticsData.mostCommonReports.map(([reason, count]) => (
                                    <TableRow key={reason}>
                                        <TableCell className="font-medium capitalize">{reason.replace(/_/g, ' ')}</TableCell>
                                        <TableCell>{count}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center">No reports in the last 7 days.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                 <Card className="bg-yellow-50 border-yellow-200">
                    <CardHeader className="flex-row items-start gap-3 space-y-0">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-1"/>
                        <div>
                            <CardTitle>Note on Metrics</CardTitle>
                            <CardDescription>
                                These metrics are calculated on the fly from raw event data. For larger-scale applications, a daily batch job to create rolled-up summaries (`AnalyticsDaily`) would be more performant.
                            </CardDescription>
                        </div>
                    </CardHeader>
                </Card>

            </div>
        </div>
    );
}