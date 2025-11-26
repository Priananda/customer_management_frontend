<script setup>
import { ref } from "vue";
import api from "../api/api";
import { useRouter } from "vue-router";

const router = useRouter();

const name = ref("");
const email = ref("");
const password = ref("");
const role = ref("pic"); // default

const register = async () => {
  try {
    await api.post("/register", {
      name: name.value,
      email: email.value,
      password: password.value,
      role: role.value,
    });
    alert("Register berhasil! Silakan login.");
    router.push("/login-pic-staff");
  } catch (err) {
    alert(err.response?.data?.message || "Register gagal");
  }
};
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
      <h2 class="text-2xl font-bold mb-6 text-center text-gray-800">
        Register PIC / Staff
      </h2>

      <div class="mb-4">
        <label class="block text-gray-700 mb-2">Name</label>
        <input
          v-model="name"
          type="text"
          placeholder="Your Name"
          class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div class="mb-4">
        <label class="block text-gray-700 mb-2">Email</label>
        <input
          v-model="email"
          type="email"
          placeholder="Your Email"
          class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div class="mb-4">
        <label class="block text-gray-700 mb-2">Password</label>
        <input
          v-model="password"
          type="password"
          placeholder="Password"
          class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div class="mb-6">
        <label class="block text-gray-700 mb-2">Role</label>
        <select
          v-model="role"
          class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="pic">PIC</option>
          <option value="staff">Staff</option>
        </select>
      </div>

      <button
        @click="register"
        class="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
      >
        Register
      </button>
    </div>
  </div>
</template>
