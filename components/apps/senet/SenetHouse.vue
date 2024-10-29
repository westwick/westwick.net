<template>
  <div
    class="house"
    :class="`house${id}`"
    :data-house="id"
    @mouseover="emitHover"
    @mouseleave="$emit('piece-leave')"
  >
    <div class="house-id">{{ id <= 30 ? id : "exit" }}</div>
    <div
      v-if="showPiece"
      :class="`piece piece-${color} ${isSelected ? 'selected' : ''} ${
        canMove ? 'can-move' : ''
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

const emitHover = () => {
  if (pieceId.value) {
    emit("piece-hover", pieceId.value);
  }
};
</script>

<style scoped>
.house {
  width: 48px;
  height: 48px;
  border: 1px solid #333;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.house-id {
  position: absolute;
  top: 2px;
  left: 2px;
  font-size: 12px;
  color: #666;
  display: none;
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
  box-shadow: 0 0 3px 3px rgba(255, 255, 255, 0.5);
}

.can-move {
  cursor: pointer;
  border: 2px solid var(--primary-color);
}

.can-move:hover {
  opacity: 0.8;
}

.target {
  background-color: rgba(0, 255, 0, 0.2);
}
</style>
