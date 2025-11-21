import { defineStore } from "pinia";
import axios from "axios";
import { type Announcement } from "@/types/announcement";

export const useAnnouncementStore = defineStore("announcement", {
  state: () => ({
    announcements: [] as Announcement[],
    loading: false,
    error: null as string | null,
    selectedAnnouncement: null as any | null,
  }),

  actions: {
    async fetchAnnouncements() {
      this.loading = true;
      this.error = null;
      try {
        const res = await axios.get("/api/announcements");
        this.announcements = res.data;
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async fetchLatestAnnouncements() {
      this.loading = true;
      try {
        const res = await axios.get("/api/announcements/latest");
        this.announcements = res.data;
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async fetchFilteredAnnouncements(filters?: any) {
      this.loading = true;
      try {
        const res = await axios.get("/api/announcements/filter", {
          params: filters,
        });
        this.announcements = res.data;
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async addAnnouncement(formData: FormData) {
      this.loading = true;
      try {
        const res = await fetch("/api/announcements/add", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        this.announcements.push(data.announcement);
      } finally {
        this.loading = false;
      }
    },

    async fetchUserAnnouncements(userId: string) {
      try {
        this.loading = true;
        const res = await axios.get(`/api/announcements/user/${userId}`);
        this.announcements = res.data;
      } catch (err) {
        console.error("Error fetching user announcements:", err);
      } finally {
        this.loading = false;
      }
    },

    async fetchAnnouncementById(id: string) {
      this.loading = true;
      this.selectedAnnouncement = null;
      try {
        const { data } = await axios.get(`/api/announcements/${id}`);
        this.selectedAnnouncement = data;
      } catch (err) {
        console.error("Nie znaleziono ogłoszenia", err);
      } finally {
        this.loading = false;
      }
    },

    async deleteAnnouncement(id: string) {
      try {
        await axios.delete(`/api/announcements/${id}`);
        this.announcements = this.announcements.filter((a) => a._id !== id);
      } catch (err) {
        console.error("Error deleting announcement:", err);
        throw err;
      }
    },

    async fetchAnnouncementsByIds(ids: string[]) {
      if (!ids || ids.length === 0) return [];
      try {
        const res = await axios.post("/api/announcements/byIds", { ids });
        return res.data;
      } catch (err) {
        console.error("❌ fetchAnnouncementsByIds failed:", err);
        return [];
      }
    },

    async updateAnnouncement(id: string, formData: FormData) {
      this.loading = true;
      try {
        const res = await axios.put(`/api/announcements/${id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        this.selectedAnnouncement = res.data;
        return res.data;
      } finally {
        this.loading = false;
      }
    },
  },
});
