<template>
  <div id="sidebar">
    <SquareTerminal color="#7bff00" @click="handleClick('home')" />
    <Gamepad2 color="green" @click="handleClick('games')" />
    <Headphones color="green" @click="handleClick('music')" />
    <Mail color="green" @click="handleClick('messages')" />
    <SquareTerminal color="green" @click="handleClick('help')" />
  </div>
</template>

<script setup>
import { SquareTerminal, Gamepad2, Headphones, Mail } from "lucide-vue-next";

const { sendCommand } = useTerminal();

const handleClick = (command) => {
  sendCommand(command);
};
</script>

<style>
#sidebar {
  position: fixed;
  top: 100px;
  left: 0;
  border: 2px solid #7bff00;
  border-left: none;
  border-radius: 0 5px 5px 0;
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
