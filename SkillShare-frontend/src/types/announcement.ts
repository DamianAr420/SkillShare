export interface Announcement {
  _id?: string;
  title: string;
  desc: string;
  price: number;
  location: string;
  category: string;
  createdAt?: string;
  imageUrl: string;
  user: string;
}
