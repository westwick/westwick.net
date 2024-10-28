import { ref } from "vue";
import xtermPkg from "@xterm/xterm";
const { Terminal } = xtermPkg;
import { executeCommand } from "../utils/commands";

import "@xterm/xterm/css/xterm.css";

const terminalInstance = ref(null);
const command = ref("");

export function useTerminal() {
  const initializeTerminal = async (element) => {
    if (!terminalInstance.value) {
      terminalInstance.value = new Terminal({
        cursorBlink: true,
        fontFamily: "'Roboto Mono', monospace",
        theme: {
          background: "#000",
          black: "#000000",
        },
      });

      const prompt = (term) => {
        command.value = "";
        term.write("\r\n$ ");
      };
      const term = terminalInstance.value;
      const runCommand = (term, command) => {
        // term.write("\r\n");
        executeCommand(term, command);
      };

      term.onData((e) => {
        switch (e) {
          case "\u0003": // Ctrl+C
            term.write("^C");
            prompt(term);
            break;
          case "\r": // Enter
            if (command.value == "") {
              runCommand(term, "home");
            } else {
              runCommand(term, command.value);
              command.value = "";
            }

            break;
          case "\u007F": // Backspace (DEL)
            // Do not delete the prompt
            if (term._core.buffer.x > 2) {
              term.write("\b \b");
              if (command.value.length > 0) {
                command.value = command.value.slice(
                  0,
                  command.value.length - 1
                );
              }
            }
            break;
          default: // Print all other characters for demo
            if (
              (e >= String.fromCharCode(0x20) &&
                e <= String.fromCharCode(0x7e)) ||
              e >= "\u00a0"
            ) {
              command.value += e;
              term.write(e);
            }
        }
      });

      const { FitAddon } = await import("@xterm/addon-fit");
      const { WebLinksAddon } = await import("@xterm/addon-web-links");
      const { WebglAddon } = await import("@xterm/addon-webgl");
      const fitAddon = new FitAddon();
      terminalInstance.value.loadAddon(fitAddon);
      terminalInstance.value.loadAddon(new WebLinksAddon());
      terminalInstance.value.open(element);
      terminalInstance.value.loadAddon(new WebglAddon());
      fitAddon.fit();
      setTimeout(() => {
        // terminalInstance.value.focus();
      }, 100);

      // Import and register the new link provider
      const { createLinkProvider } = await import(
        "../utils/terminalLinkProvider"
      );
      terminalInstance.value.registerLinkProvider(
        createLinkProvider(terminalInstance.value)
      );
    }
  };

  const writeln = (text) => {
    terminalInstance.value.write(text);
  };

  const sendCommand = (cmd) => {
    if (terminalInstance.value) {
      command.value = cmd;
      terminalInstance.value.write(cmd);
      executeCommand(terminalInstance.value, cmd);
      command.value = "";
      // terminalInstance.value.write("\r\n$ ");
    }
  };

  return {
    initializeTerminal,
    writeln,
    sendCommand,
    terminal: terminalInstance,
  };
}
