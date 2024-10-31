<template>
  <div class="rapper">
    <SenetControls
      :player-turn="playerTurn"
      :turn-status="turnStatus"
      :roll="roll"
      :no-valid-moves="noValidMoves"
      @roll="handleRoll"
      @skip="handleSkip"
    />

    <!-- <h1>Senet</h1>
    <div class="game-stats">
      Stats:
      <pre>{{ JSON.stringify(stats, null, 1) }}</pre>
    </div> -->

    <div class="board">
      <svg
        class="move-arrows"
        ref="arrowsSvg"
        :width="boardWidth"
        :height="boardHeight"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            :orient="arrowOrientation"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--primary-color)" />
          </marker>
        </defs>
        <path
          v-if="showArrow"
          :d="arrowPath"
          fill="none"
          stroke="var(--primary-color)"
          stroke-width="2"
          marker-end="url(#arrowhead)"
        />
      </svg>

      <div class="row row1">
        <SenetHouse
          v-for="id in SENET_ROW_1"
          :key="id"
          :id="id"
          :board-state="boardState"
          :house-state="houseState"
          :valid-moves="validMoves"
          :best-move="bestMove"
          :selected-id="selectedPiece"
          :target="targetHouse"
          @piece-selected="pieceSelected"
          @piece-hover="onPieceHover"
          @piece-leave="onPieceLeave"
        />
      </div>

      <div class="row row2">
        <SenetHouse
          v-for="id in SENET_ROW_2"
          :key="id"
          :id="id"
          :board-state="boardState"
          :house-state="houseState"
          :valid-moves="validMoves"
          :best-move="bestMove"
          :selected-id="selectedPiece"
          :target="targetHouse"
          @piece-selected="pieceSelected"
          @piece-hover="onPieceHover"
          @piece-leave="onPieceLeave"
        />
      </div>

      <div class="row row3">
        <SenetHouse
          v-for="id in SENET_ROW_3"
          :key="id"
          :id="id"
          :board-state="boardState"
          :house-state="houseState"
          :valid-moves="validMoves"
          :best-move="bestMove"
          :selected-id="selectedPiece"
          :target="targetHouse"
          @piece-selected="pieceSelected"
          @piece-hover="onPieceHover"
          @piece-leave="onPieceLeave"
        />
        <SenetHouse
          v-if="showExit"
          class="house-exit"
          :key="31"
          :id="31"
          :board-state="boardState"
          :house-state="houseState"
          :valid-moves="validMoves"
          :best-move="bestMove"
          :selected-id="selectedPiece"
          :target="targetHouse"
          @piece-selected="pieceSelected"
          @piece-hover="onPieceHover"
          @piece-leave="onPieceLeave"
        />
      </div>
    </div>
    <SenetRules />
  </div>
</template>

<script setup>
import gsap from "gsap";
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import SenetHouse from "./SenetHouse.vue";
import SenetControls from "./SenetControls.vue";
import SenetRules from "./SenetRules.vue";
import {
  SENET_ROW_1,
  SENET_ROW_2,
  SENET_ROW_3,
  INITIAL_BOARD_STATE,
} from "./senetConstants";

// Reactive state
const boardState = ref({});
const selectedPiece = ref(undefined);
const roll = ref({ value: 0, timestamp: Date.now() });
const turn = ref(1);
const stats = ref({
  turn: 1,
  blackRolls: 0,
  whiteRolls: 0,
  blackPips: 0,
  whitePips: 0,
  blackDistance: 0,
  whiteDistance: 0,
});
const playerTurn = ref("white");
const turnStatus = ref("roll");

const isComputerTurn = computed(() => playerTurn.value === "black");
const isAnimating = ref(false);
const bestMove = ref(null);

