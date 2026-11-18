'use client';

import Link from 'next/link';
import { MapPin, PlusCircle, Trophy } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/shared/AuthModal';

const CITIES = ['Jaipur', 'Bengaluru', 'Mumbai', 'Delhi NCR', 'Pune', 'Hyderabad'];

export function Navbar() {
  const { selectedCity, setSelectedCity } = useAppStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Brand + City Selector */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Trophy className="h-5 w-5" />
            </span>
            <span>Turf<span className="text-emerald-600">Mate</span></span>
          </Link>

          <div className="flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1.5 text-sm">
            <MapPin className="h-4 w-4 text-emerald-600" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              aria-label="Select City"
              className="bg-transparent font-medium outline-none cursor-pointer"
            >
              {CITIES.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="hover:text-emerald-600 transition-colors">Find Matches</Link>
          <Link href="/turfs" className="hover:text-emerald-600 transition-colors">Explore Turfs</Link>
          <Link href="/dashboard" className="hover:text-emerald-600 transition-colors">My Games</Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link href="/matches/create">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Host a Match</span>
            </Button>
          </Link>
          <AuthModal />
        </div>
      </div>
    </header>
  );
}