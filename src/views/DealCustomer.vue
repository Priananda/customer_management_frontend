<script setup>
import { ref, onMounted } from "vue";
import api from "../api/api";

const deals = ref([]);
const newCustomers = ref([]);

const dealForm = ref({
  id: null,
  new_customer_id: "",
  handler: "",
  link_drive: "",
  total_pax: "",
  activity: "",
  payment_status: null,
});

const selectedCustomer = ref(null);

// LOAD DATA
const loadData = async () => {
  const nc = await api.get("/new-customer");
  newCustomers.value = nc.data.data;

  const dc = await api.get("/deal-customer");
  deals.value = dc.data.data;
};

// KETIKA PILIH CUSTOMER
const onSelectCustomer = () => {
  selectedCustomer.value = newCustomers.value.find(
    (c) => c.id == dealForm.value.new_customer_id
  );
};

// SUBMIT FORM (FormData)
const saveDeal = async () => {
  const fd = new FormData();

  Object.keys(dealForm.value).forEach((key) => {
    // ❗ Jangan kirim payment_status jika null (edit tanpa upload)
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

// EDIT
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

// DELETE
const deleteDeal = async (id) => {
  await api.delete(`/deal-customer/${id}`);
  loadData();
};

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

onMounted(loadData);
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

      <!-- FILE UPLOAD -->
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
        <tr v-for="d in deals" :key="d.id">
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