const calculateBestMove = () => {
  const possibleMoves = [1, 2, 3, 4, 5].filter(
    (piece) => validMoves.value[piece]
  );
  if (!possibleMoves.length) {
    console.log("🤖 I have no valid moves available");
    return null;
  }

  // Helper to check if a move would create/maintain a blockade
  const wouldCreateBlockade = (piece, target) => {
    const row = Math.floor((target - 1) / 10);
    const rowStart = row * 10 + 1;
    const rowEnd = (row + 1) * 10;

    // Create temporary board state with the move
    const tempState = { ...houseState.value };
    if (tempState[target]) delete tempState[target];
    delete tempState[boardState.value[piece]];
    tempState[target] = piece;

    // Check each possible sequence of 3 in the row
    for (let i = rowStart; i <= rowEnd - 2; i++) {
      const pieces = [tempState[i], tempState[i + 1], tempState[i + 2]];
      if (pieces.every((p) => p && p <= 5)) return true;
    }
    return false;
  };

  // Helper to check if a move would break an existing blockade
  const wouldBreakBlockade = (piece, currentState) => {
    // First check if piece is part of any existing blockade
    const currentPos = currentState[piece];
    const row = Math.floor((currentPos - 1) / 10);
    const rowStart = row * 10 + 1;
    const rowEnd = (row + 1) * 10;

    for (let i = rowStart; i <= rowEnd - 2; i++) {
      const pieces = [
        houseState.value[i],
        houseState.value[i + 1],
        houseState.value[i + 2],
      ];
      // If this sequence forms a blockade and includes our piece
      if (pieces.every((p) => p && p <= 5) && pieces.includes(piece)) {
        // Check if moving would break it and no new blockade would be created
        const target = currentPos + roll.value.value;
        if (!wouldCreateBlockade(piece, target)) {
          return true;
        }
      }
    }
    return false;
  };

  // Helper to check if a move would land next to friendly piece
  const wouldLandNextToFriendly = (target) => {
    const prev = target - 1;
    const next = target + 1;
    const row = Math.floor((target - 1) / 10);
    const prevRow = Math.floor((prev - 1) / 10);
    const nextRow = Math.floor((next - 1) / 10);

    // Create temporary board state to check after the move
    const tempState = { ...houseState.value };

    // Remove the piece from its current position
    Object.entries(tempState).forEach(([house, piece]) => {
      if (piece <= 5) {
        // Only check black pieces
        const currentPos = boardState.value[piece];
        if (currentPos === prev || currentPos === next) {
          delete tempState[house];
        }
      }
    });

    return (
      (row === prevRow && tempState[prev] && tempState[prev] <= 5) ||
      (row === nextRow && tempState[next] && tempState[next] <= 5)
    );
  };

  // For each priority, filter moves that match and return the best one if found
  for (const piece of possibleMoves) {
    const source = boardState.value[piece];
    const target = source + roll.value.value;

    // 1. Avoid trap square unless forced
    if (target === 27) {
      if (possibleMoves.length > 1) {
        console.log(`🤖 Avoiding moving from ${source} to trap square (27)`);
        continue;
      } else {
        console.log(`🤖 Forced to move from ${source} to trap square (27)`);
        return piece;
      }
    }

    // 2. Check blockade situations
    const blockadeBreakers = possibleMoves.filter((p) =>
      wouldBreakBlockade(p, boardState.value)
    );
    const safeMovers = possibleMoves.filter(
      (p) => !blockadeBreakers.includes(p)
    );

    if (blockadeBreakers.length) {
      if (safeMovers.length) {
        // We have options that don't break blockades
        const move = safeMovers[0];
        const moveSource = boardState.value[move];
        const moveTarget = moveSource + roll.value.value;
        const breakerSource = boardState.value[blockadeBreakers[0]];
        console.log(
          `🤖 Moving from ${moveSource} to ${moveTarget} to maintain blockade (moving from ${breakerSource} would break it)`
        );
        return move;
      } else if (possibleMoves.length === 1) {
        // We're forced to break a blockade because it's our only move
        const move = possibleMoves[0];
        const moveSource = boardState.value[move];
        const moveTarget = moveSource + roll.value.value;
        console.log(
          `🤖 Forced to break blockade by moving from ${moveSource} to ${moveTarget} - it's my only valid move`
        );
        return move;
      }
      // If we have multiple moves but they all break blockades, continue to other priorities
    }

    // 3. Create new blockade
    const blockadeCreators = possibleMoves.filter((p) =>
      wouldCreateBlockade(p, boardState.value[p] + roll.value.value)
    );
    if (blockadeCreators.length) {
      const move = blockadeCreators[0];
      const moveSource = boardState.value[move];
      const moveTarget = moveSource + roll.value.value;
      console.log(
        `🤖 Creating new blockade by moving from ${moveSource} to ${moveTarget}`
      );
      return move;
    }

    // 4. Land next to friendly piece
    const friendlyMoves = possibleMoves.filter((p) =>
      wouldLandNextToFriendly(boardState.value[p] + roll.value.value)
    );
    if (friendlyMoves.length) {
      const move = friendlyMoves[0];
      const moveSource = boardState.value[move];
      const moveTarget = moveSource + roll.value.value;
      console.log(
        `🤖 Moving from ${moveSource} to ${moveTarget} to protect friendly piece`
      );
      return move;
    }

    // 5. Land on safe squares
    const safeSquares = [15, 26, 28, 29];
    const safeMoves = possibleMoves.filter((p) =>
      safeSquares.includes(boardState.value[p] + roll.value.value)
    );
    if (safeMoves.length) {
      const move = safeMoves[0];
      const moveSource = boardState.value[move];
      const moveTarget = moveSource + roll.value.value;
      console.log(`🤖 Moving from ${moveSource} to safe square ${moveTarget}`);
      return move;
    }

    // 6. Capture enemy piece
    const captureMoves = possibleMoves.filter((p) => {
      const t = boardState.value[p] + roll.value.value;
      return houseState.value[t] && houseState.value[t] >= 6;
    });
    if (captureMoves.length) {
      const move = captureMoves[0];
      const moveSource = boardState.value[move];
      const moveTarget = moveSource + roll.value.value;
      const capturedPiece = houseState.value[moveTarget];
      console.log(
        `🤖 Capturing enemy piece ${capturedPiece} at position ${moveTarget} with piece ${move}`
      );
      return move;
    }
  }

  // 7. Move furthest piece if no other conditions met
  const furthestPiece = possibleMoves.sort(
    (a, b) => boardState.value[b] - boardState.value[a]
  )[0];
  const moveSource = boardState.value[furthestPiece];
  const moveTarget = moveSource + roll.value.value;
  console.log(
    `🤖 No special moves available. Moving furthest piece from ${moveSource} to ${moveTarget}`
  );
  return furthestPiece;
};

