
"use client";

import { useState } from 'react';
import { smartMovieRecommendations, SmartMovieRecommendationsOutput } from '@/ai/flows/smart-movie-recommendations-flow';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { WatchlistEntry } from '../lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Loader2, PlayCircle, Info, RefreshCcw } from 'lucide-react';
import Image from 'next/image';

export default function RecommendationsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<SmartMovieRecommendationsOutput['recommendations'] | null>(null);

  const watchedRef = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/watchlist`), where("isWatched", "==", true));
  }, [user, firestore]);

  const { data: watchedEntries } = useCollection<WatchlistEntry>(watchedRef);

  const getRecommendations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const watched = watchedEntries?.map(e => ({
        title: e.movieData.title,
        genres: e.movieData.genres,
        rating: e.personalRating || 5
      })) || [];
      
      const result = await smartMovieRecommendations({
        watchedMovies: watched,
        favoriteGenres: ['Sci-Fi', 'Thriller'] // Could be fetched from profile
      });
      setRecommendations(result.recommendations);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 min-h-screen max-w-7xl mx-auto px-4 md:px-8 pb-16">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 animate-fade-in">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-white tracking-tight">FOR <span className="text-gradient">YOU</span></h1>
          <p className="text-white/60">Intelligent picks based on your unique cinematic pulse.</p>
        </div>
        <Button 
          size="lg"
          className="bg-primary hover:bg-primary/80 shadow-lg shadow-primary/20 h-12 px-8"
          onClick={getRecommendations}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : (recommendations ? <RefreshCcw className="w-5 h-5 mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />)}
          {recommendations ? "Regenerate" : "Get AI Picks"}
        </Button>
      </div>

      {!recommendations ? (
        <div className="h-[400px] glass border-white/5 rounded-3xl flex flex-col items-center justify-center text-center p-8 animate-fade-in">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20 shadow-2xl shadow-primary/10">
            <Sparkles className="text-primary w-10 h-10" />
          </div>
          <h2 className="text-2xl font-headline text-white mb-4">Let AI guide your next watch</h2>
          <p className="text-white/50 max-w-md mx-auto mb-8">
            Our neural engine analyzes your watch history and ratings to suggest hidden gems and blockbuster hits you'll actually love.
          </p>
          <Button 
            size="lg" 
            variant="outline" 
            className="glass border-primary/20 hover:bg-primary/10 text-primary h-12 px-12"
            onClick={getRecommendations}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Unlock My Suggestions"}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recommendations.map((rec, idx) => (
            <Card key={idx} className="glass border-white/5 group hover:border-primary/40 transition-all overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 150}ms` }}>
              <div className="aspect-video relative overflow-hidden">
                <Image 
                  src={`https://picsum.photos/seed/rec${idx + 20}/600/400`} 
                  alt={rec.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  data-ai-hint="movie scene"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-headline font-bold text-white line-clamp-1">{rec.title}</h3>
                </div>
              </div>
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-3 text-primary">
                  <Info className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm text-white/80 leading-relaxed italic">
                    "{rec.reason}"
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/10">Add to Watchlist</Button>
                  <Button size="icon" variant="ghost" className="text-primary hover:bg-primary/10"><PlayCircle className="w-6 h-6" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
