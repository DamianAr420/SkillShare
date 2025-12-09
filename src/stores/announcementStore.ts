import { defineStore } from "pinia";
import api from "@/api/axios";
import { useAuthStore } from "@/stores/authStore";
import type { Announcement } from "@/types/announcement";

// Typ dla MongoDB ID
type MongoId = { $oid: string } | string;

// Typ dla danych z bazy (mogą zawierać $oid)
interface AnnouncementDB {
  _id: MongoId;
  title: string;
  user: MongoId | { _id: string } | string;
  type: string;
  category: { name: string };
  location?: string;
  desc?: string;
  price?: number | null;
  imageUrl?: string;
}

// Funkcja pomocnicza, zawsze zwraca string ID
function toId(id: any): string {
  if (!id) return "";
  if (typeof id === "string") return id;
  if ("$oid" in id) return id.$oid;
  if ("_id" in id) return id._id;
  return "";
}

export const useAnnouncementStore = defineStore("announcement", {
  state: () => ({
    announcements: [] as Announcement[],
    followedAnnouncements: [] as Announcement[],
    loading: false,
    error: null as string | null,
    selectedAnnouncement: null as Announcement | null,
  }),

  actions: {
    // Pobierz wszystkie ogłoszenia
    async fetchAnnouncements() {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get("/announcements");
        this.announcements = res.data.map((a: AnnouncementDB) => ({
          ...a,
          _id: toId(a._id),
          user: toId(a.user),
        }));
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    // Pobierz najnowsze ogłoszenia
    async fetchLatestAnnouncements() {
      this.loading = true;
      try {
        const res = await api.get("/announcements/latest");
        this.announcements = res.data.map((a: AnnouncementDB) => ({
          ...a,
          _id: toId(a._id),
          user: toId(a.user),
        }));
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    // Pobierz filtrowane ogłoszenia
    async fetchFilteredAnnouncements(filters?: any) {
      this.loading = true;
      try {
        const res = await api.get("/announcements/filter", { params: filters });
        this.announcements = res.data.map((a: AnnouncementDB) => ({
          ...a,
          _id: toId(a._id),
          user: toId(a.user),
        }));
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    // Dodaj ogłoszenie
    async addAnnouncement(formData: FormData) {
      this.loading = true;
      try {
        const res = await api.post("/announcements/add", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const newAnnouncement = {
          ...res.data.announcement,
          _id: toId(res.data.announcement._id),
          user: toId(res.data.announcement.user),
        };
        this.announcements.push(newAnnouncement);
      } finally {
        this.loading = false;
      }
    },

    // Pobierz ogłoszenia użytkownika
    async fetchUserAnnouncements(userId: string) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get(`/announcements/user/${userId}`);
        this.announcements = res.data.map((a: AnnouncementDB) => ({
          ...a,
          _id: toId(a._id),
          user: toId(a.user),
        }));
      } catch (err: any) {
        console.error("❌ Error fetching user announcements:", err);
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    // Pobierz obserwowane ogłoszenia
    async fetchFollowedAnnouncements(ids: string[]) {
      if (!ids || ids.length === 0) {
        this.followedAnnouncements = [];
        return;
      }
      this.loading = true;
      try {
        const res = await api.post("/announcements/byIds", { ids });
        this.followedAnnouncements = res.data.map((a: AnnouncementDB) => ({
          ...a,
          _id: toId(a._id),
          user: toId(a.user),
        }));
      } catch (err: any) {
        console.error("❌ Error fetching followed announcements:", err);
        this.followedAnnouncements = [];
      } finally {
        this.loading = false;
      }
    },

    // Pobierz jedno ogłoszenie
    async fetchAnnouncementById(id: string) {
      this.loading = true;
      this.selectedAnnouncement = null;
      try {
        const { data } = await api.get(`/announcements/${id}`);
        this.selectedAnnouncement = {
          ...data,
          _id: toId(data._id),
          user: toId(data.user),
        };
      } catch (err) {
        console.error("❌ Nie znaleziono ogłoszenia", err);
      } finally {
        this.loading = false;
      }
    },

    // Usuń ogłoszenie
    async deleteAnnouncement(id: string) {
      try {
        await api.delete(`/announcements/${id}`);
        this.announcements = this.announcements.filter((a) => a._id !== id);
        this.followedAnnouncements = this.followedAnnouncements.filter(
          (a) => a._id !== id
        );
      } catch (err) {
        console.error("❌ Error deleting announcement:", err);
        throw err;
      }
    },

    // Aktualizuj ogłoszenie
    async updateAnnouncement(id: string, formData: FormData) {
      this.loading = true;
      try {
        const res = await api.put(`/announcements/${id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const updated = {
          ...res.data,
          _id: toId(res.data._id),
          user: toId(res.data.user),
        };
        this.selectedAnnouncement = updated;
        this.announcements = this.announcements.map((a) =>
          a._id === id ? updated : a
        );
        this.followedAnnouncements = this.followedAnnouncements.map((a) =>
          a._id === id ? updated : a
        );
        return updated;
      } finally {
        this.loading = false;
      }
    },

    // Toggle obserwowane ogłoszenie
    async toggleWatch(
      announcementId: string
    ): Promise<"added" | "removed" | "error"> {
      const auth = useAuthStore();

      try {
        if (!auth.user) return "error";

        await auth.toggleWatchlist(announcementId);

        const isNowWatched = auth.user.watchlist?.includes(announcementId);

        // Odśwież obserwowane
        if (auth.user?.watchlist) {
          await this.fetchFollowedAnnouncements(auth.user.watchlist);
        }

        return isNowWatched ? "added" : "removed";
      } catch (err) {
        console.error("❌ Failed to toggle watch:", err);
        return "error";
      }
    },

    async countView(id: string) {
      try {
        await api.post(`/announcements/${id}/view`);
      } catch (err) {
        console.error("❌ Error counting view:", err);
      }
    },

    // Sprawdź czy użytkownik jest właścicielem
    isOwner(announcement: Announcement | null | undefined) {
      const auth = useAuthStore();
      if (!auth.user || !announcement) return false;
      return auth.user._id === toId(announcement.user);
    },

    // Sprawdź czy ogłoszenie jest obserwowane
    isWatched(announcement: Announcement) {
      const auth = useAuthStore();
      if (!announcement._id || !auth.user?.watchlist) return false;

      const watchlistIds = auth.user.watchlist.map((item) => toId(item));
      return watchlistIds.includes(announcement._id);
    },
  },
});
