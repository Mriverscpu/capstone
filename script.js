console.log("Hello, world!");
// For simplicity in the prototype, we'll exclude wild cards to focus on standard matching logic.
const colors = ["red", "blue", "green", "yellow"];
const values = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+2"];

let deck = []; // The main deck of cards to draw from
let playerHand = []; // Cards currently in the player's hand
let discardPile = []; // Cards that have been played
let pendingWildCardIndex = -1; // Tracks which wild card the user clicked
let opponentHand = []; // <-- NEW: Opponent's hand
let isPlayerTurn = true; // Tracks whose turn it is

// 1. Build and Shuffle the Deck (Updated)
function initializeGame() {
  deck = [];
  colors.forEach((color) => {
    values.forEach((value) => {
      deck.push({ color, value });
      if (value !== "0") deck.push({ color, value });
    });
  });

  // Inject 4 Wild and 4 Wild+4 cards
  for (let i = 0; i < 4; i++) {
    deck.push({ color: "wild", value: "Wild" });
    deck.push({ color: "wild", value: "Wild+4" });
  }

  shuffle(deck);

  // Deal 7 cards to both
  playerHand = deck.splice(0, 7);
  opponentHand = deck.splice(0, 7); // <-- NEW

  // Ensure the first discard card is a basic number (not an action or wild)
  let firstCard = deck.find((c) => !isNaN(c.value));
  deck.splice(deck.indexOf(firstCard), 1);
  discardPile.push(firstCard);

  updateUI();
}

// 2. Fisher-Yates Shuffle Algorithm
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// 3. Validate and Play a Card
function playCard(index) {
  if (!isPlayerTurn) return;

  const cardToPlay = playerHand[index];
  const topCard = discardPile[discardPile.length - 1];

  // Intercept Wild Cards to open the color chooser modal
  if (cardToPlay.value.includes("Wild")) {
    pendingWildCardIndex = index;
    document.getElementById("color-modal").style.display = "block";
    return;
  }

  // Standard Validation
  if (
    cardToPlay.color === topCard.color ||
    cardToPlay.value === topCard.value
  ) {
    executePlay(index, cardToPlay);
  } else {
    alert("Invalid move! Card must match color or value.");
  }
}

// 4. Player Wild Color Selection
function setWildColor(newColor) {
  const cardToPlay = playerHand[pendingWildCardIndex];
  cardToPlay.color = newColor;

  document.getElementById("color-modal").style.display = "none";
  executePlay(pendingWildCardIndex, cardToPlay);
  pendingWildCardIndex = -1;
}

// 5. Execution & Penalty Logic
function executePlay(index, card) {
  playerHand.splice(index, 1);
  discardPile.push(card);
  updateUI();

  if (playerHand.length === 0) {
    setTimeout(() => handleWin("You"), 10);
    return;
  }

  let skipOpponent = false;
  if (card.value === "+2") {
    forceDraw(opponentHand, 2);
    skipOpponent = true;
  } else if (card.value === "Wild+4") {
    forceDraw(opponentHand, 4);
    skipOpponent = true;
  }

  if (skipOpponent) {
    updateUI();
    // Give browser time to update UI before freezing with alert
    setTimeout(
      () =>
        alert(
          `You played a ${card.value}! Opponent draws and loses their turn.`,
        ),
      50,
    );
    isPlayerTurn = true; // Player keeps their turn
  } else {
    isPlayerTurn = false;
    setTimeout(opponentTurn, 1000);
  }
}

// 6. Draw a Card
function drawCard() {
  if (!isPlayerTurn) return;

  // Check and trigger reshuffle if needed
  if (deck.length === 0) reshuffleDeck();

  if (deck.length > 0) {
    playerHand.push(deck.pop());
    updateUI();

    isPlayerTurn = false;
    setTimeout(opponentTurn, 1500);
  } else {
    alert("The game is entirely out of cards!");
  }
}

// 7. Force Draw for Penalties (used by both player and opponent)
function forceDraw(targetHand, amount) {
  for (let i = 0; i < amount; i++) {
    // Check and trigger reshuffle mid-loop if necessary
    if (deck.length === 0) reshuffleDeck();

    if (deck.length > 0) {
      targetHand.push(deck.pop());
    } else {
      console.log("Out of cards to draw mid-penalty!");
      break;
    }
  }
}