const makeComputerMove = async () => {
  if (!isComputerTurn.value || turnStatus.value === "roll") return;

  // Add small delay before showing the move
  await new Promise((resolve) => setTimeout(resolve, 1));

  bestMove.value = calculateBestMove();
  if (!bestMove.value) {
    handleSkip();
    return;
  }

  // Show the arrow by setting selectedPiece
  selectedPiece.value = bestMove.value;

  // Wait a moment to let player see the intended move
  await new Promise((resolve) => setTimeout(resolve, 700));

  // Make the move
  const targetHouseId = boardState.value[bestMove.value] + roll.value.value;
  pieceSelected(targetHouseId);
};

// Helper methods
const getColor = (pieceId) => {
  if (!pieceId) return "empty";
  return pieceId <= 5 ? "black" : "white";
};

const isBlockade = (indexes, enemyColor) => {
  const [check1, check2, check3] = indexes;
  const check1row = Math.floor((check1 - 1) / 10) + 1;
  const check2row = Math.floor((check2 - 1) / 10) + 1;
  const check3row = Math.floor((check3 - 1) / 10) + 1;
  const check1color = getColor(houseState.value[check1]);
  const check2color = getColor(houseState.value[check2]);
  const check3color = getColor(houseState.value[check3]);

  return (
    check1row === check2row &&
    check2row === check3row &&
    check1color === enemyColor &&
    check2color === enemyColor &&
    check3color === enemyColor
  );
};

