
"use client";

import Image from 'next/image';
import { Star, Plus, Check, Clock, Trash2 } from 'lucide-react';
import { Movie } from '@/app/lib/types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface MovieCardProps {
  movie: Movie;
  onAction?: (id: string, action: 'watched' | 'watchlist' | 'remove') => void;
  variant?: 'grid' | 'featured';
}

export default function MovieCard({ movie, onAction, variant = 'grid' }: MovieCardProps) {
  return (
    <div className={cn(
      "group relative rounded-xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/20",
      variant === 'grid' ? "aspect-[2/3]" : "aspect-[16/9]"
    )}>
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
          {movie.tmdbRating}
        </Badge>
      </div>

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="text-lg font-headline font-bold text-white mb-1 line-clamp-1">{movie.title}</h3>
        <p className="text-xs text-white/60 mb-3 line-clamp-1">
          {movie.genres.join(' • ')}
        </p>
        
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {movie.status === 'watchlist' ? (
            <Button 
              size="sm" 
              className="flex-1 bg-primary hover:bg-primary/80 h-8"
              onClick={() => onAction?.(movie.id, 'watched')}
            >
              <Check className="w-4 h-4 mr-1" /> Watched
            </Button>
          ) : movie.status === 'none' ? (
            <Button 
              size="sm" 
              variant="secondary" 
              className="flex-1 glass border-white/10 hover:bg-white/20 h-8"
              onClick={() => onAction?.(movie.id, 'watchlist')}
            >
              <Plus className="w-4 h-4 mr-1" /> Watchlist
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="ghost" 
              className="flex-1 text-white/40 hover:text-red-500 h-8"
              onClick={() => onAction?.(movie.id, 'remove')}
            >
              <Trash2 className="w-4 h-4 mr-1" /> Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
