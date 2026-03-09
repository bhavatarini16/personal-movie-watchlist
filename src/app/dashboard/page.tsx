
"use client";

import { useMemo } from 'react';
import { MOCK_MOVIES } from '../lib/mock-data';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, Film, Star, TrendingUp, Calendar } from 'lucide-react';

export default function DashboardPage() {
  const watchedMovies = MOCK_MOVIES.filter(m => m.status === 'watched');
  
  const stats = useMemo(() => {
    const total = watchedMovies.length;
    const avgRating = watchedMovies.reduce((acc, curr) => acc + curr.rating, 0) / (total || 1);
    const genreCount: Record<string, number> = {};
    watchedMovies.forEach(m => m.genres.forEach(g => genreCount[g] = (genreCount[g] || 0) + 1));
    
    const genreData = Object.entries(genreCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    
    return {
      total,
      avgRating: avgRating.toFixed(1),
      genreData: genreData.slice(0, 5),
      activityData: [
        { month: 'Oct', count: 2 },
        { month: 'Nov', count: 1 },
        { month: 'Dec', count: 0 },
        { month: 'Jan', count: 0 },
        { month: 'Feb', count: 0 },
      ]
    };
  }, [watchedMovies]);

  const COLORS = ['#ff4d4d', '#cc3d3d', '#992d2d', '#661e1e', '#330f0f'];

  return (
    <div className="pt-24 min-h-screen max-w-7xl mx-auto px-4 md:px-8 pb-16 space-y-12">
      <div className="space-y-2 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-white tracking-tight">ANALYTICS <span className="text-gradient">HUB</span></h1>
        <p className="text-white/60">Your journey through cinema, by the numbers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Watched', value: stats.total, icon: Film, color: 'text-primary' },
          { label: 'Average Rating', value: stats.avgRating, icon: Star, color: 'text-yellow-500' },
          { label: 'Genres Explored', value: stats.genreData.length, icon: TrendingUp, color: 'text-blue-500' },
          { label: 'Monthly Goal', value: '4/8', icon: Calendar, color: 'text-purple-500' },
        ].map((item, idx) => (
          <Card key={idx} className="glass border-white/5 hover:border-primary/30 transition-all group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/50">{item.label}</p>
                  <h3 className="text-3xl font-bold text-white mt-1 group-hover:scale-105 transition-transform origin-left">{item.value}</h3>
                </div>
                <div className={`p-3 rounded-xl bg-white/5 ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="glass border-white/5">
          <CardHeader>
            <CardTitle className="text-white font-headline flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Genre Distribution
            </CardTitle>
            <CardDescription className="text-white/50">Your most watched movie categories.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.genreData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.genreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardHeader>
            <CardTitle className="text-white font-headline flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Monthly Activity
            </CardTitle>
            <CardDescription className="text-white/50">Movies watched per month over the last year.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.activityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" />
                <YAxis stroke="rgba(255,255,255,0.3)" />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#ff4d4d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
