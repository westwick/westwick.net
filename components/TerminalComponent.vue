<template>
  <div class="terminal">
    <div
      class="terminal-wrap"
      :class="{ 'terminal-focused': !focusedAppId }"
      :style="{ zIndex: terminalZIndex }"
      @mousedown="clearAppFocus"
    >
      <SidebarComponent />
      <div ref="terminalContainer" class="terminal-container"></div>
    </div>

    <!-- App Container -->
    <component
      v-for="app in activeApps"
      :key="app.id"
      :is="app.component"
      :app-id="app.id"
      @close="closeApp(app.id)"
      class="app-instance"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, defineAsyncComponent } from "vue";
import { mainmenu } from "@/assets/mainmenu.js";
import { useAppState } from "~/composables/useAppState";

const terminalContainer = ref(null);
const { initializeTerminal, writeln, terminal } = useTerminal();

const dots = 5;
let direction = 1;
let currentDotIndex = 0;
let loadingInterval;

const { activeApps, focusedAppId, closeApp } = useAppState();

const terminalZIndex = computed(() => (focusedAppId.value === null ? 100 : 10));

const showLoadingAnimation = () => {
  writeln("Establishing connection     ");

  loadingInterval = setInterval(() => {
    let dotsString = "";
    for (let i = 0; i < dots; i++) {
      // Use bright green for current dot, dark grey for others
      dotsString +=
        i === currentDotIndex
          ? "\x1b[92m.\x1b[0m" // Bright green
          : "\x1b[90m.\x1b[0m"; // Dark grey
    }

    // Move cursor back and redraw dots
    writeln("\b".repeat(dots) + dotsString);

    // Update dot position with oscillation
    currentDotIndex += direction;
    if (currentDotIndex >= dots - 1 || currentDotIndex <= 0) {
      direction *= -1; // Reverse direction at ends
    }
  }, 100);

  // After 2 seconds, clear interval and show content
  setTimeout(() => {
    clearInterval(loadingInterval);
    writeln("\x1b[2J\x1b[H"); // Clear screen and move cursor to home position
    writeln(mainmenu);
    writeln("\r\n\r\n\r\n$ ");
    setTimeout(() => {
      terminal.value.focus();
    }, 1);
  }, 1600);
};

onMounted(() => {
  if (terminalContainer.value) {
    initializeTerminal(terminalContainer.value);
    showLoadingAnimation();
  }
});

const clearAppFocus = () => {
  focusedAppId.value = null;
};
</script>

<style scoped>
.terminal {
  display: flex;
  justify-content: center;
  margin-top: 50px;
}
.terminal-wrap {
  background: var(--terminal-background);
  padding: 16px;
  padding-right: 0;
  border-radius: 5px;
  border: 2px solid var(--primary-color);
  transition: all 0.4s ease-in-out;
  position: relative;
}

.terminal-wrap:focus-within {
  box-shadow: 0px 0px 6px 2px var(--primary-color-shadow);
  border-color: var(--primary-color);
}
.terminal-container {
  width: 740px;
  height: 550px;
}

.app-instance {
  position: absolute;
}

.terminal-focused {
  border-color: var(--primary-color);
  box-shadow: 0px 0px 6px 2px var(--primary-color-shadow);
}
</style>
