<template>
  <div class="rapper">
    <div class="game-state">
      <p>{{ playerTurn }}'s turn:&nbsp;</p>
      <p>
        {{ playerTurn }} to {{ turnStatus }}
        {{ turnStatus === "move" ? roll : "" }}
      </p>
      <div v-if="turnStatus === 'move' && noValidMoves">
        <p>No Valid Moves!</p>
        <button class="roller" @click="handleSkip">Next Turn</button>
      </div>
      <button
        class="roller"
        @click="handleRoll"
        :disabled="turnStatus !== 'roll'"
      >
        Roll
      </button>
    </div>

    <!-- <h1>Senet</h1>
    <div class="game-stats">
      Stats:
      <pre>{{ JSON.stringify(stats, null, 1) }}</pre>
    </div> -->

    <div class="row row1">
      <SenetHouse
        v-for="id in row1"
        :key="id"
        :id="id"
        :board-state="boardState"
        :house-state="houseState"
        :valid-moves="validMoves"
        :selected-id="selectedPiece"
        :target="targetHouse"
        @piece-selected="pieceSelected"
      />
    </div>

    <div class="row row2">
      <SenetHouse
        v-for="id in row2"
        :key="id"
        :id="id"
        :board-state="boardState"
        :house-state="houseState"
        :valid-moves="validMoves"
        :selected-id="selectedPiece"
        :target="targetHouse"
        @piece-selected="pieceSelected"
      />
    </div>

    <div class="row row3">
      <SenetHouse
        v-for="id in row3"
        :key="id"
        :id="id"
        :board-state="boardState"
        :house-state="houseState"
        :valid-moves="validMoves"
        :selected-id="selectedPiece"
        :target="targetHouse"
        @piece-selected="pieceSelected"
      />
      <SenetHouse
        v-if="showExit"
        :key="31"
        :id="31"
        :board-state="boardState"
        :house-state="houseState"
        :valid-moves="validMoves"
        :selected-id="selectedPiece"
        :target="targetHouse"
        @piece-selected="pieceSelected"
      />
    </div>

    <div class="rules">
      <p>
        Senet is an ancient egyptian game played by pharaohs and may be up to
        5000 years old making it the oldest known board game in the world.
      </p>
      <p>
        Get your pieces to the end of the board before your opponent. If you
        land on a space occupied by an opponent, capture it by exchanging their
        places.
      </p>
      <p>
        Rolls are 1 through 5. If you roll a 1, 4, or 5 you can roll again. If
        you can make a valid move you must, and if you cannot make any valid
        moves your turn ends.
      </p>
      <p>
        Two pieces of the same color next to each other
        <strong>in the same row</strong> are safe and may not be captured.
      </p>
      <p>
        Three pieces of the same color all next to each other
        <strong>in the same row</strong> are a blockade and may not be captured
        or jumped over.
      </p>
      <p>
        Squares 15, 26, 28 and 29 are safe spaces and may not be captured at any
        time. You can only exit 28 and 29 with an exact roll.
      </p>
      <p>You cannot proceed past square 26 without stopping on it first.</p>
      <p>If you land on square 27 you must return to square 15 instead.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import SenetHouse from "./SenetHouse.vue";

// Constants
const row1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const row2 = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11];
const row3 = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30];

// Reactive state
const boardState = ref({});
const selectedPiece = ref(undefined);
const roll = ref(0);
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

  const destination = boardState.value[pieceId] + roll.value;
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
  if (roll.value === 4) {
    if (
      isBlockade(
        [destination - 3, destination - 2, destination - 1],
        enemyColor
      )
    ) {
      return false;
    }
  }

  if (roll.value === 5) {
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
    selectedPiece.value && boardState.value[selectedPiece.value] + roll.value
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
      (piece) => boardState.value[piece] + roll.value === 31
    );
  }

  if (playerTurn.value === "white") {
    return [6, 7, 8, 9, 10].some(
      (piece) => boardState.value[piece] + roll.value === 31
    );
  }

  return false;
});

// Game state methods
const initBoardState = () => {
  boardState.value = {
    1: 1,
    2: 3,
    3: 5,
    4: 7,
    5: 9,
    6: 2,
    7: 4,
    8: 6,
    9: 8,
    10: 10,
  };
};

const nextTurn = (trapped) => {
  turnStatus.value = "roll";
  if (roll.value === 2 || roll.value === 3 || trapped) {
    playerTurn.value = playerTurn.value === "white" ? "black" : "white";
    turn.value++;
  }
};

// Event handlers
const handleRoll = () => {
  const rand = Math.floor(Math.random() * 5) + 1;
  roll.value = rand;
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

const pieceSelected = (houseId) => {
  const pieceId = houseState.value[houseId];

  if (houseId === targetHouse.value && selectedPiece.value) {
    const newBoardState = { ...boardState.value };
    let trapped = false;

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

    if (playerTurn.value === "white") {
      stats.value.whiteDistance += roll.value;
    } else {
      stats.value.blackDistance += roll.value;
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
</script>

<style scoped>
.rapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.game-state {
  text-align: center;
  margin-bottom: 5px;
  display: flex;
  color: var(--primary-color);
}

.row {
  display: flex;
}

.rules {
  max-width: 600px;
  margin-top: 20px;
  text-align: left;
  color: var(--secondary-color);
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
</style>
