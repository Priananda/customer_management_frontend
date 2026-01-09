import { defineStore } from "pinia";
import api from "@/api/api";

export const useBirthdayStore = defineStore("birthday", {
  state: () => ({
    customers: [],
  }),

  actions: {
    async fetchToday() {
      try {
        const res = await api.get("/customer-birthday-today");

        this.customers = res.data;

      } catch (e) {
      }
    },
  },
});
