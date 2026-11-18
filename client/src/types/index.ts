export type SportType = 'FOOTBALL' | 'CRICKET' | 'BADMINTON' | 'PICKLEBALL' | 'BASKETBALL';
export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type MatchStatus = 'SCHEDULED' | 'OPEN' | 'FILLING_FAST' | 'FULL' | 'COMPLETED' | 'CANCELLED';

export interface MatchCardData {
  id: string;
  sportType: SportType;
  title: string;
  venueName: string;
  city: string;
  isPublicGround: boolean;
  date: string;
  timeSlot: string;
  currentPlayers: number;
  maxPlayers: number;
  costPerPerson: number;
  skillLevel: SkillLevel;
  status: MatchStatus;
  host: {
    name: string;
    reliabilityRating: number;
  };
}

export interface TurfCardData {
  id: string;
  name: string;
  city: string;
  location: string;
  pricePerHour: number;
  sports: SportType[];
  amenities: string[];
  imageUrl: string;
  isVerified: boolean;
  rating: number;
}