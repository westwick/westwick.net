<template>
  <div
    class="app-window"
    :class="{ 'window-focused': isFocused }"
    :style="{
      left: position.x + 'px',
      top: position.y + 'px',
      zIndex: zIndex,
    }"
    @mousedown="focusWindow"
  >
    <!-- Window Header/Title Bar -->
    <div
      class="window-header"
      @mousedown="startDrag"
      @mousemove="onDrag"
      @mouseup="stopDrag"
      @mouseleave="stopDrag"
    >
      <h2>{{ title }}</h2>
      <button @click="$emit('close')" class="close-btn">×</button>
    </div>

    <!-- Window Content -->
    <div class="window-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useAppState } from "~/composables/useAppState";

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  initialX: {
    type: Number,
    default: window?.innerWidth / 2 - 250 || 0,
  },
  initialY: {
    type: Number,
    default: window?.innerHeight / 2 - 150 || 0,
  },
  appId: {
    type: Number,
    required: true,
  },
});

const { focusedAppId, focusApp } = useAppState();

const isFocused = computed(() => focusedAppId.value === props.appId);
const zIndex = computed(() => (isFocused.value ? 100 : 10));

defineEmits(["close"]);

const position = ref({ x: props.initialX, y: props.initialY });
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

// Window management
const focusWindow = () => {
  focusApp(props.appId);
};

// Dragging logic
const startDrag = (e) => {
  isDragging.value = true;
  dragOffset.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y,
  };
};

const onDrag = (e) => {
  if (!isDragging.value) return;

  position.value = {
    x: e.clientX - dragOffset.value.x,
    y: e.clientY - dragOffset.value.y,
  };
};

const stopDrag = () => {
  isDragging.value = false;
};

// Global mouse event handlers
const handleMouseUp = () => {
  isDragging.value = false;
};

const handleMouseMove = (e) => {
  if (isDragging.value) {
    onDrag(e);
  }
};

onMounted(() => {
  window.addEventListener("mouseup", handleMouseUp);
  window.addEventListener("mousemove", handleMouseMove);
});

onBeforeUnmount(() => {
  window.removeEventListener("mouseup", handleMouseUp);
  window.removeEventListener("mousemove", handleMouseMove);
});
</script>

<style scoped>
.app-window {
  position: fixed;
  background: var(--background-color);
  border: 2px solid var(--border-color);
  border-radius: 5px;
  min-width: 600px;
  min-height: 240px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  transition: border-color 0.2s ease;
}

.window-focused {
  border-color: var(--primary-color);
}

.window-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--background-color);
  border-bottom: 1px solid var(--border-color);
  cursor: move;
  user-select: none;
}

.window-header h2 {
  margin: 0;
  font-size: 1rem;
  color: var(--secondary-color);
}

.close-btn {
  background: none;
  border: none;
  color: var(--primary-color);
  font-size: 24px;
  cursor: pointer;
  padding: 0 4px;
}

.close-btn:hover {
  color: #ff4444;
}

.window-content {
  padding: 16px;
  overflow: auto;
  max-height: calc(100vh - 150px);
}
</style>
