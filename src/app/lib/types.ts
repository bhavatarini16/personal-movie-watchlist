
export interface Movie {
  id: string;
  title: string;
  genres: string[];
  rating: number; // User rating 1-10
  tmdbRating: number; // Official rating
  releaseDate: string;
  overview: string;
  posterUrl: string;
  backdropUrl?: string;
  status: 'watchlist' | 'watched' | 'none';
  userNotes?: string;
  addedAt: string;
}

export interface CinemaPersonality {
  type: string;
  description: string;
}

export interface UserProfile {
  name: string;
  avatar: string;
  personality?: CinemaPersonality;
}
