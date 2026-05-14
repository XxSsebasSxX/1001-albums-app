export interface Album {
  id: string;
  artist: string;
  album: string;
  year: number;
  genre: string;
}

export type RootStackParamList = {
  Home: undefined;
  History: undefined;
};
