<template>
  <div
    class="house"
    :class="`house${id}`"
    :data-house="id"
    @mouseover="emitHover"
    @mouseleave="$emit('piece-leave')"
  >
    <div class="house-id">{{ houseSymbol }}</div>
    <div
      v-if="showPiece"
      :class="`piece piece-${color} ${isSelected ? 'selected' : ''} ${
        shouldHighlight ? 'can-move' : ''
      } ${isTarget ? 'target' : ''}`"
      :data-piece="pieceId"
      @click="$emit('piece-selected', id)"
    ></div>
    <div
      v-else-if="isTarget"
      class="piece piece-none"
      @click="$emit('piece-selected', id)"
    ></div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  id: {
    type: Number,
    required: true,
  },
  houseState: {
    type: Object,
    required: true,
  },
  selectedId: {
    type: Number,
    default: undefined,
  },
  validMoves: {
    type: Object,
    required: true,
  },
  target: {
    type: Number,
    default: undefined,
  },
  bestMove: {
    type: Number,
    default: undefined,
  },
});

const emit = defineEmits(["piece-selected", "piece-hover", "piece-leave"]);

const isSelected = computed(() => {
  return props.houseState && props.selectedId
    ? props.selectedId === props.houseState[props.id]
    : false;
});

const isTarget = computed(() => props.target === props.id);

const pieceId = computed(() => {
  if (props.houseState) {
    return props.houseState[props.id];
  }
  return undefined;
});

const color = computed(() => {
  if (pieceId.value === undefined) return "none";
  return pieceId.value <= 5 ? "black" : "white";
});

const canMove = computed(
  () => pieceId.value !== undefined && props.validMoves[pieceId.value]
);

const showPiece = computed(() => pieceId.value !== undefined);

const houseSymbol = computed(() => {
  if (props.id === 15) return "𓋹";
  if (props.id === 26) return "𓄤𓄤𓄤";
  if (props.id === 27) return "𓈗";
  if (props.id === 28) return "𓅢";
  if (props.id === 29) return "𓁪𓁪";
  if (props.id === 30) return "𓂀";
  return "";
});

const emitHover = () => {
  if (pieceId.value) {
    emit("piece-hover", pieceId.value);
  }
};

const shouldHighlight = computed(() => {
  const piece = props.houseState[props.id];
  if (color.value === "black") {
    // For black's turn (CPU), only highlight the best move
    return piece === props.bestMove && props.validMoves[piece];
  }
  // For white's turn (player), show all valid moves
  return piece !== undefined && props.validMoves[piece];
});
</script>

<style scoped>
.house {
  width: 48px;
  height: 48px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.house-id {
  position: absolute;
  width: 48px;
  height: 48px;
  top: 0;
  left: 0;
  /* transform: translate(0, -50%); */
  font-size: 24px;
  color: #fff;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: -1;
  /* display: none; */
}

.house26 .house-id {
  color: var(--primary-color);
}

.house30 .house-id {
  color: #9e9e9e;
}

.house27 .house-id {
  color: rgb(235, 65, 14);
}

.piece {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
}

.piece-none {
  border: 1px dashed #999;
  background-color: transparent;
}

.piece-black {
  background-color: #000;
  border: 2px solid var(--secondary-color);
}

.piece-white {
  background-color: var(--secondary-color);
  border: 2px solid #000;
}

.selected {
  /* box-shadow: 0 0 3px 3px rgba(255, 255, 255, 0.5); */
}

.can-move {
  cursor: pointer;
  border: 2px solid var(--primary-color);
}

.can-move:hover {
  opacity: 0.8;
}

.target {
  opacity: 0.5;
}
</style>
