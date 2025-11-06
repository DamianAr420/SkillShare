import { defineStore } from "pinia";
import axios from "axios";
import { type Announcement } from "@/types/announcement";

export const useAnnouncementStore = defineStore("announcement", {
  state: () => ({
    announcements: [] as Announcement[],
    loading: false,
    error: null as string | null,
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
  },
});
