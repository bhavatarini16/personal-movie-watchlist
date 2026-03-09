
export interface Movie {
  id: string;
  tmdbId: string;
  title: string;
  genres: string[];
  tmdbRating: number;
  releaseDate: string;
  overview: string;
  posterUrl: string;
  backdropUrl?: string;
  runtime?: number;
  cast?: string[];
  director?: string;
}

export interface WatchlistEntry {
  id: string;
  userId: string;
  movieId: string;
  movieData: Movie;
  addedDate: string;
  isWatched: boolean;
  watchDate?: string;
  personalRating?: number;
  notes?: string;
  rewatchCount: number;
  isFavorite?: boolean;
  remindMe?: boolean;
}

export interface CinemaPersonality {
  type: string;
  description: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  dateJoined: string;
  personality?: CinemaPersonality;
  favoriteGenreIds?: string[];
  friends?: Record<string, boolean>; // Denormalized friends map for auth
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string;
  watchlistEntryId: string;
  text: string;
  commentDate: string;
}

export interface SceneMemory {
  id: string;
  userId: string;
  movieId: string;
  movieTitle: string;
  posterUrl: string;
  timestamp: string;
  quote: string;
  note: string;
  addedDate: string;
}

export interface WatchParty {
  id: string;
  hostId: string;
  hostName: string;
  title: string;
  description: string;
  scheduledAt: string;
  status: 'draft' | 'voting' | 'ready' | 'finished';
  selectedMovieId?: string;
  selectedMovieTitle?: string;
  selectedMoviePoster?: string;
}

export interface WatchPartyNomination {
  id: string;
  movieId: string;
  movieTitle: string;
  posterUrl: string;
  nominatorId: string;
  nominatorName: string;
  votes: Record<string, boolean>; // userId -> true
}

export interface WatchPartyMember {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string;
  joinedAt: string;
}
