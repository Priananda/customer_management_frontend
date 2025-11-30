<script setup>
import { ref } from "vue";
import api from "../api/api";
import { useRouter } from "vue-router";
import LoadingSpinner from "../components/Loading.vue";
import { Eye, EyeOff, ChevronDown } from "lucide-vue-next";

const router = useRouter();

// Form fields
const name = ref("");
const email = ref("");
const password = ref("");
const role = ref("PIC"); // default role tampil di dropdown

// UI state
const showPassword = ref(false);
const loading = ref(false);
const showRoleDropdown = ref(false); // toggle dropdown

// Modal
const showModal = ref(false);
const modalMsg = ref("");
const modalType = ref("");

// Errors
const nameError = ref("");
const emailError = ref("");
const passwordError = ref("");

const roles = ["PIC", "Staff"]; // isi dropdown

const register = async () => {
  // Reset errors
  nameError.value = "";
  emailError.value = "";
  passwordError.value = "";

  if (!name.value) nameError.value = "Name wajib diisi";
  if (!email.value) emailError.value = "Email wajib diisi";
  if (!password.value) passwordError.value = "Password wajib diisi";

  if (nameError.value || emailError.value || passwordError.value) {
    modalMsg.value = "Tolong periksa input Anda!";
    modalType.value = "error";
    showModal.value = true;
    return;
  }

  loading.value = true;
  try {
    await api.post("/register", {
      name: name.value,
      email: email.value,
      password: password.value,
      role: role.value.toLowerCase(),
    });

    modalMsg.value = "Register berhasil! Silakan login.";
    modalType.value = "success";
    showModal.value = true;

    setTimeout(() => {
      showModal.value = false;
      router.push("/login-pic-staff");
      loading.value = false;
    }, 1500);
  } catch (err) {
    modalMsg.value =
      err.response?.data?.message || "Register gagal. Coba lagi.";
    modalType.value = "error";
    showModal.value = true;
    console.error(err.response?.data?.message || err.message);
    loading.value = false;
  }
};
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-black px-2">
    <!-- Modal -->
    <transition name="modal-fade">
      <div
        v-if="showModal"
        class="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
      >
        <transition name="modal-scale">
          <div
            class="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm text-center transform transition-all"
          >
            <h3 class="text-lg font-semibold mb-3">
              {{
                modalType === "error" ? "Register Gagal" : "Register Berhasil"
              }}
            </h3>
            <p class="text-gray-700 mb-5">{{ modalMsg }}</p>
            <button
              @click="showModal = false"
              class="px-7 py-2 rounded-full bg-linear-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-500 hover:to-blue-600 transition"
            >
              Tutup
            </button>
          </div>
        </transition>
      </div>
    </transition>

    <div
      class="relative bg-slate-900/80 backdrop-blur-md rounded-2xl p-8 w-full max-w-md border border-cyan-700 shadow-[0_0_5px_#06b6d4]"
    >
      <h2 class="text-3xl font-semibold mb-4 text-center text-white">
        Register PIC / Staff
      </h2>
      <p class="text-center text-gray-300 mb-6">
        Masukkan data untuk membuat akun
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Name -->
        <div>
          <label class="block text-gray-300 font-medium mb-2">Name</label>
          <input
            v-model="name"
            type="text"
            placeholder="Your Name"
            class="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:scale-103 transition-all duration-300"
          />
          <p v-if="nameError" class="mt-1 text-red-500 text-sm">
            {{ nameError }}
          </p>
        </div>

        <!-- Email -->
        <div>
          <label class="block text-gray-300 font-medium mb-2">Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="Your Email"
            class="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:scale-103 transition-all duration-300"
          />
          <p v-if="emailError" class="mt-1 text-red-500 text-sm">
            {{ emailError }}
          </p>
        </div>

        <!-- Password (full width) -->
        <div class="relative md:col-span-2">
          <label class="block text-gray-300 font-medium mb-2">Password</label>
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Password"
            class="w-full px-4 py-3 pr-12 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:scale-103 transition-all duration-300"
          />
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="absolute right-3 top-[46px] text-gray-300 hover:text-white"
          >
            <component :is="showPassword ? EyeOff : Eye" class="w-5 h-5" />
          </button>
          <p v-if="passwordError" class="mt-1 text-red-500 text-sm">
            {{ passwordError }}
          </p>
        </div>

        <!-- Role dropdown (full width) -->
        <div class="relative md:col-span-2">
          <label class="block text-gray-300 font-medium mb-2">Role</label>
          <button
            type="button"
            @click="showRoleDropdown = !showRoleDropdown"
            class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white flex justify-between items-center focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <span>{{ role }}</span>
            <ChevronDown
              :class="[
                'w-5 h-5 transition-transform',
                showRoleDropdown ? 'rotate-180' : 'rotate-0',
              ]"
            />
          </button>

          <transition name="dropdown-fade">
            <ul
              v-if="showRoleDropdown"
              class="absolute z-20 w-full mt-1 bg-white border border-gray-700 shadow-lg"
            >
              <li
                v-for="r in roles"
                :key="r"
                @click="
                  role = r;
                  showRoleDropdown = false;
                "
                class="px-4 py-2 cursor-pointer hover:bg-blue-100 transition"
              >
                {{ r }}
              </li>
            </ul>
          </transition>
        </div>
      </div>

      <!-- Register button -->
      <button
        @click="register"
        class="w-full mt-6 text-md py-3 font-medium rounded-full bg-linear-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-500 hover:to-blue-600 shadow-lg transform hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-2"
        :disabled="loading"
      >
        <LoadingSpinner v-if="loading" class="h-5 w-5" />
        <span>{{ loading ? "Memproses..." : "Register" }}</span>
      </button>
    </div>
  </div>

  <LoadingSpinner v-if="loading" />
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-scale-enter-active,
.modal-scale-leave-active {
  transition: transform 0.3s;
}
.modal-scale-enter-from,
.modal-scale-leave-to {
  transform: scale(0.9);
}

/* Dropdown animation */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: all 0.2s ease;
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
.dropdown-fade-enter-to,
.dropdown-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
