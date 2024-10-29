import { ref, markRaw } from "vue";
import { useTerminal } from "~/composables/useTerminal";

const activeApps = ref([]);
const focusedAppId = ref(null);
let nextId = 0;
const BASE_Z_INDEX = 10;
const FOCUSED_Z_INDEX = 100;

export function useAppState() {
  const launchApp = async (appName) => {
    const { writeln } = useTerminal();
    try {
      const component = await import(`~/components/apps/${appName}.vue`);
      const appId = nextId++;
      const app = {
        id: appId,
        name: appName,
        component: markRaw(component.default),
        zIndex: BASE_Z_INDEX,
      };
      activeApps.value.push(app);
      focusedAppId.value = appId;
      return true;
    } catch (error) {
      writeln(
        '\r\n\x1b[38;2;200;10;10mError\x1b[38;2;160;10;22m - Failed to load app "' +
          appName +
          '":\r\n' +
          error.message +
          "\x1b[0m\r\n"
      );
      return false;
    }
  };

  const focusApp = (appId) => {
    if (focusedAppId.value === appId) return;
    focusedAppId.value = appId;
  };

  const closeApp = (appId) => {
    const index = activeApps.value.findIndex((app) => app.id === appId);
    if (index !== -1) {
      activeApps.value.splice(index, 1);
      if (focusedAppId.value === appId) {
        // Focus the next most recent app or null if none left
        focusedAppId.value =
          activeApps.value.length > 0
            ? activeApps.value[activeApps.value.length - 1].id
            : null;
      }
    }
  };

  const getAppZIndex = (appId) => {
    // If terminal is focused (focusedAppId is null), all apps go to base z-index
    // If an app is focused, it gets the highest z-index while others get base
    if (focusedAppId.value === null) {
      return BASE_Z_INDEX;
    }
    return appId === focusedAppId.value ? FOCUSED_Z_INDEX : BASE_Z_INDEX;
  };

  return {
    activeApps,
    focusedAppId,
    launchApp,
    closeApp,
    focusApp,
    getAppZIndex,
  };
}
