// IF YOU WANT TO RELOAD THE PAGE USE SESSION STORAGE

import { defineStore } from "pinia";
import api from "../api/api";
import router from "../router";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,        // dipersist
    accessToken: null, // memory only
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    role: (state) => state.user?.role || null,
    extraRoles: (state) => state.user?.extra_roles || [],
    isDriver: (state) => state.user?.extra_roles?.includes("driver"),
  },

  actions: {
    async login(credentials) {
  const res = await api.post("/login", credentials, {
    withCredentials: true,
  });

  this.user = res.data.user;
  this.accessToken = res.data.access_token;

  const isDriver = this.user?.extra_roles?.includes("driver");

  if (isDriver) {
    router.push("/dashboard-driver/listing");
  } else {
    router.push("/dashboard/home");
  }
},

    async refreshAccessToken() {
      const res = await api.post(
        "/refresh",
        {},
        { withCredentials: true }
      );

      this.accessToken = res.data.access_token;
      return this.accessToken;
    },

     async logout() {
  
  const isDriver = this.user?.extra_roles?.includes("driver");

  try {
    await api.post("/logout", {}, { withCredentials: true });
  } catch {}

  this.$reset();
  sessionStorage.removeItem("auth");

  if (isDriver) {
    router.push("/login-driver");
  } else {
    router.push("/login-admin");
  }
}

  },

  
  persist: {
    key: "auth",
    storage: sessionStorage,
    paths: ["user"], 
  },
});


// PINIA MEMORY + HTTPONLY COOKIE

// import { defineStore } from "pinia";
// import api from "../api/api";
// import router from "../router";

// export const useAuthStore = defineStore("auth", {
//   id: "auth",

//   state: () => ({
//     user: null,        // disimpan manual di sessionStorage
//     accessToken: null, // memory only
//   }),

//   getters: {
//     isAuthenticated: (state) => !!state.accessToken,
//     role: (state) => state.user?.role || null,
//   },

//   actions: {
//     async login(credentials) {
//       const res = await api.post("/login", credentials, { withCredentials: true });

//       // simpan user di state dan sessionStorage manual
//       this.user = res.data.user;
//       sessionStorage.setItem("user", JSON.stringify(this.user));

//       // accessToken tetap di memory
//       this.accessToken = res.data.access_token;

//       router.push("/dashboard/home");
//     },

//     async refreshAccessToken() {
//       const res = await api.post("/refresh", {}, { withCredentials: true });
//       this.accessToken = res.data.access_token;
//       return this.accessToken;
//     },

//     async logout() {
//       try {
//         await api.post("/logout", {}, { withCredentials: true });
//       } catch {}

//       // reset memory
//       this.user = null;
//       this.accessToken = null;

//       sessionStorage.removeItem("user");

//       router.push("/login-admin");
//     },

//     loadUserFromSession() {
//       const savedUser = sessionStorage.getItem("user");
//       if (savedUser) this.user = JSON.parse(savedUser);
//     },
//   },

// });
