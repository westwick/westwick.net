<template>
  <div class="rules">
    <p>
      Senet is an ancient egyptian game played by pharaohs and may be up to 5000
      years old making it the oldest known board game in the world.
    </p>
    <p>
      Get your pieces to the end of the board before your opponent. If you land
      on a space occupied by an opponent, capture it by exchanging their places.
    </p>
    <p>
      Rolls are 1 through 5. If you roll a 1, 4, or 5 you can roll again. If you
      can make a valid move you must, and if you cannot make any valid moves
      your turn ends.
    </p>
    <p>
      Two pieces of the same color next to each other
      <strong>in the same row</strong> are safe and may not be captured.
    </p>
    <p>
      Three pieces of the same color all next to each other
      <strong>in the same row</strong> are a blockade and may not be captured or
      jumped over.
    </p>
    <p>
      Squares 15, 26, 28 and 29 are safe spaces and may not be captured at any
      time. You can only exit 28 and 29 with an exact roll.
    </p>
    <p>You cannot proceed past square 26 without stopping on it first.</p>
    <p>If you land on square 27 you must return to square 15 instead.</p>
  </div>
</template>

<style scoped>
.rules {
  max-width: 480px;
  margin-top: 20px;
  text-align: left;
  color: var(--secondary-color);
  max-height: 100px;
  overflow-y: auto;
}
</style>
