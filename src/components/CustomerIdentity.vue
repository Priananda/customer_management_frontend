<script setup>
import { ref, computed, onMounted } from "vue";
import api from "../api/api";

const BACKEND_URL = "http://127.0.0.1:8000";
/* ================= STATE ================= */
const showForm = ref(false);
const selectedDeal = ref(null);
const deals = ref([]);
const identities = ref([]);
const newFiles = ref([]);
const search = ref("");

const currentPage = ref(1);
const perPage = 5;

/* ================= FORM ================= */
const form = ref({
  id: null,
  id_customer: "",
  tanggal_lahir: "",
  files: [],
});

const isEditMode = computed(() => !!form.value.id);

/* ================= LOAD DATA ================= */
const loadDeals = async () => {
  const res = await api.get("/deal-customer");
  const raw = res.data?.data || [];
  deals.value = Array.from(
    new Map(raw.map((d) => [d.new_customer_id, d])).values()
  );
};

const loadIdentities = async () => {
  const res = await api.get("/customer-identities");
  identities.value = res.data;
};

/* ================= SEARCH & PAGINATION ================= */
const filteredData = computed(() =>
  identities.value.filter((i) =>
    i.deal_customer?.new_customer?.name
      ?.toLowerCase()
      .includes(search.value.toLowerCase())
  )
);

const totalPages = computed(() =>
  Math.ceil(filteredData.value.length / perPage)
);

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * perPage;
  return filteredData.value.slice(start, start + perPage);
});

/* ================= FILE ================= */
const handleFileChange = (e) => {
  newFiles.value.push(...Array.from(e.target.files));
};

const removeNewFile = (index) => {
  newFiles.value.splice(index, 1);
};

/* ================= ACTION ================= */
const handleSubmit = async () => {
  const payload = new FormData();
  payload.append("deal_customer_id", selectedDeal.value.id);
  payload.append("id_customer", form.value.id_customer ?? "");
  payload.append("tanggal_lahir", form.value.tanggal_lahir ?? "");
  payload.append("keep_files", JSON.stringify(form.value.files ?? []));

  newFiles.value.forEach((f) => payload.append("files[]", f));

  if (isEditMode.value) {
    await api.post(`/customer-identities/${form.value.id}`, payload);
  } else {
    await api.post("/customer-identities", payload);
  }

  resetForm();
  showForm.value = false;
  loadIdentities();
};

// const editItem = (item) => {
//   form.value = { ...item };
//   selectedDeal.value = deals.value.find((d) => d.id === item.deal_customer_id);
//   newFiles.value = [];
//   showForm.value = true;
// };
const editItem = (item) => {
  form.value = {
    id: item.id,
    id_customer: item.id_customer,
    tanggal_lahir: item.tanggal_lahir,
    files: [...(item.files || [])], // ⬅️ WAJIB COPY
  };

  selectedDeal.value = deals.value.find((d) => d.id === item.deal_customer_id);

  newFiles.value = [];
  showForm.value = true;
};

const cancelEdit = () => {
  resetForm();
  selectedDeal.value = null;
  showForm.value = false;
};

const deleteItem = async (id) => {
  if (!confirm("Hapus data ini?")) return;
  await api.delete(`/customer-identities/${id}`);
  loadIdentities();
};

const resetForm = () => {
  form.value = {
    id: null,
    id_customer: "",
    tanggal_lahir: "",
    files: [],
  };
  newFiles.value = [];
};

const resetSearch = () => {
  search.value = "";
  currentPage.value = 1;
};

/* ================= INIT ================= */
onMounted(() => {
  loadDeals();
  loadIdentities();
});

const showFileModal = ref(false);
const activeFiles = ref([]);
const openFileModal = (files) => {
  activeFiles.value = files || [];
  showFileModal.value = true;
};

const closeFileModal = () => {
  showFileModal.value = false;
  activeFiles.value = [];
};
const downloadFile = (filename) => {
  window.open(`${BACKEND_URL}/customer-identities/file/${filename}`, "_blank");
};

const isImage = (filename) => {
  return /\.(jpg|jpeg|png)$/i.test(filename);
};

const fileUrl = (filename) => {
  return `${BACKEND_URL}/storage/customer_identity/${filename}`;
};

const removeExistingFile = (index) => {
  form.value.files.splice(index, 1);
};
</script>

