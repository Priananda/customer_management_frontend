<script setup>
const user = JSON.parse(localStorage.getItem("user") || "{}");
const role = user.role;
</script>

<template>
  <div class="p-6 max-w-3xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">Dashboard</h1>

    <!-- ================= PIC ================= -->
    <div v-if="role === 'pic'">
      <p class="text-gray-700 mb-4">
        Menu PIC: Bisa create NewCustomer & DealCustomer
      </p>

      <div class="flex gap-4">
        <router-link
          to="/new-customer"
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          New Customer
        </router-link>

        <router-link
          to="/deal-customer"
          class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Deal Customer
        </router-link>
      </div>
    </div>

    <!-- ================= STAFF ================= -->
    <div v-if="role === 'staff'">
      <p class="text-gray-700 mb-4">Menu Staff: Bisa update DealCustomer</p>

      <div class="flex gap-4">
        <router-link
          to="/new-customer"
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          New Customer
        </router-link>

        <router-link
          to="/deal-customer"
          class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Deal Customer
        </router-link>
      </div>
    </div>

    <!-- ================= ADMIN & SUPER ADMIN ================= -->
    <div v-if="role === 'admin' || role === 'super_admin'">
      <p class="text-gray-700 mb-4">Full CRUD NewCustomer & DealCustomer</p>

      <div class="flex gap-4">
        <router-link
          to="/new-customer"
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          New Customer
        </router-link>

        <router-link
          to="/deal-customer"
          class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Deal Customer
        </router-link>

        <router-link
          to="/view-data-pic"
          class="px-6 py-3 bg-teal-800 text-white rounded-lg hover:bg-green-700 transition"
        >
          View Data PIC
        </router-link>
        <router-link
          to="/view-data-staff"
          class="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          View Data Staff
        </router-link>
        <!-- === TAMPIL HANYA UNTUK SUPER ADMIN === -->
        <router-link
          v-if="role === 'super_admin'"
          to="/view-data-admin"
          class="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition"
        >
          View Data Admin
        </router-link>
      </div>
    </div>
  </div>
</template>
