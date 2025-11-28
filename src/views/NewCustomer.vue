<script setup>
import { ref, computed, onMounted } from "vue";
import api from "../api/api";

// Auth
const token = localStorage.getItem("access_token");
if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

const user = JSON.parse(localStorage.getItem("user") || "{}");
const role = user.role;

// State
const searchKeyword = ref("");
const filterDate = ref("");
const filterProgress = ref("all");
const selectedSegmen = ref("all");
const newCustomers = ref([]);
const editId = ref(null);

const form = ref({
  date: "",
  phone: "",
  name: "",
  progress: "",
  pic: "",
  segmen: "",
  via: "",
  country: "",
  social_media_id: "",
  tour_packages: "",
  check_in: "",
  check_out: "",
  hotel: "",
  notes: "",
});

// Fetch Data API
const getNewCustomers = async () => {
  try {
    const res = await api.get("/new-customer");
    newCustomers.value = res.data.data.map((c) => ({
      id: c.id,
      date: c.date ?? "",
      phone: c.phone ?? "",
      name: c.name ?? "",
      progress: c.progress ?? "",
      pic: c.pic ?? "",
      segmen: c.segmen ?? "",
      via: c.via ?? "",
      country: c.country ?? "",
      social_media_id: c.social_media_id ?? "",
      tour_packages: c.tour_packages ?? "",
      check_in: c.check_in ?? "",
      check_out: c.check_out ?? "",
      hotel: c.hotel ?? "",
      notes: c.notes ?? "",
    }));
  } catch (err) {
    console.error("Error fetching customers:", err);
  }
};

// Submit Form
const submitForm = async () => {
  try {
    if (editId.value) {
      await api.put(`/new-customer/${editId.value}`, form.value);
    } else {
      await api.post("/new-customer", form.value);
    }

    resetForm();
    await getNewCustomers();
  } catch (err) {
    console.error("Error submitting form:", err);
  }
};

// Edit
const editCustomer = (customer) => {
  editId.value = customer.id;

  Object.keys(form.value).forEach((key) => {
    form.value[key] = customer[key] ?? "";
  });
};

// Delete
const deleteNewCustomer = async (id) => {
  try {
    if (!confirm("Are you sure?")) return;
    await api.delete(`/new-customer/${id}`);
    await getNewCustomers();
  } catch (err) {
    console.error("Error deleting customer:", err);
  }
};

// Reset Form untuk mengkosongkan input dan memulai create baru
const resetForm = () => {
  Object.keys(form.value).forEach((key) => (form.value[key] = ""));
  editId.value = null;
};

// Di Mount
onMounted(() => {
  if (["admin", "super_admin", "pic", "staff"].includes(role)) {
    getNewCustomers();
  }
});

// Search & Filter
const filteredCustomers = computed(() => {
  return newCustomers.value.filter((c) => {
    // Search field
    const keyword = searchKeyword.value.toLowerCase();
    const matchesKeyword =
      c.date.toLowerCase().includes(keyword) ||
      c.phone.toLowerCase().includes(keyword) ||
      c.name.toLowerCase().includes(keyword) ||
      c.progress.toLowerCase().includes(keyword) ||
      c.pic.toLowerCase().includes(keyword) ||
      c.segmen.toLowerCase().includes(keyword) ||
      c.via.toLowerCase().includes(keyword) ||
      c.country.toLowerCase().includes(keyword) ||
      c.social_media_id.toLowerCase().includes(keyword) ||
      c.tour_packages.toLowerCase().includes(keyword) ||
      c.check_in.toLowerCase().includes(keyword) ||
      c.check_out.toLowerCase().includes(keyword) ||
      c.hotel.toLowerCase().includes(keyword) ||
      c.notes.toLowerCase().includes(keyword);

    // Date
    const matchesDate = filterDate.value ? c.date === filterDate.value : true;

    // Progress
    const matchesProgress =
      filterProgress.value && filterProgress.value !== "all"
        ? c.progress === filterProgress.value
        : true;

    // Segment
    const matchesSegmen =
      selectedSegmen.value && selectedSegmen.value !== "all"
        ? c.segmen.toLowerCase() === selectedSegmen.value.toLowerCase()
        : true;

    return matchesKeyword && matchesDate && matchesProgress && matchesSegmen;
  });
});

// Unik Segment
const uniqueSegmens = computed(() => {
  const segmens = new Set();
  newCustomers.value.forEach((c) => {
    if (c.segmen) segmens.add(c.segmen);
  });
  return Array.from(segmens);
});

