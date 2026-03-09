
"use client";

import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
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
  Sparkles 
} from 'lucide-react';
import { WatchlistEntry } from '../lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import RandomMoviePicker from '@/components/random-movie-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

export default function WatchlistPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

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

  // Safety filter to ensure we only render entries that have complete movieData
  const validEntries = entries?.filter(e => e.movieData) || [];
  
  const watchlist = validEntries.filter(e => !e.isWatched && new Date(e.movieData.releaseDate) <= new Date());
  const watched = validEntries.filter(e => e.isWatched);
  const upcoming = validEntries.filter(e => new Date(e.movieData.releaseDate) > new Date());
  const favorites = validEntries.filter(e => e.isFavorite);

  return (
    <div className="pt-24 min-h-screen max-w-7xl mx-auto px-4 md:px-8 pb-16 space-y-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-white tracking-tight">MY <span className="text-gradient">COLLECTION</span></h1>
          <p className="text-white/60">Organize your journey through cinema.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Tabs Column */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="watchlist" className="space-y-8">
            <TabsList className="glass border-white/5 p-1 h-14 w-full md:w-auto">
              <TabsTrigger value="watchlist" className="flex items-center gap-2 px-6 h-full data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                <Clock className="w-4 h-4" /> 
                <span>Queue ({watchlist.length})</span>
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="flex items-center gap-2 px-6 h-full data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all">
                <Bell className="w-4 h-4" /> 
                <span>Upcoming ({upcoming.length})</span>
              </TabsTrigger>
              <TabsTrigger value="watched" className="flex items-center gap-2 px-6 h-full data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                <CheckCircle2 className="w-4 h-4" /> 
                <span>Watched ({watched.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="watchlist" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              {watchlist.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {watchlist.map(entry => (
                    <MovieCard key={entry.id} movie={entry.movieData} />
                  ))}
                </div>
              ) : (
                <div className="h-64 glass border-white/5 rounded-2xl flex flex-col items-center justify-center text-white/30 italic">
                  <List className="w-12 h-12 mb-4 opacity-20" />
                  <p>Your queue is empty.</p>
                  <Link href="/" className="mt-4 text-primary hover:underline not-italic font-bold uppercase tracking-widest text-xs">Go discover movies</Link>
                </div>
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              {upcoming.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {upcoming.map(entry => (
                    <MovieCard key={entry.id} movie={entry.movieData} />
                  ))}
                </div>
              ) : (
                <div className="h-64 glass border-white/5 rounded-2xl flex flex-col items-center justify-center text-white/30 italic">
                  <Bell className="w-12 h-12 mb-4 opacity-20" />
                  <p>No upcoming releases tracked.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="watched" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
               {watched.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {watched.map(entry => (
                    <MovieCard key={entry.id} movie={entry.movieData} />
                  ))}
                </div>
              ) : (
                <div className="h-64 glass border-white/5 rounded-2xl flex flex-col items-center justify-center text-white/30 italic">
                  <CheckCircle2 className="w-12 h-12 mb-4 opacity-20" />
                  <p>You haven't marked any movies as watched yet.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Favorites Sidebar Column */}
        <aside className="lg:col-span-4 space-y-6">
          <Card className="glass border-primary/20 overflow-hidden sticky top-24">
            <CardHeader className="bg-primary/10 border-b border-white/5">
              <CardTitle className="text-xl font-headline flex items-center gap-3 text-white">
                <Heart className="w-5 h-5 text-primary fill-primary" /> 
                FAVORITES
                <Badge variant="secondary" className="ml-auto bg-primary/20 text-primary border-none text-[10px]">
                  {favorites.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-350px)]">
                <div className="p-6 space-y-6">
                  {favorites.length > 0 ? (
                    favorites.map(entry => (
                      <div key={entry.id} className="group relative flex gap-4 bg-white/5 rounded-xl p-3 border border-white/5 hover:border-primary/40 transition-all cursor-pointer">
                        <div className="relative w-20 aspect-[2/3] rounded-lg overflow-hidden shrink-0 shadow-lg">
                          {entry.movieData?.posterUrl && (
                            <Image 
                              src={entry.movieData.posterUrl} 
                              alt={entry.movieData.title || "Movie Poster"} 
                              fill 
                              className="object-cover" 
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                          <h4 className="text-white font-bold font-headline text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                            {entry.movieData?.title || "Unknown Title"}
                          </h4>
                          <div className="flex items-center gap-2 mt-2">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs text-white/40">{entry.movieData?.tmdbRating || "N/A"}</span>
                            {entry.movieData?.releaseDate && (
                              <span className="text-[10px] text-white/20 uppercase tracking-widest">
                                • {entry.movieData.releaseDate.split('-')[0]}
                              </span>
                            )}
                          </div>
                          <div className="mt-3 flex gap-2">
                             {entry.isWatched && <Badge variant="outline" className="text-[8px] border-green-500/30 text-green-500 py-0 px-2">Watched</Badge>}
                             <Badge variant="outline" className="text-[8px] border-white/10 text-white/40 py-0 px-2 uppercase">
                               {entry.movieData?.genres?.[0] || 'Film'}
                             </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center space-y-3 opacity-20">
                      <Heart className="w-10 h-10 mx-auto" />
                      <p className="text-xs font-bold uppercase tracking-[0.2em]">Archiving Love...</p>
                      <p className="text-[10px] italic">Mark movies as favorites to see them here.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          
          <div className="glass border-white/5 p-6 rounded-3xl space-y-2 text-center">
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-2 opacity-50" />
            <h4 className="text-sm font-headline text-white">Need a Suggestion?</h4>
            <p className="text-xs text-white/40">Our AI pulse engine can help you pick from your favorites.</p>
          </div>
        </aside>
      </div>

      <RandomMoviePicker />
    </div>
  );
}
