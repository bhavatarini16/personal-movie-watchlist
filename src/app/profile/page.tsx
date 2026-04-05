
"use client";

import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';
import { UserProfile, WatchlistEntry, SceneMemory } from '../lib/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Film, Star, Calendar, Sparkles, Loader2, Settings, History, LogOut, Video, Trophy, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MovieCard from '@/components/movie-card';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import GamificationStats from '@/components/gamification-stats';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [user, firestore]);
  const { data: profile } = useDoc<UserProfile>(userDocRef);

  const historyRef = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/watchlist`), where("isWatched", "==", true), limit(5));
  }, [user, firestore]);
  const { data: recentWatched } = useCollection<WatchlistEntry>(historyRef);

  const allWatchlistRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/watchlist`);
  }, [user, firestore]);
  const { data: entries } = useCollection<WatchlistEntry>(allWatchlistRef);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (isUserLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;

  if (!user) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full glass border-white/10 rounded-3xl p-12 text-center space-y-8 animate-fade-in">
          <Film className="w-16 h-16 text-primary mx-auto opacity-50" />
          <h1 className="text-3xl font-headline font-bold text-white">Join the Archives</h1>
          <Link href="/login" className="block w-full"><Button className="w-full bg-primary h-12 text-lg font-headline">Sign In</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen max-w-7xl mx-auto px-4 md:px-8 pb-16 space-y-12">
      <div className="glass border-white/5 p-8 md:p-12 rounded-3xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <Avatar className="w-32 h-32 md:w-48 md:h-48 border-4 border-white/10 shadow-2xl">
            <AvatarImage src={`https://picsum.photos/seed/${user.uid}/200`} />
            <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h1 className="text-5xl md:text-6xl font-headline font-bold text-white tracking-tighter uppercase">{profile?.username || user.email?.split('@')[0]}</h1>
              <p className="text-white/40 flex items-center justify-center md:justify-start gap-2 mt-1">
                <Calendar className="w-4 h-4" /> Member since {profile?.dateJoined ? new Date(profile.dateJoined).toLocaleDateString() : 'recent'}
              </p>
            </div>
            {profile?.personality && (
              <div className="inline-block p-4 bg-primary/10 border border-primary/20 rounded-2xl">
                <div className="flex items-center gap-2 mb-1"><Sparkles className="text-primary w-4 h-4" /><span className="text-xs font-bold text-primary uppercase tracking-widest">{profile.personality.type}</span></div>
                <p className="text-sm text-white/70 italic">"{profile.personality.description}"</p>
              </div>
            )}
            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
              {profile?.gamification?.badges.map(b => (
                <Badge key={b} className="bg-white/5 text-white/60 border-white/10 px-3 py-1 flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-yellow-500" /> {b}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4 min-w-[200px]">
            <div className="flex items-center justify-between p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20">
              <span className="text-xs font-bold uppercase text-orange-500 tracking-widest">Active Streak</span>
              <div className="flex items-center gap-2 text-2xl font-bold text-white">
                <Flame className="w-6 h-6 text-orange-500 animate-pulse" /> {profile?.gamification?.streak || 0}
              </div>
            </div>
            <Button variant="outline" className="glass border-red-500/20 text-red-500 hover:bg-red-500/10 h-12" onClick={handleSignOut}>Sign Out</Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-headline font-bold text-white uppercase tracking-widest">Global Pulse</h2>
        <GamificationStats profile={profile} entries={entries} />
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-headline font-bold text-white flex items-center gap-3 uppercase tracking-widest">
            <History className="w-6 h-6 text-primary" /> Cinematic History
          </h2>
          <Link href="/watchlist"><Button variant="ghost" className="text-white/40">View Full Ledger</Button></Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {recentWatched?.map(entry => (
            <MovieCard key={entry.id} movie={entry.movieData} />
          ))}
          {(!recentWatched || recentWatched.length === 0) && (
            <div className="col-span-full h-40 glass border-white/5 rounded-2xl flex items-center justify-center text-white/20 italic">No history recorded.</div>
          )}
        </div>
      </div>
    </div>
  );
}
