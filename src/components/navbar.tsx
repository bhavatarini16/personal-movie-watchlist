
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Film, List, BarChart3, Users, Sparkles, User, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

const navItems = [
  { href: '/', label: 'Discovery', icon: Search },
  { href: '/watchlist', label: 'Watchlist', icon: List },
  { href: '/dashboard', label: 'Analytics', icon: BarChart3 },
  { href: '/recommendations', label: 'For You', icon: Sparkles },
  { href: '/friends', label: 'Friends', icon: Users },
  { href: '/quiz', label: 'Cinema Personality', icon: Film },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/5 h-16 flex items-center px-4 md:px-8 justify-between">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
            <Film className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-headline tracking-tighter text-white hidden sm:block">CINETRACK</span>
        </Link>
      </div>

      <div className="hidden lg:flex items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "flex items-center gap-2 h-10 px-4 transition-all hover:bg-white/10 hover:text-primary",
                  isActive ? "text-primary bg-white/5 font-semibold" : "text-white/70"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <Button size="icon" variant="ghost" className="text-white/70 hover:text-white md:hidden">
          <Search className="w-5 h-5" />
        </Button>
        <Link href="/profile">
          <Button size="icon" variant="outline" className="rounded-full border-white/10 bg-white/5 hover:bg-primary hover:text-white transition-all">
            <User className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    </nav>
  );
}
