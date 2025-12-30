<template>
  <div class="rounded-xl border border-slate-200 bg-white p-5">
    <h3 class="mb-4 font-semibold text-slate-800">Reservation Information</h3>

    <div v-if="loading" class="text-sm text-slate-500">
      Loading reservation...
    </div>

    <div v-else-if="!reservations.length" class="text-sm text-slate-500">
      No reservation data
    </div>

    <div v-else>
      <div class="flex gap-2 mb-5 flex-wrap">
        <button
          v-for="date in tripDates"
          :key="date"
          @click="selectedDate = date"
          class="px-4 py-1.5 rounded-lg border text-sm font-medium transition-all duration-300"
          :class="
            selectedDate === date
              ? 'bg-linear-to-br from-indigo-700 to-blue-700 text-white border-transparent shadow-md'
              : 'bg-white text-slate-600 border-slate-300 hover:bg-gradient-to-r hover:from-indigo-700 hover:to-blue-700 hover:text-white hover:border-transparent'
          "
        >
          {{ formatDate(date) }}
        </button>
      </div>

      <TransitionGroup name="slide" tag="div" class="space-y-6">
        <div
          v-for="(rs, index) in filteredReservations"
          :key="rs.id"
          class="rounded-lg bg-white p-6 text-md shadow border border-slate-200"
        >
          <!-- HEADER -->
          <h4 class="font-semibold text-slate-800 mb-6">
            Reservation: {{ rs.guest_name }}
          </h4>

          <!-- HOTEL -->
          <div class="mb-8">
            <p class="font-semibold text-slate-700 mb-4 text-sm md:text-base">
              🏨 Hotel
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div
                class="rounded-lg bg-slate/90 border border-slate-200 p-5 transition"
              >
                <p class="text-xs text-slate-500 mb-2">Phone</p>
                <p class="font-medium text-slate-700 text-sm">
                  {{ rs.reservation.phone_hotel ?? "-" }}
                </p>
              </div>

              <div
                class="rounded-lg bg-white/90 border border-slate-100 p-5 shadow"
              >
                <p class="text-xs text-slate-500 mb-2">Location</p>
                <p class="font-medium text-slate-700 text-sm">
                  {{ rs.reservation.lokasi_hotel ?? "-" }}
                </p>
              </div>
            </div>
          </div>

          <!-- LUNCH -->
          <div v-if="parseJson(rs.reservation.lunch).length" class="mb-8">
            <p class="font-semibold text-slate-700 mb-4 text-sm">🍱 Lunch</p>

            <div class="grid grid-cols-1 gap-6">
              <div
                v-for="(l, i) in parseJson(rs.reservation.lunch)"
                :key="i"
                class="rounded-lg bg-slate/90 border border-slate-200 p-5 transition"
              >
                <div class="flex justify-between gap-4">
                  <div>
                    <p class="font-semibold text-slate-700 text-sm">
                      {{ l.name ?? "-" }}
                    </p>
                  </div>

                  <div class="text-sm text-slate-700 text-right">
                    <p>{{ l.phone ?? "-" }}</p>
                    <p>{{ l.location ?? "-" }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- DINNER -->
          <div v-if="parseJson(rs.reservation.dinner).length" class="mb-8">
            <p class="font-semibold text-slate-700 mb-4 text-sm md:text-base">
              🍽️ Dinner
            </p>

            <div class="grid grid-cols-1 gap-6">
              <div
                v-for="(d, i) in parseJson(rs.reservation.dinner)"
                :key="i"
                class="rounded-lg bg-slate/90 border border-slate-200 p-5 transition"
              >
                <div class="flex justify-between gap-4">
                  <div>
                    <p
                      class="font-semibold text-slate-700 text-sm md:text-base"
                    >
                      {{ d.name ?? "-" }}
                    </p>
                  </div>

                  <div class="text-sm text-slate-700 text-right">
                    <p>{{ d.phone ?? "-" }}</p>
                    <p>{{ d.location ?? "-" }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ACTIVITY -->
          <div v-if="parseJson(rs.reservation.activity).length">
            <p class="font-semibold text-slate-700 mb-4 text-sm md:text-base">
              🎯 Activity
            </p>

            <div class="grid grid-cols-1 gap-6">
              <div
                v-for="(a, i) in parseJson(rs.reservation.activity)"
                :key="i"
                class="rounded-lg bg-slate/90 border border-slate-200 p-5 transition"
              >
                <div class="flex justify-between gap-4">
                  <div>
                    <p
                      class="font-semibold text-slate-700 text-sm md:text-base"
                    >
                      {{ a.name ?? "-" }}
                    </p>
                  </div>

                  <div class="text-sm text-slate-700 text-right">
                    <p>{{ a.phone ?? "-" }}</p>
                    <p>{{ a.location ?? "-" }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TransitionGroup>

      <div v-if="!filteredReservations.length" class="text-sm text-slate-500">
        No reservation for selected date
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import api from "../api/api";

/* ================= PROPS ================= */
const props = defineProps({
  show: { type: Boolean, required: true },
  dealCustomerId: { type: Number, required: true },
});

/* ================= STATE ================= */
const reservations = ref([]);
const loading = ref(false);
const selectedDate = ref(null);

/* ================= FETCH ================= */
const fetchReservations = async () => {
  if (!props.dealCustomerId) return;

  loading.value = true;
  try {
    const res = await api.get("/reservations", {
      params: {
        deal_customer_id: props.dealCustomerId,
      },
    });

    // SORT BERDASARKAN CREATED_AT (PALING LAMA → PALING BARU)
    reservations.value = (res.data.data || []).sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );
  } catch (e) {
    console.error(e);
    reservations.value = [];
  } finally {
    loading.value = false;
  }
};

watch(
  () => [props.show, props.dealCustomerId],
  ([show, id]) => {
    if (show && id) fetchReservations();
    if (!show) reservations.value = [];
  },
  { immediate: true }
);

/* ================= TRIP DATES ================= */
const tripDates = computed(() => {
  const customer = reservations.value[0]?.deal_customer?.new_customer;
  if (!customer?.check_in || !customer?.check_out) return [];

  const start = new Date(customer.check_in);

  // STOP DI H-1 CHECKOUT
  const end = new Date(customer.check_out);
  end.setDate(end.getDate() - 1);
  end.setHours(23, 59, 59, 999);

  const dates = [];
  const current = new Date(start);

  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
});

/* ================= DEFAULT SELECTED DATE ================= */
watch(tripDates, (dates) => {
  if (dates.length && !selectedDate.value) {
    selectedDate.value = dates[0];
  }
});

/* ================= MAP RESERVATION → DATE ================= */
const reservationsByDate = computed(() => {
  return reservations.value.map((res, index) => ({
    id: res.id,
    date: tripDates.value[index] ?? null,
    guest_name: res.deal_customer?.new_customer?.name ?? "-",
    reservation: res,
  }));
});

/* ================= FILTER BY SELECTED DATE ================= */
const filteredReservations = computed(() => {
  if (!selectedDate.value) return [];
  return reservationsByDate.value.filter((r) => r.date === selectedDate.value);
});

/* ================= HELPERS ================= */
const parseJson = (val) => {
  try {
    return JSON.parse(val || "[]");
  } catch {
    return [];
  }
};

const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  });
};
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.35s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>

