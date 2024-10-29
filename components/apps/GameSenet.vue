<template>
  <AppWindow title="Senet" @close="$emit('close')">
    <div class="game-content">
      <SenetBoard />
    </div>
  </AppWindow>
</template>

<script setup>
import SenetBoard from "./senet/SenetBoard.vue";
</script>

<style scoped></style>