const getTrapSquare = () => {
  if (getColor(houseState.value[15]) === "empty") return 15;
  if (getColor(houseState.value[14]) === "empty") return 14;
  if (getColor(houseState.value[13]) === "empty") return 13;
  if (getColor(houseState.value[12]) === "empty") return 12;
  return 11;
};

const canPieceMove = (pieceId) => {
  if (turnStatus.value !== "move") return false;

  if (playerTurn.value === "white" && pieceId <= 5) return false;
  if (playerTurn.value === "black" && pieceId >= 6) return false;

  const destination = boardState.value[pieceId] + roll.value.value;
  const destinationColor = getColor(houseState.value[destination]);

  if (destination === 31) return true;

  // can't move to house occupied by same color
  if (destinationColor === playerTurn.value) return false;

  const enemyColor = playerTurn.value === "white" ? "black" : "white";
  if (destinationColor === enemyColor) {
    const prevGuarded =
      ![1, 11, 21].includes(destination) &&
      getColor(houseState.value[destination - 1]) === enemyColor;
    const nextGuarded =
      ![10, 20, 30].includes(destination) &&
      getColor(houseState.value[destination + 1]) === enemyColor;

    // can't land on a guarded square
    if (nextGuarded || prevGuarded) return false;

    // can't land on safe spaces
    if ([15, 26, 28, 29].includes(destination)) return false;
  }

  // required to stop on 26
  if (destination > 26 && boardState.value[pieceId] !== 26) return false;

  // can't jump over a blockade
  if (roll.value.value === 4) {
    if (
      isBlockade(
        [destination - 3, destination - 2, destination - 1],
        enemyColor
      )
    ) {
      return false;
    }
  }

  if (roll.value.value === 5) {
    if (
      isBlockade(
        [destination - 3, destination - 2, destination - 1],
        enemyColor
      ) ||
      isBlockade(
        [destination - 4, destination - 3, destination - 2],
        enemyColor
      )
    ) {
      return false;
    }
  }

  if (destination > 31) return false;

  return true;
};

// Computed properties
const houseState = computed(() => {
  const result = {};
  Object.entries(boardState.value).forEach(([piece, position]) => {
    result[position] = +piece;
  });
  return result;
});

const targetHouse = computed(() => {
  return (
    selectedPiece.value &&
    boardState.value[selectedPiece.value] + roll.value.value
  );
});

const validMoves = computed(() => ({
  1: canPieceMove(1),
  2: canPieceMove(2),
  3: canPieceMove(3),
  4: canPieceMove(4),
  5: canPieceMove(5),
  6: canPieceMove(6),
  7: canPieceMove(7),
  8: canPieceMove(8),
  9: canPieceMove(9),
  10: canPieceMove(10),
}));

const noValidMoves = computed(() => {
  return !Object.values(validMoves.value).some((move) => move);
});

const showExit = computed(() => {
  if (turnStatus.value !== "move") return false;

  if (playerTurn.value === "black") {
    return [1, 2, 3, 4, 5].some(
      (piece) => boardState.value[piece] + roll.value.value === 31
    );
  }

  if (playerTurn.value === "white") {
    return [6, 7, 8, 9, 10].some(
      (piece) => boardState.value[piece] + roll.value.value === 31
    );
  }

  return false;
});

// Game state methods
const initBoardState = () => {
  boardState.value = { ...INITIAL_BOARD_STATE };
};

const nextTurn = (trapped) => {
  turnStatus.value = "roll";
  bestMove.value = null;
  if (roll.value.value === 2 || roll.value.value === 3 || trapped) {
    playerTurn.value = playerTurn.value === "white" ? "black" : "white";
    turn.value++;
  }
};

