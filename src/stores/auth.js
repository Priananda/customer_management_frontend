import { defineStore } from "pinia";
import api from "../api/api";
import router from "../router";

export const useAuthStore = defineStore("auth", {
  id: "auth",
  state: () => ({
    user: null,          // only user can persist
    accessToken: null,   // only in memory
    refreshToken: null,  // only in memory
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    role: (state) => state.user?.role || null,
  },

  actions: {
    async login(credentials) {
      const res = await api.post("/login", credentials);

      this.user = res.data.user;
      this.accessToken = res.data.access_token;
      this.refreshToken = res.data.refresh_token;

      api.defaults.headers.common["Authorization"] = `Bearer ${this.accessToken}`;
      router.push("/dashboard/home");
    },

    // Logout
    async logout() {
      try {
        await api.post("/logout");
      } catch {}
      
      // Reset all state
      this.$reset();

      // Delete data persist
      sessionStorage.removeItem("auth");

      // Delete header Authorization
      delete api.defaults.headers.common["Authorization"];

      router.push("/login-pic-staff");
    },

    async refreshAccessToken() {
      if (!this.refreshToken) return;

      try {
        const res = await api.post("/refresh", { refresh_token: this.refreshToken });
        this.accessToken = res.data.access_token;
        api.defaults.headers.common["Authorization"] = `Bearer ${this.accessToken}`;
      } catch {

        // if refresh fails, logout automatically
        await this.logout(); 
      }
    },

    setUser(userData) {
      this.user = userData;
    },
  },

  persist: [
    {
      key: "auth",
      storage: sessionStorage,

      // only saved users
      paths: ["user"], 
    },
  ],
});
