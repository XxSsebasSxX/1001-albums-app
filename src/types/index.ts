export interface Album {
  id: string;
  artist: string;
  album: string;
  year: number;
  genre: string;
}

export interface ListenedAlbum extends Album {
  rating: number;
  notes: string;
}

export type RootStackParamList = {
  Home: undefined;
  History: undefined;
};
