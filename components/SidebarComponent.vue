<template>
  <div id="sidebar">
    <SquareTerminal :color="primaryColor" @click="handleClick('home')" />
    <Gamepad2 :color="secondaryColor" @click="handleClick('games')" />
    <Headphones :color="secondaryColor" @click="handleClick('music')" />
    <Mail :color="secondaryColor" @click="handleClick('messages')" />
    <Settings :color="secondaryColor" @click="handleClick('help')" />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import {
  SquareTerminal,
  Gamepad2,
  Headphones,
  Mail,
  Settings,
} from "lucide-vue-next";

const { sendCommand, terminal } = useTerminal();
const primaryColor = ref("");
const secondaryColor = ref("");

onMounted(() => {
  primaryColor.value = getComputedStyle(document.documentElement)
    .getPropertyValue("--primary-color")
    .trim();
  secondaryColor.value = getComputedStyle(document.documentElement)
    .getPropertyValue("--secondary-color")
    .trim();
});

const handleClick = (command) => {
  sendCommand(command);
  terminal.value.focus();
};
</script>

<style>
#sidebar {
  position: absolute;
  right: 100%; /* This positions it directly to the left of the terminal */
  top: 33%;
  transform: translateY(-50%);
  border: 2px solid var(--primary-color);
  background-color: var(--background-color);
  border-radius: 5px 0px 0px 5px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
#sidebar svg {
  cursor: pointer;
  scale: 1;
  transition: scale 0.2s ease-in-out;
}
#sidebar svg:hover {
  scale: 1.2;
}
</style>
