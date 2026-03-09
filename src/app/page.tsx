"use client";

import { useState, useEffect, useMemo } from 'react';
import { Search, TrendingUp, Filter, PlayCircle, Loader2, Calendar, Star, Sparkles, Bell, Tv, Users } from 'lucide-react';
import { searchMovies, getTrendingMovies } from './lib/tmdb-service';
import MovieCard from '@/components/movie-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Movie } from './lib/types';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RandomMoviePicker from '@/components/random-movie-picker';
import { useUser } from '@/firebase';
import Link from 'next/link';

const GENRES = ["Action", "Sci-Fi", "Drama", "Thriller", "Comedy", "Crime", "Mystery"];

export default function Home() {
  const { user } = useUser();
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [minRating, setMinRating] = useState<string>("0");
  const [releaseStatus, setReleaseStatus] = useState<string>("all");

  useEffect(() => {
    const fetchTrending = async () => {
      setIsLoading(true);
      const trending = await getTrendingMovies();
      setMovies(trending);
      setIsLoading(false);
    };
    fetchTrending();
  }, []);

  const handleSearch = async (val: string) => {
    setSearch(val);
    setIsLoading(true);
    const results = await searchMovies(val);
    setMovies(results);
    setIsLoading(false);
  };

  const filteredMovies = useMemo(() => {
    const now = new Date();
    return movies.filter(m => {
      const matchesGenre = selectedGenre === "all" || m.genres.includes(selectedGenre);
      const matchesRating = m.tmdbRating >= parseFloat(minRating);
      
      let matchesStatus = true;
      const releaseDate = new Date(m.releaseDate);
      if (releaseStatus === "upcoming") {
        matchesStatus = releaseDate > now;
      } else if (releaseStatus === "released") {
        matchesStatus = releaseDate <= now;
      }
      
      return matchesGenre && matchesRating && matchesStatus;
    });
  }, [movies, selectedGenre, minRating, releaseStatus]);

  const upcomingMovies = useMemo(() => {
    const now = new Date();
    return movies.filter(m => new Date(m.releaseDate) > now).slice(0, 5);
  }, [movies]);

  return (
    <div className="pt-16 min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[75vh] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/hero3/1920/1080')] bg-cover bg-center">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-6 animate-fade-in">
          <span className="text-primary font-bold tracking-[0.3em] uppercase text-sm block">Premium Movie Tracking</span>
          <h1 className="text-6xl md:text-8xl font-headline font-bold text-white tracking-tight leading-none">
            CINE<span className="text-gradient">TRACK</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed font-light">
            Architect your cinematic journey. Track history, analyze tastes, and host global watch parties using AI insights.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="bg-primary hover:bg-primary/80 text-white rounded-full px-10 h-14 text-lg shadow-2xl shadow-primary/30 uppercase tracking-widest font-headline">
              <PlayCircle className="w-6 h-6 mr-2" /> Start Exploring
            </Button>
            <Link href="/watch-parties">
              <Button size="lg" variant="outline" className="glass border-white/10 hover:bg-white/5 text-white rounded-full px-10 h-14 uppercase tracking-widest font-headline">
                <Tv className="w-6 h-6 mr-2" /> Host Party
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 pt-8 opacity-50">
            <Link href="/watch-parties" className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="w-12 h-12 rounded-full glass border-white/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/30 transition-all">
                <Tv className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold">Parties</span>
            </Link>
            <Link href="/friends" className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="w-12 h-12 rounded-full glass border-white/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/30 transition-all">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold">Friends</span>
            </Link>
            <Link href="/dashboard" className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="w-12 h-12 rounded-full glass border-white/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/30 transition-all">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold">Pulse</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Movie Discovery */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-20">
        <div className="space-y-12">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                <TrendingUp className="text-primary w-8 h-8" />
              </div>
              <div>
                <h2 className="text-4xl font-headline font-bold text-white tracking-tight">DISCOVERY</h2>
                <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Find your next favorite film</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
              <div className="relative flex-1 min-w-[280px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5" />
                <Input 
                  placeholder="Search titles, directors, cast..." 
                  className="bg-white/5 border-white/10 pl-12 h-14 rounded-2xl focus:ring-primary focus:border-primary text-white text-lg"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-3">
                <Select value={releaseStatus} onValueChange={setReleaseStatus}>
                  <SelectTrigger className="w-[160px] h-14 glass border-white/10 rounded-2xl text-white">
                    <SelectValue placeholder="Release Status" />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10 text-white">
                    <SelectItem value="all">All Releases</SelectItem>
                    <SelectItem value="released">Released Only</SelectItem>
                    <SelectItem value="upcoming">Coming Soon</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="w-[140px] h-14 glass border-white/10 rounded-2xl text-white">
                    <SelectValue placeholder="Genre" />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10 text-white">
                    <SelectItem value="all">All Genres</SelectItem>
                    {GENRES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={minRating} onValueChange={setMinRating}>
                  <SelectTrigger className="w-[120px] h-14 glass border-white/10 rounded-2xl text-white">
                    <SelectValue placeholder="Min Rating" />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10 text-white">
                    <SelectItem value="0">0+ Stars</SelectItem>
                    <SelectItem value="7">7+ Stars</SelectItem>
                    <SelectItem value="8">8+ Stars</SelectItem>
                    <SelectItem value="9">9+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-white/40 animate-pulse font-bold uppercase tracking-[0.2em] text-xs">Syncing with cinematic database...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
              {filteredMovies.map((movie) => (
                <MovieCard 
                  key={movie.id} 
                  movie={movie} 
                />
              ))}
              {filteredMovies.length === 0 && (
                <div className="col-span-full py-32 text-center space-y-4">
                  <p className="text-white/20 text-2xl italic font-headline">The archives are empty for your filters</p>
                  <Button variant="link" onClick={() => {
                    setSearch('');
                    setSelectedGenre('all');
                    setMinRating('0');
                    setReleaseStatus('all');
                    handleSearch('');
                  }} className="text-primary font-bold uppercase tracking-widest text-xs">Clear all filters</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Releases Section */}
      <section className="bg-white/5 border-y border-white/5 py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
              <Bell className="text-blue-400 w-8 h-8" />
            </div>
            <div>
              <h2 className="text-4xl font-headline font-bold text-white tracking-tight">UPCOMING PREMIERES</h2>
              <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Mark your calendars for these releases</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {upcomingMovies.map((movie) => (
              <MovieCard 
                key={movie.id} 
                movie={movie} 
              />
            ))}
            {upcomingMovies.length === 0 && (
              <p className="text-white/20 italic font-headline col-span-full py-12 text-center">No upcoming releases found in the archives.</p>
            )}
          </div>
        </div>
      </section>

      {user && <RandomMoviePicker />}
    </div>
  );
}
