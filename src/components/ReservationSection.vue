<script setup>
import { ref, watch, computed } from "vue";
import api from "../api/api";
import { Download } from "lucide-vue-next";

const props = defineProps({
  show: { type: Boolean, required: true },
  dealCustomerId: { type: Number, required: true },
});

const reservations = ref([]);
const loading = ref(false);
const selectedDate = ref(null);

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

watch(tripDates, (dates) => {
  if (dates.length && !selectedDate.value) selectedDate.value = dates[0];
});

const fetchReservations = async () => {
  if (!props.dealCustomerId) return;

  loading.value = true;
  try {
    const res = await api.get("/reservations", {
      params: { deal_customer_id: props.dealCustomerId },
    });
    reservations.value = (res.data.data || []).sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );
  } catch (e) {
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

const reservationsByDate = computed(() => {
  return reservations.value.map((res, index) => ({
    id: res.id,
    date: tripDates.value[index] ?? null,
    guest_name: res.deal_customer?.new_customer?.name ?? "-",
    reservation: res,
  }));
});

const filteredReservations = computed(() => {
  if (!selectedDate.value) return [];
  return reservationsByDate.value.filter((r) => r.date === selectedDate.value);
});

const parseJson = (val) => {
  try {
    return JSON.parse(val || "[]");
  } catch {
    return [];
  }
};

const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
};

const downloadPdfByDate = async (date) => {
  try {
    const response = await api.get(
      `/trip/${props.dealCustomerId}/download/${date}`,
      {
        responseType: "blob",
      }
    );

    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `trip-summary-${props.dealCustomerId}-${date}.pdf`;
    link.click();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    alert("Gagal download PDF");
  }
};
</script>

<template>
  <div class="rounded-xl border border-slate-200 bg-white p-5">
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-semibold text-black text-lg">Reservation Information</h3>

      <div class="flex gap-2 overflow-x-auto scrollbar-hidden">
        <button
          v-for="date in tripDates"
          :key="'download-' + date"
          @click="downloadPdfByDate(date)"
          class="flex items-center gap-1 px-3 py-1.5 rounded-md border border-blue-700 text-blue-700 text-sm font-medium shrink-0 transition-all duration-300 hover:bg-blue-700 hover:text-white"
        >
          <Download class="w-4 h-4" />
          {{ formatDate(date) }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-sm text-slate-500">
      Loading reservation...
    </div>

    <div v-else-if="!reservations.length" class="text-sm text-black">
      No reservation data
    </div>

    <div v-else>
      <div class="flex gap-2 mb-5 flex-wrap">
        <button
          v-for="date in tripDates"
          :key="'select-' + date"
          @click="selectedDate = date"
          class="px-4 py-1.5 rounded-lg border text-sm font-medium transition-all duration-300"
          :class="
            selectedDate === date
              ? 'bg-linear-to-br from-indigo-700 to-blue-700 text-white border-transparent shadow-md'
              : 'bg-white text-slate-800 border-slate-300 hover:bg-linear-to-br hover:from-indigo-700 hover:to-blue-700 hover:text-white hover:border-transparent'
          "
        >
          {{ formatDate(date) }}
        </button>
      </div>

      <!-- View reservation per tanggal -->
      <TransitionGroup name="slide" tag="div" class="space-y-6">
        <div
          v-for="rs in filteredReservations"
          :key="rs.id"
          class="rounded-lg bg-white p-6 shadow border border-slate-200"
        >
          <h4 class="font-semibold text-black mb-3">
            Reservation: {{ rs.guest_name }}
          </h4>

          <div class="mb-4">
            <p class="font-semibold text-black mb-3 text-sm">
              Tour Plan:
              <span v-if="rs.reservation.tour_plan">
                {{ rs.reservation.tour_plan }}
              </span>
              <span v-else class="text-slate-400">-</span>
            </p>
            <p class="font-semibold text-black mb-3 text-sm">Hotel</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div class="rounded-lg border border-slate-200 p-4">
                <p class="text-sm text-black mb-2">Nama Hotel</p>
                <ul class="list-disc pl-5 space-y-1">
                  <li
                    v-for="(
                      hotel, i
                    ) in rs.reservation.deal_customer?.new_customer?.hotel?.split(
                      ','
                    ) || []"
                    :key="i"
                    class="font-medium text-black text-sm"
                  >
                    {{ hotel.trim() }}
                  </li>
                  <li
                    v-if="!rs.reservation.deal_customer?.new_customer?.hotel"
                    class="text-sm text-slate-400"
                  >
                    -
                  </li>
                </ul>
              </div>
              <div class="rounded-lg border border-slate-200 p-4">
                <p class="text-sm text-black mb-2">Phone Hotel</p>
                <ul class="list-disc pl-5">
                  <li class="font-medium text-black text-sm">
                    {{ rs.reservation.phone_hotel ?? "-" }}
                  </li>
                </ul>
              </div>
              <div class="rounded-lg border border-slate-200 p-4">
                <p class="text-sm text-black mb-2">Location Hotel</p>
                <ul class="list-disc pl-5">
                  <li class="font-medium text-black text-sm">
                    {{ rs.reservation.lokasi_hotel ?? "-" }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div v-if="parseJson(rs.reservation.activity).length" class="mb-4">
            <p class="font-semibold text-black mb-3 text-sm">Activity</p>
            <div class="space-y-3">
              <div
                v-for="(a, i) in parseJson(rs.reservation.activity)"
                :key="i"
                class="rounded-lg border border-slate-200 p-3"
              >
                <p class="font-semibold text-black text-sm mb-1">
                  {{ a.name ?? "-" }}
                </p>
                <ul class="list-disc pl-5 text-sm text-black">
                  <li>{{ a.phone ?? "-" }}</li>
                  <li>{{ a.location ?? "-" }}</li>
                </ul>
              </div>
            </div>
          </div>

          <div v-if="parseJson(rs.reservation.lunch).length" class="mb-4">
            <p class="font-semibold text-black mb-3 text-sm">Lunch</p>
            <div class="space-y-3">
              <div
                v-for="(l, i) in parseJson(rs.reservation.lunch)"
                :key="i"
                class="rounded-lg border border-slate-200 p-4"
              >
                <p class="font-semibold text-black text-sm mb-1">
                  {{ l.name ?? "-" }}
                </p>
                <ul class="list-disc pl-5 text-sm text-black">
                  <li>{{ l.phone ?? "-" }}</li>
                  <li>{{ l.location ?? "-" }}</li>
                </ul>
              </div>
            </div>
          </div>

          <div v-if="parseJson(rs.reservation.dinner).length" class="mb-4">
            <p class="font-semibold text-black mb-3 text-sm">Dinner</p>
            <div class="space-y-3">
              <div
                v-for="(d, i) in parseJson(rs.reservation.dinner)"
                :key="i"
                class="rounded-lg border border-slate-200 p-4"
              >
                <p class="font-semibold text-black text-sm mb-1">
                  {{ d.name ?? "-" }}
                </p>
                <ul class="list-disc pl-5 text-sm text-black">
                  <li>{{ d.phone ?? "-" }}</li>
                  <li>{{ d.location ?? "-" }}</li>
                </ul>
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
.scrollbar-hidden::-webkit-scrollbar {
  display: none;
}
.scrollbar-hidden {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
