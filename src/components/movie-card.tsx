
"use client";

import Image from 'next/image';
import { Star, Plus, Check, Info, Heart, Bell } from 'lucide-react';
import { Movie, WatchlistEntry } from '@/app/lib/types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useMemoFirebase, useCollection, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import MovieDetailsDialog from './movie-details-dialog';

interface MovieCardProps {
  movie: Movie;
  variant?: 'grid' | 'featured';
}

export default function MovieCard({ movie, variant = 'grid' }: MovieCardProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [detailsOpen, setDetailsOpen] = useState(false);

  const watchlistRef = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/watchlist`),
      where("movieId", "==", movie.tmdbId)
    );
  }, [user, movie.tmdbId, firestore]);

  const { data: watchlistEntries } = useCollection<WatchlistEntry>(watchlistRef);
  const entry = watchlistEntries?.[0];

  const isUpcoming = useMemo(() => {
    return new Date(movie.releaseDate) > new Date();
  }, [movie.releaseDate]);

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({ variant: "destructive", title: "Sign in required", description: "You need to be signed in to add movies." });
      return;
    }
    
    if (entry) {
      toast({ title: "Already in your collection" });
      return;
    }

    // Use setDocumentNonBlocking with tmdbId as the doc ID for readability in Console
    setDocumentNonBlocking(doc(firestore, `users/${user.uid}/watchlist/${movie.tmdbId}`), {
      id: movie.tmdbId,
      userId: user.uid,
      movieId: movie.tmdbId,
      movieData: movie,
      addedDate: new Date().toISOString(),
      isWatched: false,
      rewatchCount: 0,
      isFavorite: false,
      remindMe: isUpcoming,
    }, { merge: true });
    
    toast({ 
      title: isUpcoming ? "Reminder Set" : "Added to Queue", 
      description: isUpcoming ? `We'll alert you when ${movie.title} releases.` : `${movie.title} is now tracked.` 
    });
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({ variant: "destructive", title: "Sign in required" });
      return;
    }

    if (entry) {
      updateDocumentNonBlocking(doc(firestore, `users/${user.uid}/watchlist`, entry.id), {
        isFavorite: !entry.isFavorite
      });
      toast({ 
        title: !entry.isFavorite ? "Marked as Favorite" : "Removed from Favorites",
        description: movie.title 
      });
    } else {
      setDocumentNonBlocking(doc(firestore, `users/${user.uid}/watchlist/${movie.tmdbId}`), {
        id: movie.tmdbId,
        userId: user.uid,
        movieId: movie.tmdbId,
        movieData: movie,
        addedDate: new Date().toISOString(),
        isWatched: false,
        rewatchCount: 0,
        isFavorite: true,
        remindMe: isUpcoming,
      }, { merge: true });
      toast({ title: "Added to Favorites", description: `${movie.title} added to your queue.` });
    }
  };

  return (
    <>
      <div 
        onClick={() => setDetailsOpen(true)}
        className={cn(
          "group relative rounded-xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/20 cursor-pointer",
          variant === 'grid' ? "aspect-[2/3]" : "aspect-[16/9]"
        )}
      >
        <Image
          src={movie.posterUrl}
          alt={movie.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80" />
        
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-primary flex items-center gap-1 font-bold">
            <Star className="w-3 h-3 fill-primary" />
            {movie.tmdbRating || "N/A"}
          </Badge>
          {isUpcoming && (
            <Badge className="bg-blue-500/80 backdrop-blur-md text-white border-none font-bold">
              <Bell className="w-3 h-3 mr-1" /> SOON
            </Badge>
          )}
          {entry?.isWatched && (
            <Badge className="bg-green-500/80 backdrop-blur-md text-white border-none font-bold">
              <Check className="w-3 h-3 mr-1" /> WATCHED
            </Badge>
          )}
          {entry?.isFavorite && (
            <Badge className="bg-primary/80 backdrop-blur-md text-white border-none font-bold">
              <Heart className="w-3 h-3 mr-1 fill-white" /> FAV
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="text-lg font-headline font-bold text-white mb-1 line-clamp-1">{movie.title}</h3>
          <p className="text-xs text-white/60 mb-3 line-clamp-1">
            {movie.genres.join(' • ')}
          </p>
          
          <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                className={cn(
                  "flex-1 h-8 text-[10px] font-bold uppercase tracking-wider",
                  isUpcoming ? "bg-blue-600 hover:bg-blue-500" : "bg-primary hover:bg-primary/80"
                )}
                onClick={handleAddToQueue}
                disabled={!!entry}
              >
                {entry ? <Check className="w-3 h-3 mr-1" /> : (isUpcoming ? <Bell className="w-3 h-3 mr-1" /> : <Plus className="w-3 h-3 mr-1" />)}
                {entry ? "Tracked" : (isUpcoming ? "Remind Me" : "Queue")}
              </Button>
              <Button 
                size="sm" 
                variant={entry?.isFavorite ? "default" : "secondary"}
                className={cn(
                  "flex-1 h-8 text-[10px] font-bold uppercase tracking-wider",
                  !entry?.isFavorite && "glass border-white/10 hover:bg-white/20"
                )}
                onClick={handleToggleFavorite}
              >
                <Heart className={cn("w-3 h-3 mr-1", entry?.isFavorite && "fill-white")} />
                Fav
              </Button>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              className="w-full glass border-white/5 hover:bg-white/10 h-8 text-[10px] font-bold uppercase tracking-wider text-white/60"
              onClick={(e) => { e.stopPropagation(); setDetailsOpen(true); }}
            >
              <Info className="w-3 h-3 mr-1" /> Details
            </Button>
          </div>
        </div>
      </div>

      <MovieDetailsDialog 
        movie={movie} 
        isOpen={detailsOpen} 
        onClose={() => setDetailsOpen(false)} 
      />
    </>
  );
}
