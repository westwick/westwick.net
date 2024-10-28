export const COMMAND_COLORS = {
  GREEN: "\x1b[32m",
};

import { mainmenu } from "@/assets/mainmenu.js";

export const AVAILABLE_COMMANDS = {
  home: {
    description: "Show main menu",
    action: (terminal) => {
      terminal.clear();
      terminal.writeln("\x1b[2J\x1b[H"); // Clear screen and move cursor to home position
      terminal.writeln(mainmenu);
      terminal.write("\r\n\r\n$ ");
      //   terminal.writeln("\r\n\r\n$ ");
    },
  },
  messages: {
    description: "Show this help message",
    action: (terminal) => {
      terminal.writeln("\r\nAvailable commands:");
      Object.entries(AVAILABLE_COMMANDS).forEach(([cmd, details]) => {
        terminal.writeln(`  ${cmd} - ${details.description}`);
      });
      terminal.write("\r\n$ ");
      terminal.scrollToBottom();
    },
  },
  games: {
    description: "Launch games menu",
    action: (terminal) => {
      terminal.writeln("\r\n!! Games !!");
      terminal.write("\r\n$ ");
      terminal.scrollToBottom();
    },
  },
  music: {
    description: "Open music player",
    action: (terminal) => {
      terminal.writeln("\r\nOpening music player...");
      terminal.write("\r\n$ ");
      terminal.scrollToBottom();
    },
  },
};

export function executeCommand(terminal, commandStr) {
  const command = AVAILABLE_COMMANDS[commandStr];
  if (command) {
    command.action(terminal);
  } else {
    terminal.writeln(`\r\nCommand not found: ${commandStr}`);
    terminal.write("\r\n$ ");
  }
}