<template>
  <div class="max-w-6xl mx-auto p-6 space-y-6">
    <!-- HEADER -->
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold text-gray-800">Customer Identity</h1>
      <button
        @click="showForm = !showForm"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl shadow"
      >
        {{ showForm ? "Tutup Form" : "Tambah Data" }}
      </button>
    </div>

    <!-- FORM -->
    <div v-if="showForm" class="bg-white shadow-xl rounded-2xl p-6 space-y-5">
      <select v-model="selectedDeal" class="w-full border rounded-xl p-3">
        <option :value="null">Pilih Customer</option>
        <option v-for="d in deals" :key="d.id" :value="d">
          {{ d.new_customer.name }}
        </option>
      </select>

      <input
        v-model="form.id_customer"
        placeholder="ID Customer (KTP / Passport)"
        class="w-full border rounded-xl p-3"
      />

      <input
        type="date"
        v-model="form.tanggal_lahir"
        class="w-full border rounded-xl p-3"
      />

      <!-- FILE INPUT -->
      <input
        type="file"
        multiple
        @change="handleFileChange"
        class="w-full border rounded-xl p-3"
      />

      <!-- FILE PREVIEW -->
      <div v-if="newFiles.length" class="space-y-2">
        <div
          v-for="(file, index) in newFiles"
          :key="index"
          class="flex justify-between items-center bg-gray-50 border rounded-xl px-4 py-2"
        >
          <span class="text-sm text-gray-700 truncate">
            📎 {{ file.name }}
          </span>
          <button
            type="button"
            @click="removeNewFile(index)"
            class="text-red-500 hover:text-red-700 font-bold"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- FILE LAMA (EDIT MODE) -->
      <div v-if="isEditMode && form.files?.length" class="space-y-2">
        <p class="text-sm font-semibold text-gray-600">File Tersimpan</p>

        <div
          v-for="(file, index) in form.files"
          :key="index"
          class="flex justify-between items-center bg-blue-50 border rounded-xl px-4 py-2"
        >
          <span class="text-sm text-gray-700 truncate"> 📎 {{ file }} </span>

          <!-- ICON HAPUS -->
          <button
            type="button"
            @click="removeExistingFile(index)"
            class="text-red-500 hover:text-red-700 font-bold"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- BUTTON -->
      <div class="flex gap-3">
        <button
          @click="handleSubmit"
          class="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl shadow"
        >
          {{ isEditMode ? "Update" : "Simpan" }}
        </button>

        <button
          v-if="isEditMode"
          @click="cancelEdit"
          class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-xl"
        >
          Batal Edit
        </button>
      </div>
    </div>

    <!-- SEARCH -->
    <div class="flex gap-3">
      <input
        v-model="search"
        placeholder="Cari nama customer..."
        class="flex-1 border rounded-xl p-3"
      />
      <button
        @click="resetSearch"
        class="bg-gray-200 hover:bg-gray-300 px-5 rounded-xl"
      >
        Reset
      </button>
    </div>

    <!-- TABLE -->
    <div class="bg-white shadow-xl rounded-2xl overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-100">
          <tr>
            <th class="p-3 text-left">Customer</th>
            <th class="p-3 text-left">Passport/Ktp</th>
            <th class="p-3 text-left">Tanggal Lahir</th>
            <th class="p-3 text-left">File</th>
            <th class="p-3 text-left">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in paginatedData"
            :key="item.id"
            class="border-t hover:bg-gray-50"
          >
            <td class="p-3 font-semibold">
              {{ item.deal_customer.new_customer.name }}
            </td>
            <td class="p-3">{{ item.id_customer || "-" }}</td>
            <td class="p-3">{{ item.tanggal_lahir || "-" }}</td>
            <td class="p-3">
              <button
                v-if="item.files && item.files.length"
                @click="openFileModal(item.files)"
                class="text-indigo-600 hover:underline text-sm"
              >
                Lihat File ({{ item.files.length }})
              </button>
              <span v-else class="text-gray-400 text-sm">-</span>
            </td>

            <td class="p-3 space-x-3">
              <button
                @click="editItem(item)"
                class="text-indigo-600 hover:underline"
              >
                Edit
              </button>
              <button
                @click="deleteItem(item.id)"
                class="text-red-600 hover:underline"
              >
                Hapus
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PAGINATION -->
    <div class="flex justify-between items-center">
      <button
        @click="currentPage--"
        :disabled="currentPage === 1"
        class="px-4 py-2 rounded-xl bg-gray-200 disabled:opacity-50"
      >
        Prev
      </button>

      <span class="font-medium">
        Page {{ currentPage }} / {{ totalPages }}
      </span>

      <button
        @click="currentPage++"
        :disabled="currentPage === totalPages"
        class="px-4 py-2 rounded-xl bg-gray-200 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  </div>

  <!-- FILE MODAL -->
  <div
    v-if="showFileModal"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
  >
    <div class="bg-white w-11/12 max-w-2xl rounded-2xl shadow-xl p-6 space-y-4">
      <!-- HEADER -->
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-bold text-gray-800">File Customer Identity</h2>
        <button
          @click="closeFileModal"
          class="text-gray-500 hover:text-red-600 text-xl"
        >
          ✕
        </button>
      </div>

      <!-- GRID FILE -->
      <div
        v-if="activeFiles.length"
        class="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <div
          v-for="(file, index) in activeFiles"
          :key="index"
          class="border rounded-xl p-4 bg-gray-50 space-y-3"
        >
          <!-- IMAGE PREVIEW -->
          <img
            v-if="isImage(file)"
            :src="fileUrl(file)"
            class="w-full h-40 object-cover rounded-lg border"
          />

          <!-- NON IMAGE -->
          <div v-else class="text-sm text-gray-700 truncate">📎 {{ file }}</div>

          <!-- ACTION -->
          <button
            @click="downloadFile(file)"
            class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm"
          >
            Download
          </button>
        </div>
      </div>

      <div v-else class="text-gray-500 text-center py-6">Tidak ada file</div>
    </div>
  </div>
</template>