// Event handlers
const handleRoll = () => {
  console.log("handleRoll called, current roll:", roll.value.value);
  bestMove.value = null;
  const rand = Math.floor(Math.random() * 5) + 1;
  roll.value = { value: rand, timestamp: Date.now() };
  console.log("New roll value set to:", roll.value);
  turnStatus.value = "move";

  if (playerTurn.value === "white") {
    stats.value.whiteRolls++;
  } else {
    stats.value.blackRolls++;
  }
};

const handleSkip = () => {
  turnStatus.value = "roll";
  playerTurn.value = playerTurn.value === "white" ? "black" : "white";
  stats.value.turn++;
};

const pieceSelected = async (houseId) => {
  if (isAnimating.value) return;
  const pieceId = houseState.value[houseId];

  if (instantMove.value && validMoves.value[pieceId]) {
    // If instant move is on and this is a valid piece, immediately move to target
    selectedPiece.value = pieceId;
    const targetHouseId = boardState.value[pieceId] + roll.value.value;
    // Call self again with target house
    pieceSelected(targetHouseId);
    return;
  }

  if (houseId === targetHouse.value && selectedPiece.value) {
    isAnimating.value = true;
    const newBoardState = { ...boardState.value };
    let trapped = false;

    // Get DOM elements for animation
    const pieceElement = document.querySelector(
      `[data-piece="${selectedPiece.value}"]`
    );
    const targetElement = document.querySelector(`[data-house="${houseId}"]`);

    if (pieceElement && targetElement) {
      // Calculate absolute positions
      const pieceRect = pieceElement.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();

      // Reset any existing transforms
      gsap.set(pieceElement, { clearProps: "all" });

      // Animate using absolute values
      await gsap.fromTo(
        pieceElement,
        {
          position: "fixed",
          left: pieceRect.left,
          top: pieceRect.top,
          width: pieceRect.width,
          height: pieceRect.height,
          margin: 0,
        },
        {
          duration: 0.2,
          left: targetRect.left + 8,
          top: targetRect.top + 8,
          ease: "power2.out",
        }
      );

      // If it's a capture, animate the captured piece
      if (houseState.value[houseId]) {
        const capturedPiece = document.querySelector(
          `[data-piece="${houseState.value[houseId]}"]`
        );
        const oldPosition = document.querySelector(
          `[data-house="${boardState.value[selectedPiece.value]}"]`
        );

        if (capturedPiece && oldPosition) {
          const capturedRect = capturedPiece.getBoundingClientRect();
          const oldRect = oldPosition.getBoundingClientRect();

          // Reset any existing transforms
          gsap.set(capturedPiece, { clearProps: "all" });

          await gsap.fromTo(
            capturedPiece,
            {
              position: "fixed",
              left: capturedRect.left,
              top: capturedRect.top,
              width: capturedRect.width,
              height: capturedRect.height,
              margin: 0,
            },
            {
              duration: 0.2,
              left: oldRect.left + 10,
              top: oldRect.top + 10,
              ease: "power2.out",
            }
          );
        }
      }

      // Reset positions after animation
      gsap.set([pieceElement, `[data-piece="${houseState.value[houseId]}"]`], {
        clearProps: "all",
      });
    }

    // Rest of your existing move logic
    if (getColor(houseState.value[houseId]) === "empty") {
      if (houseId === 27) {
        trapped = true;
        newBoardState[selectedPiece.value] = getTrapSquare();
      } else if (houseId === 31) {
        newBoardState[selectedPiece.value] = 99;
      } else {
        newBoardState[selectedPiece.value] = houseId;
      }
    } else {
      const oldHouseId = boardState.value[selectedPiece.value];
      const oldPiece = houseState.value[houseId];
      newBoardState[oldPiece] = oldHouseId;
      newBoardState[selectedPiece.value] = houseId;
    }

    selectedPiece.value = undefined;
    boardState.value = newBoardState;
    isAnimating.value = false;

    // Rest of your existing logic
    if (playerTurn.value === "white") {
      stats.value.whiteDistance += roll.value.value;
    } else {
      stats.value.blackDistance += roll.value.value;
    }

    nextTurn(trapped);
  } else if (validMoves.value[pieceId]) {
    selectedPiece.value = pieceId;
  }
};

