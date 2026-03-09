
"use client";

import { useState } from 'react';
import { MOCK_MOVIES } from '../lib/mock-data';
import MovieCard from '@/components/movie-card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { List, CheckCircle2, Clock } from 'lucide-react';

export default function WatchlistPage() {
  const [movies, setMovies] = useState(MOCK_MOVIES);

  const watchlist = movies.filter(m => m.status === 'watchlist');
  const watched = movies.filter(m => m.status === 'watched');

  return (
    <div className="pt-24 min-h-screen max-w-7xl mx-auto px-4 md:px-8 pb-16">
      <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-12 animate-fade-in">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-white tracking-tight">MY <span className="text-gradient">COLLECTION</span></h1>
          <p className="text-white/60">Organize your journey through cinema.</p>
        </div>
      </div>

      <Tabs defaultValue="watchlist" className="space-y-8">
        <TabsList className="glass border-white/5 p-1 h-14 w-full md:w-auto">
          <TabsTrigger value="watchlist" className="flex items-center gap-2 px-6 h-full data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <Clock className="w-4 h-4" /> 
            <span>Watchlist ({watchlist.length})</span>
          </TabsTrigger>
          <TabsTrigger value="watched" className="flex items-center gap-2 px-6 h-full data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <CheckCircle2 className="w-4 h-4" /> 
            <span>Watched ({watched.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="watchlist" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {watchlist.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {watchlist.map(movie => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <div className="h-64 glass border-white/5 rounded-2xl flex flex-col items-center justify-center text-white/30 italic">
              <List className="w-12 h-12 mb-4 opacity-20" />
              Your watchlist is empty
            </div>
          )}
        </TabsContent>

        <TabsContent value="watched" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
           {watched.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {watched.map(movie => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <div className="h-64 glass border-white/5 rounded-2xl flex flex-col items-center justify-center text-white/30 italic">
              <CheckCircle2 className="w-12 h-12 mb-4 opacity-20" />
              You haven't marked any movies as watched yet
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