<!-- <template>
  <div class="rounded-xl border border-slate-200 bg-slate-50 p-5">
    <h3 class="mb-4 font-semibold text-slate-800">Reservation Information</h3>

    <div v-if="loading" class="text-sm text-slate-500">
      Loading reservation...
    </div>


    <div v-else-if="!reservations.length" class="text-sm text-slate-500">
      No reservation data
    </div>

    <div v-else>

      <div class="flex gap-2 mb-5 flex-wrap">
        <button
          v-for="date in tripDates"
          :key="date"
          @click="selectedDate = date"
          class="px-3 py-1 rounded-lg border text-sm transition"
          :class="
            selectedDate === date
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
          "
        >
          {{ formatDate(date) }}
        </button>
      </div>


      <div
        v-for="(rs, index) in filteredReservations"
        :key="rs.id"
        class="rounded-lg border border-slate-200 bg-white p-4"
      >
        <h4 class="font-semibold text-slate-700 mb-4">
          Reservation {{ index + 1 }} - {{ rs.guest_name }}
        </h4>

  
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <p class="text-xs text-slate-500">Phone Hotel</p>
            <p class="font-medium">
              {{ rs.reservation.phone_hotel ?? "-" }}
            </p>
          </div>

          <div>
            <p class="text-xs text-slate-500">Lokasi Hotel</p>
            <p class="font-medium">
              {{ rs.reservation.lokasi_hotel ?? "-" }}
            </p>
          </div>
        </div>

  
        <div v-if="parseJson(rs.reservation.lunch).length" class="mb-4">
          <p class="font-semibold text-slate-700 mb-2">🍱 Lunch</p>
          <div
            v-for="(l, i) in parseJson(rs.reservation.lunch)"
            :key="i"
            class="ml-3 text-sm text-slate-600"
          >
            <div>Name: {{ l.name ?? "-" }}</div>
            <div>Phone: {{ l.phone ?? "-" }}</div>
            <div>Location: {{ l.location ?? "-" }}</div>
          </div>
        </div>

  
        <div v-if="parseJson(rs.reservation.dinner).length" class="mb-4">
          <p class="font-semibold text-slate-700 mb-2">🍽️ Dinner</p>
          <div
            v-for="(d, i) in parseJson(rs.reservation.dinner)"
            :key="i"
            class="ml-3 text-sm text-slate-600"
          >
            <div>Name: {{ d.name ?? "-" }}</div>
            <div>Phone: {{ d.phone ?? "-" }}</div>
            <div>Location: {{ d.location ?? "-" }}</div>
          </div>
        </div>

  
        <div v-if="parseJson(rs.reservation.activity).length">
          <p class="font-semibold text-slate-700 mb-2">🎯 Activity</p>
          <div
            v-for="(a, i) in parseJson(rs.reservation.activity)"
            :key="i"
            class="ml-3 text-sm text-slate-600"
          >
            <div>Name: {{ a.name ?? "-" }}</div>
            <div>Phone: {{ a.phone ?? "-" }}</div>
            <div>Location: {{ a.location ?? "-" }}</div>
          </div>
        </div>
      </div>

    
      <div v-if="!filteredReservations.length" class="text-sm text-slate-500">
        No reservation for selected date
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import api from "../api/api";

