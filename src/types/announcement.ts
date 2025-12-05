export interface Announcement {
  _id?: string;
  title: string;
  desc: string;
  price: number;
  location: string;
  createdAt?: string;
  imageUrl: string;
  user: { _id: string; name: string } | string;
  category: { name: string } | string;
  type: string;
  showPhone: boolean;
  showEmail: boolean;
}
