<script setup>
import { Eye, EyeOff } from "lucide-vue-next";
import LoadingSpinner from "../components/Loading.vue";
import { ref, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";
import { useRouter } from "vue-router";
import BgAuth from "../assets/images/bg-auth.jpg";

const router = useRouter();
const auth = useAuthStore();

// State
const email = ref("");
const password = ref("");
const showPassword = ref(false);
const emailError = ref("");
const passwordError = ref("");
const modalMsg = ref("");
const modalType = ref("");
const showModal = ref(false);
const loading = ref(false);

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

onMounted(() => {
  email.value = "";
  password.value = "";
  emailError.value = "";
  passwordError.value = "";
  modalMsg.value = "";
  modalType.value = "";
  showModal.value = false;
});

const login = async () => {
  loading.value = true;

  emailError.value = "";
  passwordError.value = "";
  modalMsg.value = "";
  modalType.value = "";

  if (!email.value) emailError.value = "Email wajib diisi!";
  else if (!validateEmail(email.value)) emailError.value = "Email tidak valid!";

  if (!password.value) passwordError.value = "Password wajib diisi!";

  if (emailError.value || passwordError.value) {
    modalMsg.value = "Tolong periksa input Anda!";
    modalType.value = "error";
    showModal.value = true;
    loading.value = false;
    return;
  }

  try {
    await auth.login({
      email: email.value,
      password: password.value,
    });

    if (auth.role !== "admin") {
      passwordError.value = "Hanya Admin yang bisa login di halaman ini";
      modalMsg.value = "Login gagal!";
      modalType.value = "error";
      showModal.value = true;
      loading.value = false;
      return;
    }

    modalMsg.value = "Berhasil! Mohon tunggu sebentar...";
    modalType.value = "success";
    showModal.value = true;

    setTimeout(() => {
      showModal.value = false;
      router.push("/dashboard/home");
    }, 1500);
  } catch (err) {
    modalMsg.value = "Harap masukan email dan password dengan benar";
    console.error(err.response?.data?.message || err.message);
    modalType.value = "error";
    showModal.value = true;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div
    class="relative container mx-auto flex items-center justify-center min-h-screen px-2 bg-cover bg-center bg-no-repeat"
    :style="{ backgroundImage: `url(${BgAuth})` }"
  >
    <!-- Overlay -->
    <div class="absolute inset-0 bg-black/60"></div>
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
              {{ modalType === "error" ? "Login Gagal" : "Login Berhasil" }}
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
      class="relative z-10 bg-slate-800/40 backdrop-blur-md rounded-2xl p-10 w-full max-w-md border border-cyan-700 shadow-[0_0_5px_#06b6d4]"
    >
      <h2 class="text-3xl font-semibold mb-4 text-center text-white">
        Login Admin
      </h2>
      <p class="text-center text-gray-300 mb-4">
        Please enter your credentials to continue.
      </p>

      <!-- Email -->
      <div class="mb-6">
        <label class="block text-gray-300 font-medium mb-2">Email</label>
        <input
          v-model="email"
          type="email"
          placeholder="Your Email"
          class="w-full px-5 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:scale-103 transition-all duration-300"
        />
        <p v-if="emailError" class="mt-1 text-red-500 text-sm">
          {{ emailError }}
        </p>
      </div>

      <!-- Password -->
      <div class="mb-7 relative">
        <label class="block text-gray-300 font-medium mb-2">Password</label>
        <input
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Password"
          class="w-full px-5 py-3 pr-12 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:scale-103 transition-all duration-300"
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

      <button
        @click="login"
        class="w-full text-md py-3 font-medium rounded-full bg-linear-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-500 hover:to-blue-600 shadow-lg transform hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-2"
        :disabled="loading"
      >
        <span>{{ loading ? "Memproses..." : "Login" }}</span>
      </button>
    </div>
    <a
      href="https://www.freepik.com"
      target="_blank"
      rel="noopener noreferrer"
      class="fixed bottom-3 right-4 z-20 text-[10px] text-white/60 hover:text-white transition"
    >
      Background designed by Freepik
    </a>
  </div>
  <LoadingSpinner v-if="loading" />
</template>

<style>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-to,
.modal-fade-leave-from {
  opacity: 1;
}

.modal-scale-enter-active,
.modal-scale-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-scale-enter-from,
.modal-scale-leave-to {
  transform: scale(0.9);
  opacity: 0;
}

.modal-scale-enter-to,
.modal-scale-leave-from {
  transform: scale(1);
  opacity: 1;
}
</style>
