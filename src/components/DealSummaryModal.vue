<template>
  <Transition name="fade">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
    >
      <div
        class="flex flex-col w-full max-w-3xl max-h-[90vh] rounded-xl bg-white shadow-2xl overflow-hidden"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between bg-linear-to-br from-indigo-700 to-blue-700 px-6 py-4"
        >
          <h2 class="text-lg font-semibold text-white">
            Deal Customer Summary
          </h2>
          <button
            @click="$emit('close')"
            class="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
          >
            ✕
          </button>
        </div>

        <!-- Body -->
        <div
          class="flex-1 p-6 space-y-6 text-sm text-slate-700 overflow-y-auto hide-scrollbar"
        >
          <!-- Guest Information -->
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 class="mb-4 font-semibold text-slate-800">Guest Information</h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-slate-500">Guest Name</p>
                <p class="font-medium">{{ deal.new_customer?.name ?? "-" }}</p>
              </div>

              <div>
                <p class="text-xs text-slate-500">Phone</p>
                <p class="font-medium">{{ deal.new_customer?.phone ?? "-" }}</p>
              </div>

              <div>
                <p class="text-xs text-slate-500">Email</p>
                <p class="font-medium">{{ deal.new_customer?.email ?? "-" }}</p>
              </div>

              <div>
                <p class="text-xs text-slate-500">Progress</p>
                <span
                  class="inline-block rounded-full bg-green-100 px-4 py-1 text-xs font-semibold text-green-800 border border-green-200"
                >
                  {{ deal.new_customer?.progress ?? "-" }}
                </span>
              </div>

              <div>
                <p class="text-xs text-slate-500">Check In</p>
                <p class="font-medium">
                  {{ deal.new_customer?.check_in ?? "-" }}
                </p>
              </div>

              <div>
                <p class="text-xs text-slate-500">Check Out</p>
                <p class="font-medium">
                  {{ deal.new_customer?.check_out ?? "-" }}
                </p>
              </div>
            </div>
          </div>

          <!-- Deal Information -->
          <div class="rounded-xl border border-slate-200 bg-white p-5">
            <h3 class="mb-4 font-semibold text-slate-800">Deal Information</h3>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p class="text-xs text-slate-500">Handler</p>
                <p class="font-medium">
                  {{ deal.new_customer?.pic ?? "-" }}
                </p>
              </div>

              <div>
                <p class="text-xs text-slate-500">Payment Status</p>

                <span
                  class="mt-1 inline-flex min-w-[80px] items-center justify-center rounded-full px-3 py-1 text-xs font-semibold text-center"
                  :class="paymentStatus(deal.deal_customer?.payment_status)"
                >
                  {{ paymentStatusLabel(deal.deal_customer?.payment_status) }}
                </span>
              </div>

              <div>
                <p class="text-xs text-slate-500">Created At</p>
                <p class="font-medium">
                  {{ formatDate(deal.deal_customer?.created_at) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Transport -->
          <div
            v-if="deal.deal_customer?.transports?.length"
            class="rounded-xl border border-slate-200 bg-slate-50 p-5"
          >
            <h3 class="mb-4 font-semibold text-slate-800">Transport</h3>

            <div class="space-y-3">
              <div
                v-for="t in deal.deal_customer.transports"
                :key="t.id"
                class="rounded-lg border border-slate-200 bg-white p-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                <div>
                  <p class="text-xs text-slate-500">Guide</p>
                  <p class="font-medium">{{ t.guide ?? "-" }}</p>
                </div>

                <div>
                  <p class="text-xs text-slate-500">HP Guide</p>
                  <p class="font-medium">{{ t.hp_guide ?? "-" }}</p>
                </div>

                <div>
                  <p class="text-xs text-slate-500">Driver</p>
                  <p class="font-medium">{{ t.driver ?? "-" }}</p>
                </div>

                <div>
                  <p class="text-xs text-slate-500">HP Driver</p>
                  <p class="font-medium">{{ t.hp_driver ?? "-" }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4"
        >
          <button
            @click="$emit('close')"
            class="rounded-lg bg-linear-to-br from-indigo-700 to-blue-700 px-5 py-2 text-sm font-medium text-white hover:from-indigo-600 hover:to-blue-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { format } from "date-fns";

defineProps({
  show: { type: Boolean, default: false },
  deal: { type: Object, default: () => ({}) },
});

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return format(new Date(dateStr), "dd MMM yyyy HH:mm");
};

const paymentStatusLabel = (status) => {
  if (!status) return "-";

  const val = status.toLowerCase();

  if (val === "dp") return "DP";
  if (val === "lunas") return "Lunas";

  return "-";
};

const paymentStatus = (status) => {
  if (!status) return "bg-slate-100 text-slate-600 border border-slate-200";

  const val = status.toLowerCase();

  if (val === "dp")
    return "bg-yellow-100 text-yellow-800 border border-yellow-200";

  if (val === "lunas")
    return "bg-green-100 text-green-800 border border-green-200";

  return "bg-slate-100 text-slate-600 border border-slate-200";
};
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.hide-scrollbar {
  -ms-overflow-style: none; /* IE & Edge */
  scrollbar-width: none; /* Firefox */
}
.hide-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome, Safari */
}
</style>
