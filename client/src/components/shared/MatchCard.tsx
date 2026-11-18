import { Calendar, Clock, MapPin, ShieldCheck, Users } from 'lucide-react';
import { MatchCardData } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

const statusStyles: Record<string, string> = {
  OPEN: 'bg-emerald-500/15 text-emerald-700 border-emerald-200',
  FILLING_FAST: 'bg-amber-500/15 text-amber-700 border-amber-200',
  FULL: 'bg-rose-500/15 text-rose-700 border-rose-200',
};

export function MatchCard({ match }: { match: MatchCardData }) {
  const spotsLeft = match.maxPlayers - match.currentPlayers;

  return (
    <Card className="flex flex-col justify-between hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="font-semibold">
            {match.sportType} • {match.skillLevel}
          </Badge>
          <Badge variant="outline" className={statusStyles[match.status] || ''}>
            {match.status.replace('_', ' ')}
          </Badge>
        </div>
        <h3 className="font-bold text-lg mt-2 line-clamp-1">{match.title}</h3>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="truncate">{match.venueName}, {match.city}</span>
        </p>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {match.date}</span>
          <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {match.timeSlot}</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold">{match.currentPlayers}/{match.maxPlayers}</span>
            <span className="text-muted-foreground text-xs">({spotsLeft} spots left)</span>
          </div>
          <div className="font-bold text-base">
            ₹{match.costPerPerson}<span className="text-xs font-normal text-muted-foreground">/player</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2 flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Host: <strong>{match.host.name}</strong> ({match.host.reliabilityRating.toFixed(1)}★)</span>
        </div>
        <Button
          size="sm"
          disabled={match.status === 'FULL'}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {match.status === 'FULL' ? 'Lobby Full' : 'Join Lobby'}
        </Button>
      </CardFooter>
    </Card>
  );
}