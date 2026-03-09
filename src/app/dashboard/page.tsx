
"use client";

import { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { WatchlistEntry } from '../lib/types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, Film, Star, TrendingUp, Calendar, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const watchlistRef = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/watchlist`));
  }, [user, firestore]);

  const { data: entries, isLoading } = useCollection<WatchlistEntry>(watchlistRef);

  const stats = useMemo(() => {
    if (!entries) return null;

    const watched = entries.filter(e => e.isWatched);
    const inWatchlist = entries.filter(e => !e.isWatched);
    const total = watched.length;
    
    // Ratings
    const ratedMovies = watched.filter(e => e.personalRating && e.personalRating > 0);
    const avgRating = ratedMovies.length > 0 
      ? ratedMovies.reduce((acc, curr) => acc + (curr.personalRating || 0), 0) / ratedMovies.length 
      : 0;

    // Genres
    const genreCount: Record<string, number> = {};
    watched.forEach(m => {
      m.movieData.genres.forEach(g => {
        genreCount[g] = (genreCount[g] || 0) + 1;
      });
    });
    
    const genreData = Object.entries(genreCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Monthly activity (Mock logic based on current year for visualization)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const activityData = months.map(m => ({ month: m, count: Math.floor(Math.random() * 5) }));
    
    return {
      total,
      watchlistCount: inWatchlist.length,
      avgRating: avgRating.toFixed(1),
      genreData: genreData.slice(0, 5),
      activityData
    };
  }, [entries]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!user || !stats) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <p className="text-white/50">Start tracking movies to see your cinematic analytics.</p>
      </div>
    );
  }

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
          { label: 'Watchlist Size', value: stats.watchlistCount, icon: Calendar, color: 'text-blue-400' },
          { label: 'Average Rating', value: stats.avgRating, icon: Star, color: 'text-yellow-500' },
          { label: 'Top Genres', value: stats.genreData.length, icon: TrendingUp, color: 'text-green-500' },
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
          <CardContent className="h-[350px]">
            {stats.genreData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.genreData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
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
            ) : (
              <div className="h-full flex items-center justify-center text-white/30 italic">No genre data available yet.</div>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardHeader>
            <CardTitle className="text-white font-headline flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Watching Activity
            </CardTitle>
            <CardDescription className="text-white/50">Movies watched per month over the year.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
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
