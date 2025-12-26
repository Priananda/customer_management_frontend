import { defineStore } from "pinia";
import { ref } from "vue";
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
        console.error("fetch birthday error:", e);
      }
    },
  },
});
