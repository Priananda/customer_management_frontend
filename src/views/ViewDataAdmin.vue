<script setup>
import { ref, onMounted } from "vue";
import api from "../api/api";

const dataAdmin = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await api.get("/new-customer");
    dataAdmin.value = res.data.data; // sesuai JSON
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">Data Admin</h1>

    <div v-if="loading">Loading...</div>

    <table v-else class="w-full border text-sm">
      <thead>
        <tr class="bg-gray-200">
          <th class="p-2 border">NO</th>
          <th class="p-2 border">Name</th>
          <th class="p-2 border">Phone</th>
          <th class="p-2 border">PIC</th>
          <th class="p-2 border">Progress</th>
          <th class="p-2 border">Segmen</th>
          <th class="p-2 border">Via</th>
          <th class="p-2 border">Country</th>
          <th class="p-2 border">Social Media</th>
          <th class="p-2 border">Tour Package</th>
          <th class="p-2 border">Check In</th>
          <th class="p-2 border">Check Out</th>
          <th class="p-2 border">Hotel</th>
          <th class="p-2 border">Notes</th>
          <th class="p-2 border">Created At</th>
          <th class="p-2 border">Updated At</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="(item, i) in dataAdmin" :key="item.id">
          <td class="p-2 border">{{ i + 1 }}</td>
          <td class="p-2 border">{{ item.name }}</td>
          <td class="p-2 border">{{ item.phone }}</td>
          <td class="p-2 border">{{ item.pic }}</td>
          <td class="p-2 border">{{ item.progress }}</td>
          <td class="p-2 border">{{ item.segmen }}</td>
          <td class="p-2 border">{{ item.via }}</td>
          <td class="p-2 border">{{ item.country }}</td>
          <td class="p-2 border">{{ item.social_media_id }}</td>
          <td class="p-2 border">{{ item.tour_packages }}</td>
          <td class="p-2 border">{{ item.check_in }}</td>
          <td class="p-2 border">{{ item.check_out }}</td>
          <td class="p-2 border">{{ item.hotel }}</td>
          <td class="p-2 border">{{ item.notes }}</td>
          <td class="p-2 border">{{ item.created_at }}</td>
          <td class="p-2 border">{{ item.updated_at }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
