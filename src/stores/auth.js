import { defineStore } from "pinia";
import api from "../api/api";
import router from "../router";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    accessToken: null,
    refreshToken: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    role: (state) => state.user?.role || null,
    userName: (state) => state.user?.name || null,
  },

  actions: {
    async login(credentials) {
      try {
        const res = await api.post("/login", credentials);

        this.user = res.data.user;
        this.accessToken = res.data.access_token;
        this.refreshToken = res.data.refresh_token;

        // Set token di axios
        api.defaults.headers.common["Authorization"] = `Bearer ${this.accessToken}`;

        // Redirect sesuai role
        switch (this.user.role) {
          case "pic":
          case "staff":
            router.push("/dashboard/home");
            break;
          case "admin":
            router.push("/dashboard/home");
            break;
          case "super_admin":
            router.push("/dashboard/home");
            break;
        }
      } catch (err) {
        console.error(err);
        throw err;
      }
    },

    async logout() {
      try {
        await api.post("/logout");
      } catch (err) {
        console.warn("Logout error:", err);
      }

      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;

      delete api.defaults.headers.common["Authorization"];

      // Redirect ke login sesuai role
      router.push("/login-pic-staff");
    },

    async refreshAccessToken() {
      if (!this.refreshToken) return;

      try {
        const res = await api.post("/refresh", { refresh_token: this.refreshToken });
        this.accessToken = res.data.access_token;
        api.defaults.headers.common["Authorization"] = `Bearer ${this.accessToken}`;
      } catch (err) {
        console.error("Refresh token failed:", err);
        this.logout();
      }
    },

    setUser(userData) {
      this.user = userData;
    },
  },
    persist: true,
});
