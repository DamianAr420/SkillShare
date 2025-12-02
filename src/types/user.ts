export interface User {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  desc: string;
  phone: string;
  email: string;
  avatarUrl: string;
  watchlist?: string[];
  isOnline?: boolean;
  lastSeen?: string;
}
