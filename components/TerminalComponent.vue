<template>
  <div class="terminal">
    <div class="terminal-wrap">
      <div ref="terminalContainer" class="terminal-container"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { mainmenu } from "@/assets/mainmenu.js";

const terminalContainer = ref(null);
const { initializeTerminal, writeln, terminal } = useTerminal();

const dots = 5;
let direction = 1;
let currentDotIndex = 0;
let loadingInterval;

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
</script>

<style scoped>
.terminal {
  display: flex;
  justify-content: center;
  margin-top: 50px;
}
.terminal-wrap {
  background: #000;
  padding: 16px;
  padding-right: 0;
  border-radius: 5px;
  border: 2px solid #64c20c;
  transition: all 0.4s ease-in-out;
}

.terminal-wrap:focus-within {
  box-shadow: 0px 0px 6px 2px rgba(43, 255, 0, 0.5);
  border-color: #7bff00;
}
.terminal-container {
  width: 740px;
  height: 350px;
}
</style>
