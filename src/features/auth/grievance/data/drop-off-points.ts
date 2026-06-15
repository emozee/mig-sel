export interface DropOffPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description?: string;
}

export const dropOffPoints: DropOffPoint[] = [
  {
    id: 'DOC4',
    name: 'DOC4',
    lat: 26.8882308510465,
    lng: 90.49032960307142,
  },
];