// 8. Render the Board
function updateUI() {
  document.getElementById("deck-count").innerText = deck.length;

  // Render Discard Pile
  const topCard = discardPile[discardPile.length - 1];
  const discardDiv = document.getElementById("discard-pile");
  discardDiv.className = `uno-card d-flex align-items-center justify-content-center mx-auto card-${topCard.color}`;

  let topFontSize = topCard.value.length > 3 ? "1.5rem" : "2.5rem";
  discardDiv.innerHTML = `<h3 style="font-size: ${topFontSize}; margin: 0; text-align: center;">${topCard.value}</h3>`;

  // Render Player Hand
  const handDiv = document.getElementById("player-hand");
  handDiv.innerHTML = "";

  playerHand.forEach((card, index) => {
    const cardEl = document.createElement("div");
    cardEl.className = `uno-card d-flex align-items-center justify-content-center card-${card.color}`;

    let fontSize = card.value.length > 3 ? "1.5rem" : "2.5rem";
    cardEl.innerHTML = `<h2 style="font-size: ${fontSize}; margin: 0; text-align: center;">${card.value}</h2>`;

    cardEl.onclick = () => playCard(index);
    handDiv.appendChild(cardEl);
  });

  console.log(`Opponent currently has ${opponentHand.length} cards.`);
}

// 9. Deck Management
function reshuffleDeck() {
  // Prevent reshuffling if the discard pile is basically empty
  if (discardPile.length <= 1) {
    console.log("Not enough cards to reshuffle!");
    return;
  }

  // Save the top card of the discard pile
  const topCard = discardPile.pop();

  // Move all remaining discard cards back into the deck
  deck = [...discardPile];

  // Reset the discard pile to only hold that top card
  discardPile = [topCard];

  // Shuffle the newly populated deck
  shuffle(deck);
  console.log("Deck successfully reshuffled!");
}

// 10. Opponent Turn Logic
function opponentTurn() {
  const topCard = discardPile[discardPile.length - 1];
  const validCards = opponentHand.filter(
    (card) =>
      card.color === topCard.color ||
      card.value === topCard.value ||
      card.value.includes("Wild"), // Updated validation
  );

  if (validCards.length > 0) {
    const cardToPlay = validCards[0];
    const handIndex = opponentHand.indexOf(cardToPlay);

    if (cardToPlay.value.includes("Wild")) {
      const wildColors = ["red", "blue", "green", "yellow"];
      cardToPlay.color =
        wildColors[Math.floor(Math.random() * wildColors.length)];
    }

    opponentHand.splice(handIndex, 1);
    discardPile.push(cardToPlay);
    updateUI();

    // Delay attack logic so UI paints the played card first
    setTimeout(() => {
      let skippedPlayer = false;

      if (cardToPlay.value === "+2") {
        forceDraw(playerHand, 2);
        skippedPlayer = true;
      } else if (cardToPlay.value === "Wild+4") {
        forceDraw(playerHand, 4);
        skippedPlayer = true;
      }

      if (skippedPlayer) {
        updateUI();
        setTimeout(() => {
          let colorChoice =
            cardToPlay.value === "Wild+4"
              ? ` and chose ${cardToPlay.color.toUpperCase()}`
              : "";
          alert(
            `Opponent played a ${cardToPlay.value}${colorChoice}! You draw penalty cards and lose your turn.`,
          );
          setTimeout(opponentTurn, 1000);
        }, 50);
      } else {
        // NEW: Alert for a regular Wild card
        if (cardToPlay.value === "Wild") {
          alert(
            `Opponent played a Wild card and changed the color to ${cardToPlay.color.toUpperCase()}!`,
          );
        }

        if (opponentHand.length === 0) {
          setTimeout(() => handleWin("Opponent"), 50);
          return;
        }
        isPlayerTurn = true;
      }
    }, 500);
  } else {
    if (deck.length === 0) reshuffleDeck();

    if (deck.length > 0) {
      opponentHand.push(deck.pop());
      updateUI();
    }
    isPlayerTurn = true;
  }
}

// 11. Game Over Handling
function handleWin(winner) {
  const playAgain = confirm(
    `UNO! ${winner} wins!\n\nWould you like to play another round?`,
  );

  if (playAgain) {
    // Explicitly unlock the player's controls for the new game
    isPlayerTurn = true;
    pendingWildCardIndex = -1;
    initializeGame();
  } else {
    // Lock controls and clear the board if done playing
    isPlayerTurn = false;
    document.getElementById("player-hand").innerHTML =
      `<h3 class="text-center w-100 mt-4">Game Over. Thanks for playing!</h3>`;
    document.getElementById("discard-pile").innerHTML = "<h2>UNO</h2>";
    document.getElementById("discard-pile").className =
      "uno-card card-back d-flex align-items-center justify-content-center mx-auto";
    
  }
}

// Start game on load
window.onload = initializeGame;
