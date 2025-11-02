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

    async addAnnouncement(data: Announcement) {
      this.loading = true;
      try {
        const res = await axios.post("/api/announcements/add", data);
        this.announcements.push(res.data);
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
  },
});
