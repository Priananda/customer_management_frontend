<script setup>
import { computed } from "vue";
import { format } from "date-fns";
import ReservationSection from "../components/ReservationSection.vue";

const props = defineProps({
  show: { type: Boolean, default: false },
  deal: { type: Object, default: () => ({}) },
});

const isDealIncomplete = computed(() => {
  return (
    !props.deal?.deal_customer ||
    !props.deal?.deal_customer?.new_customer ||
    !props.deal.deal_customer.new_customer.check_in ||
    !props.deal.deal_customer.new_customer.check_out
  );
});

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return format(new Date(dateStr), "dd MMM yyyy HH:mm");
};

const paymentStatusLabel = (status) => {
  if (!status) return "-";
  return status.toLowerCase() === "dp"
    ? "DP"
    : status.toLowerCase() === "lunas"
    ? "Lunas"
    : "-";
};
</script>

<template>
  <Transition name="fade">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div
        class="flex flex-col w-full max-w-3xl max-h-[90vh] rounded-xl bg-white shadow-xl overflow-hidden"
      >
        <div
          class="flex items-center justify-between bg-linear-to-br from-indigo-700 to-blue-700 px-6 py-4"
        >
          <h2 class="text-lg font-semibold text-white">
            Deal Customer Summary
          </h2>
          <button
            @click="$emit('close')"
            class="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        <div
          class="flex-1 p-4 space-y-4 text-sm text-black overflow-y-auto hide-scrollbar"
        >
          <!-- Guest Information -->
          <div class="rounded-lg border border-slate-200 p-4">
            <h3 class="mb-3 font-semibold text-sm text-black">
              Guest Information
            </h3>

            <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3 list-disc pl-5">
              <li>
                <span class="font-medium">Guest Name:</span>
                {{ props.deal.new_customer?.name ?? "-" }}
              </li>
              <li>
                <span class="font-medium">Phone:</span>
                {{ props.deal.new_customer?.phone ?? "-" }}
              </li>
              <li>
                <span class="font-medium">Email:</span>
                {{ props.deal.new_customer?.email ?? "-" }}
              </li>
              <li>
                <span class="font-medium">Tour Packages:</span>
                {{ props.deal.new_customer?.tour_packages ?? "-" }}
              </li>
              <li>
                <span class="font-medium">Progress:</span>
                {{ props.deal.new_customer?.progress ?? "-" }}
              </li>
              <li>
                <span class="font-medium">Check In:</span>
                {{ props.deal.new_customer?.check_in ?? "-" }}
              </li>
              <li>
                <span class="font-medium">Check Out:</span>
                {{ props.deal.new_customer?.check_out ?? "-" }}
              </li>
            </ul>
          </div>

          <!-- Deal Information -->
          <div class="rounded-lg border border-slate-200 p-4">
            <h3 class="mb-3 font-semibold text-sm text-black">
              Deal Information
            </h3>

            <ul class="grid grid-cols-1 sm:grid-cols-3 gap-3 list-disc pl-5">
              <li>
                <span class="font-medium">Handler:</span>
                {{ props.deal.new_customer?.pic ?? "-" }}
              </li>
              <li>
                <span class="font-medium">Payment Status:</span>
                {{
                  paymentStatusLabel(props.deal.deal_customer?.payment_status)
                }}
              </li>
              <li>
                <span class="font-medium">Created At:</span>
                {{ formatDate(props.deal.deal_customer?.created_at) }}
              </li>
            </ul>
          </div>

          <!-- Transport -->
          <div
            v-if="props.deal.deal_customer?.transports?.length"
            class="rounded-lg border border-slate-200 p-4"
          >
            <h3 class="mb-3 font-semibold text-sm text-black">Transport</h3>

            <div class="space-y-3">
              <div
                v-for="t in props.deal.deal_customer.transports"
                :key="t.id"
                class="rounded-md border border-slate-200 p-3"
              >
                <ul
                  class="grid grid-cols-1 sm:grid-cols-3 gap-3 list-disc pl-5"
                >
                  <li>
                    <span class="font-medium">Guide:</span> {{ t.guide ?? "-" }}
                  </li>
                  <li>
                    <span class="font-medium">HP Guide:</span>
                    {{ t.hp_guide ?? "-" }}
                  </li>
                  <li>
                    <span class="font-medium">Driver:</span>
                    {{ t.driver ?? "-" }}
                  </li>
                  <li>
                    <span class="font-medium">HP Driver:</span>
                    {{ t.hp_driver ?? "-" }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div
            v-if="isDealIncomplete"
            class="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm"
          >
            ⚠️ <span class="font-medium">Data Deal Customer belum lengkap.</span
            ><br />
            Silakan isi
            <span class="font-medium">Data Deal Customer</span>.
          </div>

          <ReservationSection
            v-else
            :show="show"
            :dealCustomerId="props.deal.deal_customer.id"
            :checkIn="props.deal.deal_customer.new_customer.check_in"
            :checkOut="props.deal.deal_customer.new_customer.check_out"
          />
        </div>

        <div class="flex justify-end border-t border-slate-200 px-4 py-3">
          <button
            @click="$emit('close')"
            class="rounded-lg bg-linear-to-br from-indigo-700 to-blue-700 px-5 py-2 text-sm font-medium text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
