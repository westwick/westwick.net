<template>
  <div class="players">
    <div class="player1">
      <div class="player-profile" :class="{ active: playerTurn === 'white' }">
        <img src="@/assets/images/user.jpg" />
        <p>You<br />&nbsp;</p>
        <div class="roll-history">
          <div
            v-for="roll in playerRolls"
            :key="roll.animationKey"
            class="roll-number"
            :class="{ 'reroll-value': isRerollValue(roll.value) }"
            :ref="
              (el) => {
                if (roll.id === playerRolls[0]?.id) latestPlayerRoll = el;
              }
            "
            style="opacity: 0"
          >
            {{ roll.value }}
          </div>
        </div>
      </div>
    </div>
    <div class="action-status">
      <p>{{ status }}</p>
      <button
        class="roller"
        @click="onRoll"
        :disabled="turnStatus !== 'roll' || playerTurn !== 'white'"
        v-if="turnStatus === 'roll'"
      >
        Roll
      </button>
      <button
        v-if="playerTurn === 'white' && turnStatus === 'move' && noValidMoves"
        class="roller"
        @click="onSkip"
      >
        Ok
      </button>
    </div>
    <div class="player2">
      <div class="player-profile" :class="{ active: playerTurn === 'black' }">
        <img src="@/assets/images/pharaoh.jpg" />
        <p>Pharaoh Rastep</p>
        <div class="roll-history">
          <div
            v-for="roll in cpuRolls"
            :key="roll.id"
            class="roll-number"
            :class="{ 'reroll-value': isRerollValue(roll.value) }"
            :ref="
              (el) => {
                if (roll.id === cpuRolls[0]?.id) latestCpuRoll = el;
              }
            "
            style="opacity: 0"
          >
            {{ roll.value }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import gsap from "gsap";

const props = defineProps({
  playerTurn: {
    type: String,
    required: true,
  },
  turnStatus: {
    type: String,
    required: true,
  },
  roll: {
    type: Object,
    required: true,
  },
  noValidMoves: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["roll", "skip"]);

const onRoll = () => emit("roll");
const onSkip = () => emit("skip");

const status = computed(() => {
  if (props.playerTurn === "black") {
    return "(Opponent's turn)";
  }

  if (props.turnStatus === "roll") {
    return "Your turn to roll.";
  }

  if (props.noValidMoves) {
    return "No valid moves!\nNext turn.";
  }

  return `You rolled a ${props.roll.value}.\nSelect a piece to move.`;
});

const playerRolls = ref([]);
const cpuRolls = ref([]);
const latestPlayerRoll = ref(null);
const latestCpuRoll = ref(null);

const isRerollValue = (roll) =>
  [1, 4, 5].includes(typeof roll === "object" ? roll.value : roll);

watch(
  () => props.playerTurn,
  () => {
    playerRolls.value = [];
    cpuRolls.value = [];
  }
);

console.log("Initial roll value:", props.roll);

watch(
  () => props.roll,
  (newRoll, oldRoll) => {
    console.log("Roll watcher triggered:", { newRoll, oldRoll });
    if (!newRoll?.value) return;

    const rolls = props.playerTurn === "white" ? playerRolls : cpuRolls;
    rolls.value.unshift({
      value: newRoll.value,
      id: Date.now(),
      animationKey: Math.random(),
    });
    if (rolls.value.length > 5) rolls.value.pop();

    console.log("New Roll:", newRoll.value);
    console.log("Current Roll History:", props.playerTurn, rolls.value);
    console.log(
      "Latest Roll Element:",
      props.playerTurn === "white"
        ? latestPlayerRoll.value
        : latestCpuRoll.value
    );

    setTimeout(() => {
      const target =
        props.playerTurn === "white"
          ? latestPlayerRoll.value
          : latestCpuRoll.value;

      if (target) {
        const tl = gsap.timeline();

        // Calculate start position
        const roller = document.querySelector(".action-status");
        const startPos = roller?.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();

        const historyElements = Array.from(
          target?.parentElement?.children || []
        );

        // Immediately set positions for ALL elements
        gsap.set(target, { opacity: 0 }); // Hide new element initially
        gsap.set(historyElements, {
          y: (index) => {
            if (index === 0) return 0; // new element
            // Set previous positions for existing elements
            const prevIndex = index - 1;
            return -8 * prevIndex * Math.max(0.7, 1 - prevIndex * 0.1);
          },
          scale: (index) => {
            if (index === 0) return 1; // new element
            const prevIndex = index - 1;
            return Math.max(0.7, 1 - prevIndex * 0.1);
          },
          opacity: (index) => {
            if (index === 0) return 0; // new element
            const prevIndex = index - 1;
            return Math.max(0.3, 1 - prevIndex * 0.2);
          },
        });

        // Now animate everything
        tl.fromTo(
          target,
          {
            scale: 2,
            opacity: 0,
            rotation: props.playerTurn === "white" ? 360 : -360,
            x: startPos.left - targetRect.left,
            y: startPos.top - targetRect.top,
          },
          {
            scale: 1,
            opacity: 1,
            rotation: 0,
            x: 0,
            y: 0,
            duration: 0.8,
            ease: "back.out(0.5)",
          }
        ).to(
          historyElements.slice(1),
          {
            scale: (index) => Math.max(0.7, 1 - (index + 1) * 0.1),
            y: (index) =>
              -8 * (index + 1) * Math.max(0.7, 1 - (index + 1) * 0.1),
            opacity: (index) => Math.max(0.3, 1 - (index + 1) * 0.2),
            color: "#696969",
            borderColor: "#696969",
            duration: 0.4,
            ease: "power2.out",
            stagger: {
              amount: 0.1,
              from: "start",
            },
          },
          "-=0.4"
        );
      }
    }, 100);
  },
  { immediate: true }
);

watch(
  () => props.turnStatus,
  (newStatus, oldStatus) => {
    if (oldStatus === "move" && newStatus === "roll") {
      const target =
        props.playerTurn === "white"
          ? latestPlayerRoll.value
          : latestCpuRoll.value;

      if (target) {
        gsap.to(target, {
          color: "#696969",
          borderColor: "#696969",
          duration: 0.3,
        });
      }
    }
  }
);
</script>

<style scoped>
.actions {
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.roller {
  padding: 0.5rem 1rem;
  background-color: var(--background-color);
  border: 2px solid var(--primary-color);
  color: var(--primary-color);
  border-radius: 4px;
  cursor: pointer;
  font-size: 18px;
  padding: 0.5rem 1rem;
}

.roller:disabled {
  background-color: var(--background-color);
  border-color: #696969;
  color: #575757;
  cursor: not-allowed;
}

.players {
  width: 100%;
  display: flex;
  justify-content: space-between;
  color: var(--secondary-color);
}

.player1,
.player2 {
  flex: 0 0 auto;
}

.player-profile p {
  text-align: center;
  margin: 4px 0 8px;
}

.player-profile img {
  height: 100px;
  width: 100px;
  border: 2px solid var(--secondary-color);
}

.player-profile.active img {
  border-color: var(--primary-color);
}

.player1 .player-info {
  margin-left: 16px;
}

.player2,
.player2 .player-profile {
  max-width: 100px;
  justify-content: flex-end;
  flex-direction: row-reverse;
}

.action-status {
  flex: 1;
  text-align: center;
  padding: 0 1rem;
  color: #ddd;
}

.action-status p {
  margin-top: 0;
  white-space: pre-line;
}

.roll-history {
  position: absolute;
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  bottom: 0;
}

.player1 .roll-history {
  left: 100%;
  margin-left: 10px;
}

.player2 .roll-history {
  right: 100%;
  margin-right: 10px;
  left: auto;
}

.roll-number {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 2px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid;
  background-color: var(--background-color);
}

.roll-number.reroll-value {
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.player-profile {
  position: relative;
}
</style>
