
"use client";

import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';
import { UserProfile, WatchlistEntry, SceneMemory } from '../lib/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Film, Star, Calendar, Sparkles, Loader2, Settings, History, LogOut, LogIn, Video, Quote, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MovieCard from '@/components/movie-card';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
    return query(
      collection(firestore, `users/${user.uid}/watchlist`),
      orderBy("watchDate", "desc"),
      limit(5)
    );
  }, [user, firestore]);

  const { data: recentWatched, isLoading: isHistoryLoading } = useCollection<WatchlistEntry>(historyRef);

  const sceneMemoriesRef = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/sceneMemories`),
      orderBy("addedDate", "desc"),
      limit(10)
    );
  }, [user, firestore]);

  const { data: sceneMemories } = useCollection<SceneMemory>(sceneMemoriesRef);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (isUserLoading || (user && isHistoryLoading)) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full glass border-white/10 rounded-3xl p-12 text-center space-y-8 animate-fade-in">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
            <Film className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-headline font-bold text-white">Join the Community</h1>
            <p className="text-white/50">Sign in to unlock personalized analytics, track your watch history, and find your cinematic personality.</p>
          </div>
          <Link href="/login" className="block w-full">
            <Button className="w-full bg-primary h-12 text-lg font-headline">
              <LogIn className="w-5 h-5 mr-2" /> Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen max-w-7xl mx-auto px-4 md:px-8 pb-16 space-y-12">
      {/* Profile Header */}
      <div className="relative group overflow-hidden rounded-3xl glass border-white/5 p-8 md:p-12">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-white/10 shadow-2xl">
              <AvatarImage src={profile?.avatarUrl || `https://picsum.photos/seed/${user.uid}/200`} />
              <AvatarFallback className="bg-primary text-4xl">{user.email?.[0].toUpperCase() || "G"}</AvatarFallback>
            </Avatar>
            <Button size="icon" variant="secondary" className="absolute bottom-1 right-1 rounded-full w-10 h-10 glass border-white/10">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-headline font-bold text-white tracking-tight">
                {profile?.username || user.email?.split('@')[0].toUpperCase() || "GUEST USER"}
              </h1>
              <p className="text-white/40 flex items-center justify-center md:justify-start gap-2">
                <Calendar className="w-4 h-4" /> Member since {profile?.dateJoined ? new Date(profile.dateJoined).toLocaleDateString() : 'recent'}
              </p>
            </div>

            {profile?.personality ? (
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 inline-block max-w-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="text-primary w-5 h-5" />
                  <span className="font-headline font-bold text-primary uppercase tracking-widest text-sm">
                    {profile.personality.type}
                  </span>
                </div>
                <p className="text-sm text-white/70 italic leading-relaxed">
                  "{profile.personality.description}"
                </p>
              </div>
            ) : (
              <Link href="/quiz">
                <Button variant="outline" className="glass border-primary/20 hover:bg-primary/10 text-primary">
                  <Sparkles className="w-4 h-4 mr-2" /> Take Cinema Identity Quiz
                </Button>
              </Link>
            )}
          </div>

          <div className="flex flex-col gap-4 w-full md:w-auto">
            <div className="grid grid-cols-2 gap-4">
              <Card className="glass border-white/5 bg-white/5">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-white/40 mb-1">Watched</p>
                  <p className="text-3xl font-bold text-white">42</p>
                </CardContent>
              </Card>
              <Card className="glass border-white/5 bg-white/5">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-white/40 mb-1">Avg Rating</p>
                  <p className="text-3xl font-bold text-white">8.4</p>
                </CardContent>
              </Card>
            </div>
            <Button variant="outline" className="glass border-red-500/20 text-red-500 hover:bg-red-500/10" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-12">
          {/* Recent History */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-headline font-bold text-white flex items-center gap-3">
                <History className="text-primary w-6 h-6" /> RECENTLY WATCHED
              </h2>
              <Link href="/watchlist">
                <Button variant="ghost" className="text-white/50 hover:text-white">View History</Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {recentWatched && recentWatched.length > 0 ? (
                recentWatched.map(entry => (
                  <MovieCard key={entry.id} movie={entry.movieData} />
                ))
              ) : (
                <div className="col-span-full h-40 glass border-white/5 rounded-2xl flex items-center justify-center text-white/30 italic">
                  No recent activity.
                </div>
              )}
            </div>
          </div>

          {/* Scene Memories Feed */}
          <div className="space-y-6">
            <h2 className="text-2xl font-headline font-bold text-white flex items-center gap-3">
              <Video className="text-primary w-6 h-6" /> SCENE MEMORIES
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {sceneMemories?.map(memory => (
                <Card key={memory.id} className="glass border-white/5 overflow-hidden group hover:border-white/20 transition-all">
                  <div className="flex flex-col md:flex-row">
                    <div className="relative w-full md:w-32 aspect-[2/3] shrink-0">
                       <Image src={memory.posterUrl} alt={memory.movieTitle} fill className="object-cover" />
                    </div>
                    <div className="p-6 flex-1 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-primary font-bold">{memory.movieTitle}</p>
                          <div className="flex items-center gap-2 text-white/40 text-xs mt-1">
                            <Clock className="w-3 h-3" />
                            <span>Timestamp: {memory.timestamp}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[8px] opacity-30">
                          {new Date(memory.addedDate).toLocaleDateString()}
                        </Badge>
                      </div>
                      
                      {memory.quote && (
                        <div className="relative pl-6">
                          <Quote className="absolute left-0 top-0 w-4 h-4 text-primary opacity-50" />
                          <p className="text-lg font-headline italic text-white/90">"{memory.quote}"</p>
                        </div>
                      )}
                      
                      {memory.note && (
                        <div className="flex gap-2 text-sm text-white/60 bg-white/5 p-4 rounded-xl border border-white/5 italic">
                          <StickyNote className="w-4 h-4 shrink-0 mt-0.5 opacity-50" />
                          <p>{memory.note}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
              {sceneMemories?.length === 0 && (
                 <div className="h-40 glass border-white/5 rounded-2xl flex flex-col items-center justify-center text-white/30 italic space-y-2">
                  <Video className="w-8 h-8 opacity-20" />
                  <p>No cinematic moments captured yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar stats/favs */}
        <div className="space-y-8">
          <Card className="glass border-white/5 overflow-hidden">
            <CardHeader className="bg-white/5">
              <CardTitle className="text-lg font-headline flex items-center gap-2">
                <Film className="w-5 h-5 text-primary" /> TOP GENRES
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {['Sci-Fi', 'Thriller', 'Drama'].map((genre, i) => (
                <div key={genre} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">{genre}</span>
                    <span className="text-primary font-bold">{85 - i * 15}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${85 - i * 15}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass border-white/5">
            <CardHeader className="bg-white/5">
              <CardTitle className="text-lg font-headline flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" /> FAV DIRECTORS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-2">
                {['Christopher Nolan', 'Denis Villeneuve', 'Greta Gerwig'].map(director => (
                  <Badge key={director} variant="secondary" className="glass border-white/10 px-3 py-1 text-xs">
                    {director}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
