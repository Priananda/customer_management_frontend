<template>
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
    <div class="flex items-center gap-2">
      <span
        v-for="i in 6"
        :key="i"
        class="dot"
        :style="{ animationDelay: `${i * 0.15}s` }"
      ></span>
    </div>
  </div>
</template>

<style scoped>
.dot {
  width: 12px;
  height: 12px;
  background-color: #2e79f0;
  border-radius: 9999px;
  animation: snake 1.1s ease-in-out infinite;
}

@keyframes snake {
  0% {
    transform: translateX(0);
    opacity: 0.3;
  }
  50% {
    transform: translateX(18px);
    opacity: 1;
  }
  100% {
    transform: translateX(0);
    opacity: 0.3;
  }
}
</style>
