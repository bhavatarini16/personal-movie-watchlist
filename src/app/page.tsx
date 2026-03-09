
"use client";

import { useState } from 'react';
import { Search, TrendingUp, Filter, PlayCircle } from 'lucide-react';
import { MOCK_MOVIES } from './lib/mock-data';
import MovieCard from '@/components/movie-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [search, setSearch] = useState('');
  const [movies, setMovies] = useState(MOCK_MOVIES);

  const filteredMovies = movies.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pt-16 min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/cine1/1920/1080')] bg-cover bg-center">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-6 animate-fade-in">
          <span className="text-primary font-bold tracking-[0.3em] uppercase text-sm block">Welcome to the Cinema</span>
          <h1 className="text-5xl md:text-7xl font-headline font-bold text-white tracking-tight leading-none">
            CURATE YOUR <span className="text-gradient">LEGACY</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            Track every frame, discover hidden gems, and unlock deep insights into your cinematic obsession with AI-powered analytics.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="bg-primary hover:bg-primary/80 text-white rounded-full px-8 h-12 shadow-xl shadow-primary/20">
              <PlayCircle className="w-5 h-5 mr-2" /> Start Tracking
            </Button>
            <Button size="lg" variant="outline" className="glass border-white/10 hover:bg-white/5 text-white rounded-full px-8 h-12">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Movie Discovery */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="text-primary w-6 h-6" />
            </div>
            <h2 className="text-3xl font-headline font-bold text-white">Trending Now</h2>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
              <Input 
                placeholder="Search movies..." 
                className="bg-white/5 border-white/10 pl-10 h-11 focus:ring-primary focus:border-primary text-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" className="glass border-white/10 h-11">
              <Filter className="w-4 h-4 mr-2" /> Filters
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredMovies.map((movie) => (
            <MovieCard 
              key={movie.id} 
              movie={movie} 
              onAction={(id, action) => {
                // Handle action logic
                console.log(id, action);
              }}
            />
          ))}
          {filteredMovies.length === 0 && (
            <div className="col-span-full py-20 text-center text-white/40 italic">
              No movies found for "{search}"
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
