<script setup>
import { ref, computed, onMounted, watch } from "vue";
import api from "../api/api";
import { ChevronDown, ChevronRight, X, Pencil, Trash2 } from "lucide-vue-next";

const BACKEND_URL = "http://127.0.0.1:8000";

/* ================= STATE ================= */
const showForm = ref(false);
const showCustomerModal = ref(false);
const isLoading = ref(false);
let searchTimeout = null;
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

  // pastikan setiap deal punya new_customer
  deals.value = raw.filter((d) => d.new_customer);

  // auto select jika cuma 1 data
  if (!selectedDeal.value && deals.value.length === 1) {
    selectedDeal.value = deals.value[0];
  }
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

const removeExistingFile = (index) => {
  form.value.files.splice(index, 1);
};

/* ================= ACTION ================= */
const handleSubmit = async () => {
  const payload = new FormData();
  payload.append("deal_customer_id", selectedDeal.value.id);
  payload.append("id_customer", form.value.id_customer);
  payload.append("tanggal_lahir", form.value.tanggal_lahir);
  payload.append("keep_files", JSON.stringify(form.value.files));

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

const editItem = (item) => {
  form.value = {
    id: item.id,
    id_customer: item.id_customer,
    tanggal_lahir: item.tanggal_lahir,
    files: [...(item.files || [])],
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

watch(search, () => {
  clearTimeout(searchTimeout);

  isLoading.value = true; // 🔥 LOADING ON
  currentPage.value = 1;

  searchTimeout = setTimeout(() => {
    isLoading.value = false; // 🔥 LOADING OFF
  }, 400);
});
</script>

<template>
  <div class="mt-10 mx-auto space-y-8 bg-white min-h-screen">
    <!-- HEADER -->
    <div class="border border-slate-200 rounded-xl p-6 flex justify-between">
      <div>
        <h1 class="text-xl font-bold text-slate-800 mb-2">Customer Identity</h1>
        <p class="text-sm text-slate-500">
          Kelola identitas customer & dokumen
        </p>
      </div>

      <button
        @click="showForm = !showForm"
        class="px-5 rounded-lg bg-slate-800 text-white hover:bg-slate-900"
      >
        {{ showForm ? "Close Form" : "Create Data" }}
      </button>
    </div>

    <!-- FORM -->
    <div
      v-if="showForm"
      class="border border-slate-200 rounded-xl p-6 space-y-6"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- CUSTOMER -->
        <div class="space-y-1">
          <label class="text-md font-medium text-slate-600">Customer</label>

          <button
            type="button"
            @click="showCustomerModal = true"
            class="mt-2 w-full flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <span class="text-sm text-slate-700">
              {{
                selectedDeal ? selectedDeal.new_customer.name : "Pilih Customer"
              }}
            </span>

            <ChevronDown
              class="w-4 h-4 text-slate-500 transition-transform"
              :class="{ 'rotate-180': showCustomerModal }"
            />
          </button>
        </div>

        <!-- ID -->
        <div class="space-y-1">
          <label class="text-md font-medium text-slate-600">
            No Passport / KTP
          </label>
          <input
            v-model="form.id_customer"
            class="mt-2 w-full p-3 border border-slate-200 rounded-lg focus:outline-none"
            placeholder="Masukkan nomor identitas"
          />
        </div>

        <!-- DOB -->
        <div class="space-y-1">
          <label class="text-md font-medium text-slate-600">
            Tanggal Lahir
          </label>
          <input
            type="date"
            v-model="form.tanggal_lahir"
            class="mt-2 w-full p-3 border border-slate-200 rounded-lg focus:outline-none"
          />
        </div>
      </div>

      <!-- FILE -->
      <div class="space-y-2">
        <label class="text-md font-medium text-slate-600">
          Upload Dokumen
        </label>

        <input
          type="file"
          multiple
          @change="handleFileChange"
          class="w-full p-3 border border-slate-200 rounded-lg"
        />

        <!-- FILE LAMA (DARI SERVER) -->
        <div v-if="form.files.length" class="space-y-1">
          <p class="text-xs text-slate-500">Dokumen tersimpan:</p>

          <div
            v-for="(file, index) in form.files"
            :key="index"
            class="flex items-center justify-between bg-slate-100 px-3 py-2 rounded-lg text-sm"
          >
            <span class="truncate"> 📄 {{ file.split("/").pop() }} </span>

            <button
              type="button"
              @click="removeExistingFile(index)"
              class="text-red-500 hover:text-red-600"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- FILE BARU -->
        <div v-if="newFiles.length" class="space-y-1">
          <p class="text-xs text-slate-500">File baru:</p>

          <div
            v-for="(file, index) in newFiles"
            :key="index"
            class="flex items-center justify-between bg-green-50 px-3 py-2 rounded-lg text-sm"
          >
            <span class="truncate"> {{ file.name }} </span>

            <button
              type="button"
              @click="removeNewFile(index)"
              class="text-red-500 hover:text-red-600"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- ACTION -->
      <div class="flex gap-3 pt-4 border-t border-slate-200">
        <button
          @click="handleSubmit"
          class="px-6 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-900"
        >
          {{ isEditMode ? "Update" : "Save" }}
        </button>

        <button
          v-if="isEditMode"
          @click="cancelEdit"
          class="px-6 py-2 rounded-lg bg-slate-200"
        >
          Batal
        </button>
      </div>
    </div>

    <!-- SEARCH -->
    <div
      class="border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3"
    >
      <input
        v-model="search"
        placeholder="Cari nama customer..."
        class="flex-1 p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-0"
      />

      <button
        @click="resetSearch"
        class="px-6 py-2 font-medium rounded-lg bg-slate-200 hover:bg-slate-300"
      >
        Reset
      </button>
    </div>

    <!-- TABLE -->
    <div
      class="border border-slate-200 rounded-lg mx-auto max-h-[420px] overflow-x-auto hidden-scroll"
    >
      <table class="min-w-[700px] w-full text-sm table-fixed">
        <!-- HEADER -->
        <thead class="bg-slate-800 text-white sticky top-0 z-10">
          <tr>
            <th class="px-4 py-2 w-[10%] text-center">Action</th>
            <th class="px-4 py-3 w-[20%] text-center">Customer</th>
            <th class="px-4 py-2 w-[20%] text-center">Passport / KTP</th>
            <th class="px-4 py-2 w-[18%] text-center">Tanggal Lahir</th>
            <th class="px-4 py-2 w-[12%] text-center">Dokumen</th>
            <th class="px-4 py-2 w-[10%] text-center">Action</th>
          </tr>
        </thead>

        <tbody>
          <!-- 🔄 LOADING (WAJIB TR, BUKAN DIV) -->
          <tr v-if="isLoading">
            <td colspan="6" class="py-10">
              <div class="flex justify-center">
                <div
                  class="w-8 h-8 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin"
                ></div>
              </div>
            </td>
          </tr>

          <!-- 📄 DATA -->
          <tr
            v-for="item in paginatedData"
            :key="item.id"
            v-else
            class="border-t border-slate-200 hover:bg-slate-50 transition"
          >
            <!-- ACTION -->
            <td class="px-4 py-2 text-center">
              <div class="flex justify-center gap-3">
                <button
                  @click="editItem(item)"
                  class="text-orange-500 hover:text-orange-600"
                >
                  <Pencil class="w-4 h-4" />
                </button>

                <button
                  @click="deleteItem(item.id)"
                  class="text-red-500 hover:text-red-600"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </td>

            <!-- CUSTOMER -->
            <td
              class="px-4 py-2 text-center truncate font-medium text-slate-800"
            >
              {{ item.deal_customer?.new_customer?.name || "-" }}
            </td>

            <!-- ID -->
            <td class="px-4 py-2 text-center">
              {{ item.id_customer || "-" }}
            </td>

            <!-- DOB -->
            <td class="px-4 py-2 text-center">
              {{ item.tanggal_lahir || "-" }}
            </td>

            <!-- FILE -->
            <td class="px-4 py-2 text-center">
              <span v-if="item.files?.length">
                {{ item.files.length }} file
              </span>
              <span v-else class="text-slate-400">-</span>
            </td>

            <!-- ACTION DUPLICATE -->
            <td class="px-4 py-2 text-center">
              <div class="flex justify-center gap-3">
                <button
                  @click="editItem(item)"
                  class="text-orange-500 hover:text-orange-600"
                >
                  <Pencil class="w-4 h-4" />
                </button>

                <button
                  @click="deleteItem(item.id)"
                  class="text-red-500 hover:text-red-600"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>

          <!-- 🚫 EMPTY STATE -->
          <tr v-if="!isLoading && !paginatedData.length">
            <td colspan="6" class="py-6 text-center text-slate-500">
              Data not found
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PAGINATION -->
    <!-- PAGINATION -->
    <div class="flex items-center justify-center gap-4 mt-6">
      <button
        @click="currentPage--"
        :disabled="currentPage === 1"
        class="px-4 py-1 rounded-md bg-slate-700 text-white border border-slate-600 hover:bg-slate-800 transition disabled:bg-slate-400 disabled:border-slate-300 disabled:cursor-not-allowed"
      >
        Prev
      </button>

      <span class="text-sm font-medium text-gray-600">
        Page <span class="text-gray-600">{{ currentPage }}</span>
        of
        <span class="text-gray-600">{{ totalPages }}</span>
      </span>

      <button
        @click="currentPage++"
        :disabled="currentPage === totalPages"
        class="px-4 py-1 rounded-md bg-slate-700 text-white border border-slate-600 hover:bg-slate-800 transition disabled:bg-slate-400 disabled:border-slate-300 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>

    <!-- CUSTOMER MODAL -->
    <Transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="showCustomerModal"
        class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
      >
        <div class="bg-white rounded-xl w-full max-w-md shadow-lg">
          <div class="flex justify-between items-center p-4">
            <h3 class="font-semibold text-slate-800">Pilih Customer</h3>
            <button @click="showCustomerModal = false">
              <X class="w-5 h-5 text-slate-800" />
            </button>
          </div>

          <div class="max-h-80 mb-5 overflow-y-auto">
            <button
              v-for="d in deals"
              :key="d.id"
              @click="
                selectedDeal = d;
                showCustomerModal = false;
              "
              class="w-full text-left px-4 py-3 hover:bg-slate-100"
            >
              {{ d.new_customer.name }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.hidden-scroll {
  overflow: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.hidden-scroll::-webkit-scrollbar {
  display: none;
}
</style>
