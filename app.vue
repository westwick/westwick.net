<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
    <p>xl</p>
  </div>
</template>

<style>
:root {
  /* Default theme */
  --background-color: #131111;
  --primary-color: #7bff00;
  --primary-color-shadow: rgba(123, 255, 0, 0.5);
  --secondary-color: #008000;
  --terminal-background: #000000;

  /* --background-color: #181818;
  --primary-color: rgb(0, 153, 255);
  --primary-color-shadow: rgba(0, 153, 255, 0.5);
  --secondary-color: #0a2ceb;
  --terminal-background: #000000; */

  /* --background-color: #181818;
  --primary-color: rgb(235, 23, 235);
  --primary-color-shadow: rgba(235, 23, 235, 0.5);
  --secondary-color: #7c02ac;
  --terminal-background: #000; */
}
body {
  /* background: #000f03; */
  background: var(--background-color);
  font-family: "Roboto Mono", monospace;
}
::-webkit-scrollbar {
  width: 0px;
  height: 0px;
}

::-webkit-scrollbar-thumb {
  background-color: #424242;
  border-radius: 7px;
  border: 3px solid #1f1e1e;
}

::-webkit-scrollbar-thumb:hover {
  background-color: #4f4f4f;
}

::-webkit-scrollbar-track {
  background-color: #1f1e1e;
}
</style>
