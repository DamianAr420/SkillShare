import { defineStore } from "pinia";
import axios from "axios";

export interface Category {
  _id: string;
  name: string;
}

export const useCategoryStore = defineStore("category", {
  state: () => ({
    categories: [] as Category[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchCategories() {
      this.loading = true;
      this.error = null;
      try {
        const res = await axios.get<Category[]>("/api/categories");
        this.categories = res.data;
      } catch (err: any) {
        this.error = err.message || "Failed to load categories";
      } finally {
        this.loading = false;
      }
    },
  },
});
