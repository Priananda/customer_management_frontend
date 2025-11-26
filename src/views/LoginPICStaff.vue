<script setup>
import { ref } from "vue";
import api from "../api/api";
import { useRouter } from "vue-router";

const router = useRouter();
const email = ref("");
const password = ref("");

const login = async () => {
  try {
    const res = await api.post("/login", {
      email: email.value,
      password: password.value,
    });
    const role = res.data.user.role;
    if (role !== "pic" && role !== "staff") {
      alert("Hanya PIC / Staff yang bisa login di halaman ini");
      return;
    }

    localStorage.setItem("access_token", res.data.access_token);
    localStorage.setItem("refresh_token", res.data.refresh_token);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    if (role === "pic") router.push("/dashboard");
    if (role === "staff") router.push("/dashboard");
  } catch (err) {
    alert(err.response?.data?.message || "Login gagal");
  }
};
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
      <h2 class="text-2xl font-bold mb-6 text-center text-gray-800">
        Login PIC / Staff
      </h2>

      <div class="mb-4">
        <label class="block text-gray-700 mb-2">Email</label>
        <input
          v-model="email"
          type="email"
          placeholder="Your Email"
          class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div class="mb-6">
        <label class="block text-gray-700 mb-2">Password</label>
        <input
          v-model="password"
          type="password"
          placeholder="Password"
          class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <button
        @click="login"
        class="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
      >
        Login
      </button>
    </div>
  </div>
</template>