/* ================= PROPS ================= */
const props = defineProps({
  show: { type: Boolean, required: true },
  dealCustomerId: { type: Number, required: true },
});

/* ================= STATE ================= */
const reservations = ref([]);
const loading = ref(false);
const selectedDate = ref(null);

/* ================= FETCH ================= */
const fetchReservations = async () => {
  if (!props.dealCustomerId) return;

  loading.value = true;
  try {
    const res = await api.get("/reservations", {
      params: {
        deal_customer_id: props.dealCustomerId,
      },
    });

    // SORT BERDASARKAN CREATED_AT (PALING LAMA → PALING BARU)
    reservations.value = (res.data.data || []).sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );
  } catch (e) {
    console.error(e);
    reservations.value = [];
  } finally {
    loading.value = false;
  }
};

watch(
  () => [props.show, props.dealCustomerId],
  ([show, id]) => {
    if (show && id) fetchReservations();
    if (!show) reservations.value = [];
  },
  { immediate: true }
);

/* ================= TRIP DATES ================= */
const tripDates = computed(() => {
  const customer = reservations.value[0]?.deal_customer?.new_customer;
  if (!customer?.check_in || !customer?.check_out) return [];

  const start = new Date(customer.check_in);
  const end = new Date(customer.check_out);
  end.setHours(23, 59, 59, 999);

  const dates = [];
  const current = new Date(start);

  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
});

/* ================= DEFAULT SELECTED DATE ================= */
watch(tripDates, (dates) => {
  if (dates.length && !selectedDate.value) {
    selectedDate.value = dates[0];
  }
});

/* ================= MAP RESERVATION → DATE ================= */
const reservationsByDate = computed(() => {
  return reservations.value.map((res, index) => ({
    id: res.id,
    date: tripDates.value[index] ?? null,
    guest_name: res.deal_customer?.new_customer?.name ?? "-",
    reservation: res,
  }));
});

/* ================= FILTER BY SELECTED DATE ================= */
const filteredReservations = computed(() => {
  if (!selectedDate.value) return [];
  return reservationsByDate.value.filter((r) => r.date === selectedDate.value);
});

/* ================= HELPERS ================= */
const parseJson = (val) => {
  try {
    return JSON.parse(val || "[]");
  } catch {
    return [];
  }
};

const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  });
};
</script> -->
