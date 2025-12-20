<script setup>
import { ref, computed, onMounted, watch } from "vue";
import api from "../api/api";
import PersonalData2 from "@/assets/images/personal-data2.png";

import {
  ChevronDown,
  ChevronRight,
  X,
  Pencil,
  Trash2,
  RotateCcw,
} from "lucide-vue-next";

const BACKEND_URL = "http://127.0.0.1:8000";

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

const form = ref({
  id: null,
  id_customer: "",
  tanggal_lahir: "",
  files: [],
});

const isEditMode = computed(() => !!form.value.id);

const loadDeals = async () => {
  const res = await api.get("/deal-customer");
  const raw = res.data?.data || [];

  deals.value = raw.filter((d) => d.new_customer);

  if (!selectedDeal.value && deals.value.length === 1) {
    selectedDeal.value = deals.value[0];
  }
};

const loadIdentities = async () => {
  const res = await api.get("/customer-identities");
  identities.value = res.data;
};

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

const handleFileChange = (e) => {
  newFiles.value.push(...Array.from(e.target.files));
};

const removeNewFile = (index) => {
  newFiles.value.splice(index, 1);
};

const removeExistingFile = (index) => {
  form.value.files.splice(index, 1);
};

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

onMounted(() => {
  loadDeals();
  loadIdentities();
});

watch(search, () => {
  clearTimeout(searchTimeout);

  isLoading.value = true;
  currentPage.value = 1;

  searchTimeout = setTimeout(() => {
    isLoading.value = false;
  }, 400);
});

const isRotating = ref(false);
const resetSearchWithAnimation = () => {
  isRotating.value = true;
  setTimeout(() => {
    isRotating.value = false;
  }, 600);
  resetSearch();
};
</script>

