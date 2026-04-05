
"use client";

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Flame, Trophy, CheckCircle2, TrendingUp, Sparkles, Popcorn } from 'lucide-react';
import { UserProfile, WatchlistEntry } from '@/app/lib/types';
import { cn } from '@/lib/utils';

interface GamificationStatsProps {
  profile: UserProfile | null;
  entries: WatchlistEntry[] | null;
  variant?: 'compact' | 'full';
}

export default function GamificationStats({ profile, entries, variant = 'full' }: GamificationStatsProps) {
  const stats = useMemo(() => {
    if (!entries) return { percent: 0, watched: 0, total: 0 };
    const watched = entries.filter(e => e.isWatched).length;
    const total = entries.length;
    const percent = total > 0 ? Math.round((watched / total) * 100) : 0;
    return { percent, watched, total };
  }, [entries]);

  const badges = profile?.gamification?.badges || [];
  const streak = profile?.gamification?.streak || 0;

  if (variant === 'compact') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-white/60">Completion</span>
          </div>
          <span className="text-sm font-bold text-white">{stats.percent}%</span>
        </div>
        <Progress value={stats.percent} className="h-2 bg-white/5" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="glass border-white/5 overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-white/40">Watchlist Progress</p>
              <h3 className="text-3xl font-bold text-white mt-1">{stats.percent}%</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-primary" />
            </div>
          </div>
          <Progress value={stats.percent} className="h-2 bg-white/5" />
          <p className="text-xs text-white/30">{stats.watched} of {stats.total} movies experienced</p>
        </CardContent>
      </Card>

      <Card className="glass border-white/5 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-white/40">Watch Streak</p>
              <h3 className="text-3xl font-bold text-white mt-1">{streak} Days</h3>
            </div>
            <div className={cn(
              "p-3 rounded-xl",
              streak > 0 ? "bg-orange-500/10 text-orange-500" : "bg-white/5 text-white/20"
            )}>
              <Flame className={cn("w-6 h-6", streak > 0 && "animate-pulse")} />
            </div>
          </div>
          <p className="text-xs text-white/30 mt-4">Keep the flame alive, watch daily!</p>
        </CardContent>
      </Card>

      <Card className="glass border-white/5 overflow-hidden">
        <CardContent className="p-6">
          <p className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-4">Unlocked Badges</p>
          <div className="flex flex-wrap gap-2">
            {badges.length > 0 ? (
              badges.map((badge, idx) => (
                <Badge key={idx} className="bg-primary/20 text-primary border-none flex items-center gap-1 py-1 px-3">
                  <Trophy className="w-3 h-3" /> {badge}
                </Badge>
              ))
            ) : (
              <p className="text-xs text-white/20 italic">No achievements yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
