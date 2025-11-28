<script setup>
import { ref, computed, onMounted } from "vue";
import api from "../api/api";

// State
const selectedCustomer = ref(null);
const deals = ref([]);
const newCustomers = ref([]);
const searchKeyword = ref("");
const filterDate = ref("");
const filterProgress = ref("all");
const selectedSegmen = ref("all");

const dealForm = ref({
  id: null,
  new_customer_id: "",
  handler: "",
  link_drive: "",
  total_pax: "",
  activity: "",
  payment_status: null,
});

// Fetch Data API
const loadData = async () => {
  const nc = await api.get("/new-customer");
  newCustomers.value = nc.data.data;

  const dc = await api.get("/deal-customer");
  deals.value = dc.data.data;
};

// Fungsi ketika pilih PIC
const onSelectCustomer = () => {
  selectedCustomer.value = newCustomers.value.find(
    (c) => c.id == dealForm.value.new_customer_id
  );
};

// Submit Form
const saveDeal = async () => {
  const fd = new FormData();

  Object.keys(dealForm.value).forEach((key) => {
    if (key === "payment_status" && dealForm.value[key] === null) return;

    fd.append(key, dealForm.value[key]);
  });

  if (!dealForm.value.id) {
    await api.post("/deal-customer", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  } else {
    await api.post(`/deal-customer/${dealForm.value.id}?_method=PUT`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  reset();
  loadData();
};

// Edit
const editDeal = (d) => {
  dealForm.value = {
    id: d.id,
    new_customer_id: d.new_customer_id,
    handler: d.handler,
    link_drive: d.link_drive,
    total_pax: d.total_pax,
    activity: d.activity,
    payment_status: null,
  };
  selectedCustomer.value = d.new_customer;
};

// Delete
const deleteDeal = async (id) => {
  await api.delete(`/deal-customer/${id}`);
  loadData();
};

// Reset Form untuk mengkosongkan input dan memulai create baru
const reset = () => {
  dealForm.value = {
    id: null,
    new_customer_id: "",
    handler: "",
    link_drive: "",
    total_pax: "",
    activity: "",
    payment_status: null,
  };
  selectedCustomer.value = null;
};

// Di Mount
onMounted(loadData);

// Search & Filter
const filteredDeals = computed(() => {
  return deals.value.filter((d) => {
    const c = d.new_customer;
    if (!c) return false;

    const keyword = searchKeyword.value.toLowerCase();

    // Gabung semua field yang mau dicari keyword
    const allFields = [
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
      d.handler,
      d.link_drive,
      String(d.total_pax), // convert number ke string
      d.activity,
      d.payment_status ? d.payment_status.name || String(d.payment_status) : "",
    ].map((f) => f?.toLowerCase() || "");

    const matchesKeyword = allFields.some((f) => f.includes(keyword));

    // Date filter
    const matchesDate = filterDate.value ? c.date === filterDate.value : true;

    // Progress filter
    const matchesProgress =
      filterProgress.value && filterProgress.value !== "all"
        ? c.progress === filterProgress.value
        : true;

    // Segment filter
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
  deals.value.forEach((d) => {
    const c = d.new_customer;
    if (c && c.segmen) segmens.add(c.segmen);
  });
  return Array.from(segmens);
});

// Dowload File CSV
const downloadCSV = () => {
  const headers = [
    "Customer Name",
    "PIC",
    "Date",
    "Phone",
    "Progress",
    "Segmen",
    "Country",
    "Tour Packages",
    "Check In",
    "Check Out",
    "Hotel",
    "Handler",
    "Link Drive",
    "Total Pax",
    "Activity",
    "Payment Status",
  ];

  const rows = filteredDeals.value.map((d) => {
    const c = d.new_customer || {};
    return [
      c.name || "",
      c.pic || "",
      c.date || "",
      c.phone || "",
      c.progress || "",
      c.segmen || "",
      c.country || "",
      c.tour_packages || "",
      c.check_in || "",
      c.check_out || "",
      c.hotel || "",
      d.handler || "",
      d.link_drive || "",
      d.total_pax != null ? d.total_pax : "",
      d.activity || "",
      d.payment_status ? d.payment_status.name || d.payment_status : "",
    ];
  });

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers, ...rows].map((e) => e.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "deal_customers.csv");
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
  <div class="p-4">
    <h2 class="text-xl font-bold mb-4">Deal Customers</h2>

    <div class="border p-4 bg-white shadow mb-6">
      <h3 class="font-semibold mb-3">Form Deal Customer</h3>

      <select
        v-model="dealForm.new_customer_id"
        @change="onSelectCustomer"
        class="border p-2 w-full mb-2"
      >
        <option value="">Pilih Customer...</option>
        <option v-for="nc in newCustomers" :key="nc.id" :value="nc.id">
          {{ nc.name }}
        </option>
      </select>

      <div v-if="selectedCustomer" class="mb-3 p-3 bg-gray-100 border rounded">
        <p><b>PIC:</b> {{ selectedCustomer.pic }}</p>
        <p><b>Date:</b> {{ selectedCustomer.date }}</p>
        <p><b>Phone:</b> {{ selectedCustomer.phone }}</p>
        <p><b>Guest Name:</b> {{ selectedCustomer.name }}</p>
        <p><b>Progress:</b> {{ selectedCustomer.progress }}</p>
        <p><b>Segmen:</b> {{ selectedCustomer.segmen }}</p>
        <p><b>Country:</b> {{ selectedCustomer.country }}</p>
        <p><b>Tour Packages:</b> {{ selectedCustomer.tour_packages }}</p>
        <p><b>Check In:</b> {{ selectedCustomer.check_in }}</p>
        <p><b>Check Out:</b> {{ selectedCustomer.check_out }}</p>
        <p><b>Hotel:</b> {{ selectedCustomer.hotel }}</p>
      </div>

      <input
        v-model="dealForm.handler"
        class="border p-2 w-full mb-2"
        placeholder="Handler"
      />
      <input
        v-model="dealForm.link_drive"
        class="border p-2 w-full mb-2"
        placeholder="Link Drive"
      />
      <input
        v-model="dealForm.total_pax"
        type="number"
        class="border p-2 w-full mb-2"
        placeholder="Total Pax"
      />
      <input
        v-model="dealForm.activity"
        class="border p-2 w-full mb-2"
        placeholder="Activity"
      />

      <input
        type="file"
        @change="(e) => (dealForm.payment_status = e.target.files[0])"
        class="border p-2 w-full mb-2"
      />

      <button
        @click="saveDeal"
        class="mt-3 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Save Deal
      </button>
    </div>

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

    <table class="w-full border bg-white shadow">
      <thead class="bg-blue-600 text-white">
        <tr>
          <th class="p-2">Customer Name</th>
          <th class="p-2">PIC</th>
          <th class="p-2">Date</th>
          <th class="p-2">Phone</th>
          <th class="p-2">Progress</th>
          <th class="p-2">Segmen</th>
          <th class="p-2">Country</th>
          <th class="p-2">Tour Packages</th>
          <th class="p-2">Check In</th>
          <th class="p-2">Check Out</th>
          <th class="p-2">Hotel</th>

          <th class="p-2">Handler</th>
          <th class="p-2">Link Drive</th>
          <th class="p-2">Total Pax</th>
          <th class="p-2">Activity</th>
          <th class="p-2">Payment Status</th>
          <th class="p-2">Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="d in filteredDeals" :key="d.id">
          <td class="p-2">{{ d.new_customer?.name }}</td>
          <td class="p-2">{{ d.new_customer?.pic }}</td>
          <td class="p-2">{{ d.new_customer?.date }}</td>
          <td class="p-2">{{ d.new_customer?.phone }}</td>
          <td class="p-2">{{ d.new_customer?.progress }}</td>
          <td class="p-2">{{ d.new_customer?.segmen }}</td>
          <td class="p-2">{{ d.new_customer?.country }}</td>
          <td class="p-2">{{ d.new_customer?.tour_packages }}</td>
          <td class="p-2">{{ d.new_customer?.check_in }}</td>
          <td class="p-2">{{ d.new_customer?.check_out }}</td>
          <td class="p-2">{{ d.new_customer?.hotel }}</td>

          <td class="p-2">{{ d.handler }}</td>
          <td class="p-2">{{ d.link_drive }}</td>
          <td class="p-2">{{ d.total_pax }}</td>
          <td class="p-2">{{ d.activity }}</td>
          <td class="p-2">{{ d.payment_status }}</td>

          <td class="p-2">
            <button
              @click="editDeal(d)"
              class="px-2 py-1 bg-yellow-500 rounded"
            >
              Edit
            </button>
            <button
              @click="deleteDeal(d.id)"
              class="px-2 py-1 bg-red-600 text-white rounded"
            >
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