<template>
  <div class="mt-10 space-y-6">
    <div
      class="flex flex-col md:flex-row justify-between items-center border border-slate-200 rounded-lg p-5 bg-white"
    >
      <div class="flex items-center gap-4 mb-5">
        <img
          :src="PersonalData2"
          alt="Personal Data2"
          class="w-14 h-14 object-contain"
        />
        <div>
          <h2 class="text-xl font-semibold text-slate-800 mb-1">
            Customer Identity
          </h2>
          <p class="text-sm text-slate-500">
            Manage customer identity & documents
          </p>
        </div>
      </div>

      <button
        @click="showForm = !showForm"
        class="mt-3 md:mt-0 px-5 py-2 rounded-lg bg-blue-700 text-white font-medium hover:bg-blue-800 transition"
      >
        {{ showForm ? "Close Form" : "Create Data" }}
      </button>
    </div>

    <div
      v-if="showForm"
      class="border border-gray-200 rounded-xl p-6 space-y-6 bg-white shadow-sm"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-1">
          <label class="text-md font-medium text-gray-700">Customer</label>
          <button
            type="button"
            @click="showCustomerModal = true"
            class="mt-2 w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <span class="text-sm text-gray-800 truncate">
              {{
                selectedDeal
                  ? selectedDeal.new_customer.name
                  : "Select Customer"
              }}
            </span>
            <ChevronDown
              class="w-4 h-4 text-gray-500 transition-transform"
              :class="{ 'rotate-180': showCustomerModal }"
            />
          </button>
        </div>

        <div class="space-y-1">
          <label class="text-md font-medium text-gray-700"
            >No Passport / KTP</label
          >
          <input
            v-model="form.id_customer"
            class="mt-2 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
            placeholder="Enter ID number"
          />
        </div>

        <div class="space-y-1">
          <label class="text-md font-medium text-gray-700">Date of Birth</label>
          <input
            type="date"
            v-model="form.tanggal_lahir"
            class="mt-2 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
          />
        </div>
      </div>

      <div class="space-y-2">
        <label class="text-md font-medium text-gray-700"
          >Upload Documents</label
        >
        <input
          type="file"
          multiple
          @change="handleFileChange"
          class="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
        />

        <div v-if="form.files.length" class="space-y-1">
          <p class="text-xs text-gray-500">Saved documents:</p>
          <div
            v-for="(file, index) in form.files"
            :key="index"
            class="flex items-center justify-between bg-gray-100 px-3 py-2 rounded-lg text-sm"
          >
            <span class="truncate">📄 {{ file.split("/").pop() }}</span>
            <button
              type="button"
              @click="removeExistingFile(index)"
              class="text-red-500 hover:text-red-600 transition"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div v-if="newFiles.length" class="space-y-1">
          <p class="text-xs text-gray-500">New files:</p>
          <div
            v-for="(file, index) in newFiles"
            :key="index"
            class="flex items-center justify-between bg-green-50 px-3 py-2 rounded-lg text-sm"
          >
            <span class="truncate">{{ file.name }}</span>
            <button
              type="button"
              @click="removeNewFile(index)"
              class="text-red-500 hover:text-red-600 transition"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div class="flex gap-3 pt-4 border-t border-gray-200">
        <button
          @click="handleSubmit"
          class="px-6 py-2 rounded-lg bg-indigo-700 text-white font-medium hover:bg-indigo-800 transition"
        >
          {{ isEditMode ? "Update" : "Save" }}
        </button>

        <button
          v-if="isEditMode"
          @click="cancelEdit"
          class="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
        >
          Cancel
        </button>
      </div>
    </div>

    <div
      class="flex flex-col sm:flex-row items-center gap-3 border border-slate-200 rounded-lg p-3 bg-white"
    >
      <input
        v-model="search"
        placeholder="Search customer..."
        class="flex-1 p-3 py-1 border border-slate-200 rounded-lg focus:outline-none placeholder:text-sm"
      />

      <button
        @click="resetSearchWithAnimation"
        class="flex items-center gap-2 px-6 py-2 font-medium rounded-lg bg-gray-200 hover:bg-gray-300 transition"
      >
        <RotateCcw
          class="w-5 h-5 transition-transform"
          :class="{ 'rotate-animation': isRotating }"
        />
        Reset
      </button>
    </div>

    <div
      class="border border-slate-200 rounded-lg overflow-x-auto bg-white hidden-scroll"
    >
      <table class="min-w-[700px] w-full text-sm table-fixed">
        <thead class="bg-indigo-700 text-white sticky top-0 z-10">
          <tr>
            <th class="px-4 py-2 w-[10%] text-center">Action</th>
            <th class="px-4 py-2 w-[20%] text-center">Customer</th>
            <th class="px-4 py-2 w-[20%] text-center">Passport / KTP</th>
            <th class="px-4 py-2 w-[18%] text-center">Date of Birth</th>
            <th class="px-4 py-2 w-[12%] text-center">Documents</th>
            <th class="px-4 py-2 w-[10%] text-center">Action</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="isLoading">
            <td colspan="6" class="py-10">
              <div class="flex justify-center">
                <div
                  class="w-8 h-8 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin"
                ></div>
              </div>
            </td>
          </tr>

          <tr
            v-for="item in paginatedData"
            :key="item.id"
            class="border-t border-gray-200 hover:bg-gray-50 transition"
          >
            <td class="px-4 py-2 text-center">
              <div class="flex justify-center gap-3">
                <button
                  @click="editItem(item)"
                  class="text-orange-500 hover:text-orange-600 transition"
                >
                  <Pencil class="w-4 h-4" />
                </button>
                <button
                  @click="deleteItem(item.id)"
                  class="text-red-500 hover:text-red-600 transition"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </td>
            <td
              class="px-4 py-2 text-center truncate font-medium text-gray-800"
            >
              {{ item.deal_customer?.new_customer?.name || "-" }}
            </td>
            <td class="px-4 py-2 text-center">{{ item.id_customer || "-" }}</td>
            <td class="px-4 py-2 text-center">
              {{ item.tanggal_lahir || "-" }}
            </td>
            <td class="px-4 py-2 text-center">
              <span v-if="item.files?.length"
                >{{ item.files.length }} file</span
              >
              <span v-else class="text-gray-400">-</span>
            </td>
            <td class="px-4 py-2 text-center">
              <div class="flex justify-center gap-3">
                <button
                  @click="editItem(item)"
                  class="text-orange-500 hover:text-orange-600 transition"
                >
                  <Pencil class="w-4 h-4" />
                </button>
                <button
                  @click="deleteItem(item.id)"
                  class="text-red-500 hover:text-red-600 transition"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="!isLoading && !paginatedData.length">
            <td colspan="6" class="py-6 text-center text-gray-500">
              Data not found
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-center gap-4 mt-6">
      <button
        @click="currentPage--"
        :disabled="currentPage === 1"
        class="px-3 py-1 text-sm rounded-sm bg-indigo-600 text-white border border-indigo-700 hover:bg-indigo-800 transition disabled:bg-indigo-300 disabled:border-indigo-300"
      >
        Prev
      </button>

      <span class="text-sm font-medium text-gray-600"
        >Page {{ currentPage }} of {{ totalPages }}</span
      >

      <button
        @click="currentPage++"
        :disabled="currentPage === totalPages"
        class="px-3 py-1 text-sm rounded-sm bg-indigo-600 text-white border border-indigo-700 hover:bg-indigo-800 transition disabled:bg-indigo-300 disabled:border-indigo-300"
      >
        Next
      </button>
    </div>

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
        <div
          class="bg-white rounded-xl w-full max-w-md shadow-lg overflow-hidden"
        >
          <div
            class="flex justify-between items-center p-4 border-b border-gray-200"
          >
            <h3 class="font-semibold text-gray-800">Select Customer</h3>
            <button @click="showCustomerModal = false">
              <X class="w-5 h-5 text-gray-800" />
            </button>
          </div>

          <div class="max-h-80 overflow-y-auto">
            <button
              v-for="d in deals"
              :key="d.id"
              @click="
                selectedDeal = d;
                showCustomerModal = false;
              "
              class="w-full text-left px-4 py-3 hover:bg-gray-50 transition"
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

@keyframes rotateAnim {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.rotate-animation {
  animation: rotateAnim 0.6s ease-in-out;
}
</style>