// Dowload File CSV
const downloadCSV = () => {
  const headers = [
    "Date",
    "Phone",
    "Name",
    "Progress",
    "PIC",
    "Segmen",
    "Via",
    "Country",
    "Social Media ID",
    "Tour Packages",
    "Check In",
    "Check Out",
    "Hotel",
    "Notes",
  ];

  const rows = filteredCustomers.value.map((c) => [
    c.date,
    c.phone,
    c.name,
    c.progress,
    c.pic,
    c.segmen,
    c.via,
    c.country,
    c.social_media_id,
    c.tour_packages,
    c.check_in,
    c.check_out,
    c.hotel,
    c.notes,
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers, ...rows].map((e) => e.join(",")).join("\n");

  // Menyiapkan agar url agar valid dimasukkan
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  // Proses menyiapkan akan di dowload
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "new_customers.csv");

  // Proses mendowload
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Reset Filters
const resetFilters = () => {
  searchKeyword.value = "";
  filterDate.value = "";
  filterProgress.value = "all";
  selectedSegmen.value = "all";
};
</script>

<template>
  <div class="p-4 max-w-6xl mx-auto">
    <h2 class="text-2xl font-bold mb-4">New Customers</h2>
    <form
      @submit.prevent="submitForm"
      class="mb-6 grid grid-cols-2 gap-4 bg-white p-4 rounded-lg shadow"
    >
      <input v-model="form.date" type="date" placeholder="Date" class="input" />
      <input v-model="form.phone" placeholder="Phone" class="input" />
      <input v-model="form.name" placeholder="Customer Name" class="input" />

      <select v-model="form.progress" class="input">
        <option value="">Select progress</option>
        <option value="on progress">On Progress</option>
        <option value="deal">Deal</option>
        <option value="canceled">Canceled</option>
      </select>

      <input v-model="form.pic" placeholder="PIC" class="input" />
      <input v-model="form.segmen" placeholder="Segmen" class="input" />
      <input v-model="form.via" placeholder="Via" class="input" />
      <input v-model="form.country" placeholder="Country" class="input" />
      <input
        v-model="form.social_media_id"
        placeholder="Social Media ID"
        class="input"
      />
      <input
        v-model="form.tour_packages"
        placeholder="Tour Packages"
        class="input"
      />
      <input
        v-model="form.check_in"
        type="date"
        placeholder="Check In"
        class="input"
      />
      <input
        v-model="form.check_out"
        type="date"
        placeholder="Check Out"
        class="input"
      />
      <input v-model="form.hotel" placeholder="Hotel" class="input" />

      <textarea
        v-model="form.notes"
        placeholder="Notes"
        class="input col-span-2"
      ></textarea>

      <button
        type="submit"
        class="col-span-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded"
      >
        {{ editId ? "Update Customer" : "Create Customer" }}
      </button>

      <button
        v-if="editId"
        type="button"
        @click="resetForm"
        class="col-span-2 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded"
      >
        Cancel
      </button>
    </form>

    <div class="mb-4 flex flex-wrap gap-2 items-end">
      <!-- Search -->
      <div>
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="Search..."
          class="input"
        />
      </div>

      <!-- Filter Date -->
      <div>
        <input v-model="filterDate" type="date" class="input" />
      </div>

      <!-- Filter Progress -->
      <div>
        <select v-model="filterProgress" class="input">
          <option value="all">All Progress</option>
          <option value="on progress">On Progress</option>
          <option value="deal">Deal</option>
          <option value="canceled">Canceled</option>
        </select>
      </div>

      <!-- Filter Segmen -->
      <div>
        <select v-model="selectedSegmen" class="input">
          <option value="all">All Segmen</option>
          <option
            v-for="segment in uniqueSegmens"
            :key="segment"
            :value="segment"
          >
            {{ segment }}
          </option>
        </select>
      </div>

      <!-- Download CSV -->
      <div>
        <button
          @click="downloadCSV"
          class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
        >
          Download CSV
        </button>
        <button
          @click="resetFilters"
          class="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded"
        >
          Reset Filters
        </button>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full bg-white border rounded-lg shadow">
        <thead class="bg-cyan-600 text-white">
          <tr>
            <th class="px-4 py-2">Date</th>
            <th class="px-4 py-2">Phone</th>
            <th class="px-4 py-2">Name</th>
            <th class="px-4 py-2">Progress</th>
            <th class="px-4 py-2">PIC</th>
            <th class="px-4 py-2">Segmen</th>
            <th class="px-4 py-2">Via</th>
            <th class="px-4 py-2">Country</th>
            <th class="px-4 py-2">SM ID</th>
            <th class="px-4 py-2">Tour Packages</th>
            <th class="px-4 py-2">Check In</th>
            <th class="px-4 py-2">Check Out</th>
            <th class="px-4 py-2">Hotel</th>
            <th class="px-4 py-2">Notes</th>
            <th class="px-4 py-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="c in filteredCustomers"
            :key="c.id"
            class="border-b hover:bg-gray-50"
          >
            <td class="px-4 py-2">{{ c.date }}</td>
            <td class="px-4 py-2">{{ c.phone }}</td>
            <td class="px-4 py-2">{{ c.name }}</td>
            <td class="px-4 py-2">{{ c.progress }}</td>
            <td class="px-4 py-2">{{ c.pic }}</td>
            <td class="px-4 py-2">{{ c.segmen }}</td>
            <td class="px-4 py-2">{{ c.via }}</td>
            <td class="px-4 py-2">{{ c.country }}</td>
            <td class="px-4 py-2">{{ c.social_media_id }}</td>
            <td class="px-4 py-2">{{ c.tour_packages }}</td>
            <td class="px-4 py-2">{{ c.check_in }}</td>
            <td class="px-4 py-2">{{ c.check_out }}</td>
            <td class="px-4 py-2">{{ c.hotel }}</td>
            <td class="px-4 py-2">{{ c.notes }}</td>

            <td class="px-4 py-2 space-x-2">
              <button
                v-if="['admin', 'staff', 'super_admin', 'pic'].includes(role)"
                @click="editCustomer(c)"
                class="bg-yellow-500 hover:bg-yellow-600 text-black px-2 py-1 rounded"
              >
                Edit
              </button>

              <button
                v-if="['admin', 'staff', 'super_admin', 'pic'].includes(role)"
                @click="deleteNewCustomer(c.id)"
                class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
