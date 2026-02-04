import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { DollarSign, Users, TrendingUp, Target } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CRMLayout from "@/components/CRMLayout";

const COLORS = ['#9b87f5', '#6366f1', '#8b5cf6', '#a855f7'];

export default function CRMDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Fetch deals data
  const { data: dealsData } = useQuery({
    queryKey: ['crm-deals', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const query = supabase
        .from('deals')
        .select('*')
        .eq('user_id', user.id);
      
      if (isAdmin) {
        // Admins can see all deals
        const { data } = await supabase.from('deals').select('*');
        return data;
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Calculate metrics - use new stages: lead, client, under-contract, closed, lost
  const totalRevenue = dealsData?.reduce((sum, deal) => {
    if (deal.stage === 'closed') {
      // Use commission if available (this is the calculated dollar amount from percentage)
      const revenue = deal.commission;
      if (revenue) {
        return sum + Number(revenue);
      }
    }
    return sum;
  }, 0) || 0;

  const activeLeads = dealsData?.filter(deal => 
    ['lead', 'client', 'under-contract'].includes(deal.stage)
  ).length || 0;

  const totalDeals = dealsData?.length || 0;
  const closedDeals = dealsData?.filter(deal => deal.stage === 'closed').length || 0;
  const lostDeals = dealsData?.filter(deal => deal.stage === 'lost').length || 0;
  const conversionRate = (closedDeals + lostDeals) > 0 
    ? ((closedDeals / (closedDeals + lostDeals)) * 100).toFixed(1) 
    : '0';

  // Prepare chart data with new stages
  const stageData = dealsData?.reduce((acc, deal) => {
    acc[deal.stage] = (acc[deal.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const chartData = [
    { name: 'Lead', value: stageData['lead'] || 0 },
    { name: 'Client', value: stageData['client'] || 0 },
    { name: 'Under Contract', value: stageData['under-contract'] || 0 },
    { name: 'Closed', value: stageData['closed'] || 0 },
    { name: 'Lost', value: stageData['lost'] || 0 },
  ];

  const revenueData = dealsData?.filter(deal => {
    if (deal.stage !== 'closed') return false;
    const revenue = deal.commission;
    return revenue !== null && revenue !== undefined;
  })
    .map(deal => {
      const revenue = deal.commission || 0;
      return {
        name: deal.title.substring(0, 20) + (deal.title.length > 20 ? '...' : ''),
        value: Number(revenue),
      };
    })
    .slice(0, 10) || [];

  const pieData = [
    { name: 'Closed', value: closedDeals },
    { name: 'Lost', value: dealsData?.filter(deal => deal.stage === 'lost').length || 0 },
    { name: 'In Progress', value: activeLeads },
  ];

  if (loading) {
    return (
      <CRMLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </CRMLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <CRMLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            CRM Dashboard
          </h1>
          <p className="text-gray-600">
            Overview of your sales pipeline and performance
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                From closed deals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Leads
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeLeads}
              </div>
              <p className="text-xs text-muted-foreground">
                In pipeline
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Conversion Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {conversionRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                Win rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Deals
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalDeals}
              </div>
              <p className="text-xs text-muted-foreground">
                All time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Deals by Stage</CardTitle>
              <CardDescription>
                Distribution across pipeline stages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      color: '#000',
                    }}
                  />
                  <Bar dataKey="value" fill="#9b87f5" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deal Status</CardTitle>
              <CardDescription>
                Overview of deal outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      color: '#000',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        {revenueData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Deals Revenue</CardTitle>
              <CardDescription>
                Highest value closed deals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      color: '#000',
                    }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#9b87f5" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </CRMLayout>
  );
}