const handleKeyPress = () => {
  if (turnStatus.value === "roll") {
    handleRoll();
  } else if (noValidMoves.value) {
    handleSkip();
  }
};

// Helper functions for stats
const calculateBlackPips = (state) => {
  return [1, 2, 3, 4, 5].reduce((sum, piece) => {
    return sum + (state[piece] > 31 ? 0 : 31 - state[piece]);
  }, 0);
};

const calculateWhitePips = (state) => {
  return [6, 7, 8, 9, 10].reduce((sum, piece) => {
    return sum + (state[piece] > 31 ? 0 : 31 - state[piece]);
  }, 0);
};

// Lifecycle hooks
onMounted(() => {
  initBoardState();
  window.addEventListener("keydown", handleKeyPress);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyPress);
});

// Watchers
watch(
  boardState,
  (newState) => {
    const blackPips = calculateBlackPips(newState);
    const whitePips = calculateWhitePips(newState);
    stats.value = {
      ...stats.value,
      blackPips,
      whitePips,
    };
  },
  { deep: true }
);

watch(turn, (newTurn) => {
  stats.value.turn = newTurn;
});

watch([playerTurn, turnStatus], async ([newPlayer, newStatus]) => {
  if (newPlayer === "black" && newStatus === "roll") {
    await new Promise((resolve) => setTimeout(resolve, 500));
    handleRoll();
  }
  if (newPlayer === "black" && newStatus === "move") {
    await new Promise((resolve) => setTimeout(resolve, 200));
    makeComputerMove();
  }
});

// Add new refs and computed properties
const arrowsSvg = ref(null);
const boardWidth = ref(0);
const boardHeight = ref(0);
const hoverPiece = ref(null);
const instantMove = ref(true);

// Helper to get next house in path
const getNextHouseInPath = (current, end) => {
  // Special case for vertical moves
  if (current === 10 && end >= 11) return 11;
  if (current === 20 && end >= 21) return 21;

  const currentRow = Math.floor((current - 1) / 10);
  const endRow = Math.floor((end - 1) / 10);

  // Handle movements within each row
  if (currentRow === 0) {
    // Row 1: left to right
    return current < end ? current + 1 : null;
  } else if (currentRow === 1) {
    // Row 2: right to left
    if (endRow === 2) {
      // Always move to 20 first when going to row 3
      return 20;
    }
    return current > end ? current - 1 : null;
  } else if (currentRow === 2) {
    // Row 3: left to right
    return current < end ? current + 1 : null;
  }

  return null;
};

