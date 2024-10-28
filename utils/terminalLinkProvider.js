import { AVAILABLE_COMMANDS, executeCommand } from "./commands";

export function createLinkProvider(terminal) {
  return {
    provideLinks(bufferLineNumber, callback) {
      const line = terminal.buffer.active.getLine(bufferLineNumber - 1);

      if (!line) {
        return callback(null);
      }

      const text = line.translateToString();
      const links = [];

      Object.keys(AVAILABLE_COMMANDS).forEach((command) => {
        const regex = new RegExp(command, "g");
        let match;

        while ((match = regex.exec(text)) !== null) {
          // Check if the command is in bright green
          const cell = line.getCell(match.index);
          if (cell && cell.getFgColor() === 2) {
            // 2 is the color code for green
            links.push({
              text: command,
              range: {
                start: { x: match.index + 1, y: bufferLineNumber },
                end: { x: match.index + command.length, y: bufferLineNumber },
              },
              activate() {
                // Clear any existing command in the buffer
                terminal.write("\r$ " + command);
                executeCommand(terminal, command);
              },
            });
          }
        }
      });

      callback(links.length > 0 ? links : null);
    },
  };
}
