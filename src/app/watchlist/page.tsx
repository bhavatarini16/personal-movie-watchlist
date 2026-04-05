
"use client";

import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import MovieCard from '@/components/movie-card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  List, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  PlayCircle, 
  Heart, 
  Bell, 
  Star, 
  Trophy
} from 'lucide-react';
import { WatchlistEntry, UserProfile } from '../lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import RandomMoviePicker from '@/components/random-movie-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import GamificationStats from '@/components/gamification-stats';

export default function WatchlistPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const profileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [user, firestore]);
  const { data: profile } = useDoc<UserProfile>(profileRef);

  const watchlistRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/watchlist`),
      orderBy("addedDate", "desc")
    );
  }, [user, firestore]);

  const { data: entries, isLoading: isDataLoading } = useCollection<WatchlistEntry>(watchlistRef);

  if (isUserLoading || isDataLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md glass border-white/5 p-12 rounded-3xl">
          <PlayCircle className="w-16 h-16 text-primary mx-auto opacity-50" />
          <h1 className="text-3xl font-headline font-bold text-white">Join the Cinema</h1>
          <p className="text-white/50">Sign in to start tracking your journey through film and get personalized analytics.</p>
          <Link href="/login">
            <Button className="w-full bg-primary h-12 text-lg font-headline uppercase tracking-widest">Get Started</Button>
          </Link>
        </div>
      </div>
    );
  }

  const validEntries = entries?.filter(e => e.movieData) || [];
  const watchlist = validEntries.filter(e => !e.isWatched);
  const watched = validEntries.filter(e => e.isWatched);
  const favorites = validEntries.filter(e => e.isFavorite);

  return (
    <div className="pt-24 min-h-screen max-w-7xl mx-auto px-4 md:px-8 pb-16 space-y-12">
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-5xl font-headline font-bold text-white tracking-tighter uppercase">MY <span className="text-gradient">LEDGER</span></h1>
            <p className="text-white/60">Architecting your cinematic history.</p>
          </div>
          <div className="w-full md:w-64 glass border-white/5 p-4 rounded-2xl">
             <GamificationStats profile={profile} entries={validEntries} variant="compact" />
          </div>
        </div>
        
        <GamificationStats profile={profile} entries={validEntries} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
          <Tabs defaultValue="watchlist" className="space-y-8">
            <TabsList className="glass border-white/5 p-1 h-14 w-full md:w-auto">
              <TabsTrigger value="watchlist" className="flex items-center gap-2 px-6 h-full data-[state=active]:bg-primary transition-all">
                <Clock className="w-4 h-4" /> 
                <span>Queue ({watchlist.length})</span>
              </TabsTrigger>
              <TabsTrigger value="watched" className="flex items-center gap-2 px-6 h-full data-[state=active]:bg-primary transition-all">
                <CheckCircle2 className="w-4 h-4" /> 
                <span>Experienced ({watched.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="watchlist" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {watchlist.map(entry => (
                  <MovieCard key={entry.id} movie={entry.movieData} />
                ))}
                {watchlist.length === 0 && (
                  <div className="col-span-full py-20 text-center opacity-30 italic">No movies in queue.</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="watched" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {watched.map(entry => (
                  <MovieCard key={entry.id} movie={entry.movieData} />
                ))}
                {watched.length === 0 && (
                  <div className="col-span-full py-20 text-center opacity-30 italic">You haven't watched any movies yet.</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="lg:col-span-4">
          <Card className="glass border-primary/20 sticky top-24 overflow-hidden">
            <CardHeader className="bg-primary/10 border-b border-white/5">
              <CardTitle className="text-xl font-headline flex items-center gap-3 text-white uppercase tracking-widest">
                <Heart className="w-5 h-5 text-primary fill-primary" /> 
                Elite Picks
                <Badge variant="secondary" className="ml-auto bg-primary/20 text-primary border-none">
                  {favorites.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="p-6 space-y-6">
                  {favorites.length > 0 ? (
                    favorites.map(entry => (
                      <div key={entry.id} className="flex gap-4 group cursor-pointer p-2 rounded-xl hover:bg-white/5 transition-colors">
                        <div className="relative w-16 aspect-[2/3] rounded-lg overflow-hidden shrink-0 shadow-xl">
                          <Image src={entry.movieData.posterUrl} alt={entry.movieData.title} fill className="object-cover" />
                        </div>
                        <div className="flex-1 py-1">
                          <h4 className="text-white font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                            {entry.movieData.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs text-white/40">{entry.movieData.tmdbRating}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center opacity-20 italic text-sm">No favorites tagged.</div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>
      </div>
      <RandomMoviePicker />
    </div>
  );
}