const calculatePathBetweenHouses = (start, end) => {
  // Special case for vertical moves
  if ((start === 10 && end === 11) || (start === 20 && end === 21)) {
    const startHouse = document.querySelector(`[data-house="${start}"]`);
    const endHouse = document.querySelector(`[data-house="${end}"]`);
    const svgRect = arrowsSvg.value?.getBoundingClientRect();

    if (startHouse && endHouse && svgRect) {
      const startRect = startHouse.getBoundingClientRect();
      const endRect = endHouse.getBoundingClientRect();

      const x = startRect.left - svgRect.left + startRect.width / 2;
      const startY = startRect.top - svgRect.top + startRect.height / 2;
      const endY = endRect.top - svgRect.top + endRect.height / 2;

      return `M ${x},${startY} L ${x},${endY}`;
    }
  }

  const path = [];
  let current = start;

  const svgRect = arrowsSvg.value?.getBoundingClientRect();
  if (!svgRect) return "";

  const housesInPath = [];
  const maxSteps = 30;
  let steps = 0;

  // Build path
  while (current !== end && steps < maxSteps) {
    housesInPath.push(current);
    const next = getNextHouseInPath(current, end);
    if (!next) break;
    current = next;
    steps++;
  }
  housesInPath.push(end);

  // Create SVG path
  housesInPath.forEach((houseId, index) => {
    const house = document.querySelector(`[data-house="${houseId}"]`);
    if (!house) return;

    const rect = house.getBoundingClientRect();
    const point = {
      x: rect.left - svgRect.left + rect.width / 2,
      y: rect.top - svgRect.top + rect.height / 2,
    };

    if (index === 0) {
      path.push(`M ${point.x},${point.y}`);
    } else {
      // Check if this is a corner (row transition)
      const prevHouse = housesInPath[index - 1];
      const prevRow = Math.floor((prevHouse - 1) / 10);
      const currentRow = Math.floor((houseId - 1) / 10);

      if (prevRow !== currentRow) {
        // This is a corner - add a vertical line first
        const prevHouseEl = document.querySelector(
          `[data-house="${prevHouse}"]`
        );
        const prevRect = prevHouseEl.getBoundingClientRect();
        path.push(
          `L ${prevRect.left - svgRect.left + prevRect.width / 2},${point.y}`
        );
      }

      path.push(`L ${point.x},${point.y}`);
    }
  });

  return path.join(" ");
};

// Make sure arrowPath is using both hover and selected states
const arrowPath = computed(() => {
  const pieceId = selectedPiece.value || hoverPiece.value;
  if (!pieceId || !validMoves.value[pieceId]) return "";

  const start = boardState.value[pieceId];
  const end = start + roll.value.value;

  return calculatePathBetweenHouses(start, end);
});

// And verify showArrow includes both states
const showArrow = computed(() => {
  if (isComputerTurn.value) {
    // During CPU turn, only show arrow when selectedPiece is set
    return selectedPiece.value && validMoves.value[selectedPiece.value];
  }
  // During player turn, show arrow on hover or selection as before
  return (
    (hoverPiece.value && validMoves.value[hoverPiece.value]) ||
    (selectedPiece.value && validMoves.value[selectedPiece.value])
  );
});

// Add event handlers to SenetHouse component
const onPieceHover = (pieceId) => {
  if (turnStatus.value === "move" && validMoves.value[pieceId]) {
    hoverPiece.value = pieceId;
  }
};

const onPieceLeave = () => {
  hoverPiece.value = null;
};

const arrowOrientation = computed(() => {
  const pieceId = selectedPiece.value || hoverPiece.value;
  if (!pieceId || !validMoves.value[pieceId]) return "auto";

  const start = boardState.value[pieceId];
  const end = start + roll.value.value;

  return end === 11 || end === 21 ? "90" : "auto";
});
</script>

<style scoped>
.board {
  border: 2px solid var(--secondary-color);
  position: relative; /* Make sure this is set */
}
.rapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.game-state {
  text-align: center;
  margin-bottom: 5px;
  display: flex;
  color: #eee;
}

.row {
  display: flex;
}

.house {
  border-right: 1px solid var(--border-color);
}
.house:last-child {
  border-right: none;
}

.row1 .house,
.row2 .house {
  border-bottom: 2px solid var(--secondary-color);
}

.row1 .house10,
.row2 .house20 {
  border-bottom: 1px solid var(--border-color);
}

.house26 {
  border-right: 2px solid var(--secondary-color);
}

.row3 .house30 {
  border-right: none;
}

.house-exit {
  position: absolute;
  left: 100%;
  border-left: 2px solid var(--background-color);
}

.roller {
  padding: 10px 20px;
  margin: 10px;
  cursor: pointer;
  background-color: var(--background-color);
  border: 2px solid var(--primary-color);
  color: var(--primary-color);
}

.roller:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.game-stats {
  margin: 20px 0;
}

.move-arrows {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 10;
  width: 100%; /* Make sure SVG fills the board */
  height: 100%;
}
</style>
