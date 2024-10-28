<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
    <p>xl</p>
  </div>
</template>

<style>
body {
  /* background: #000f03; */
  background: #181818;
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
