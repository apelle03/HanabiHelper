const SETTINGS = {
  playerCount: {
    2: { handSize: 5 },
    3: { handSize: 5 },
    4: { handSize: 4 },
    5: { handSize: 4 },
  },
  colorRule: {
    standard: { colors: ["red", "yellow", "green", "blue", "white"] },
    rainbow: { colors: ["red", "yellow", "green", "blue", "white", "rainbow"] },
  }
};

class Firework {
  constructor(game, player, fireworkNum) {
    /** @public {!Game} */ this.game = game;
    /** @public {!Player} */ this.player = player;
    /** @public {number} */ this.num = fireworkNum;

    /** @public {!Array<number>} */ this.numbers = [...this.game.numbers];
    /** @public {!Array<string>} */ this.colors = [...this.game.colors];
    /** @public {boolean */ this.isUsed = false;
    /** @public {boolean */ this.isSelected = false;
    
    /** @public {!Element} */ this.element = getTemplate("firework");
    this.element.id = "firework-" + fireworkNum;
    this.element.onclick = () => clickFirework(this.player.num, this.num);
    this.updateMarkers();
  }
  
  updateMarkers() {
    if (this.player.num !== 0) {
      return;
    }
    const numbersElem = this.element.querySelector("#numbers");
    numbersElem.replaceChildren();
    if (this.numbers.length > 1) {
      for (let number of this.numbers) {
        const marker = getTemplate("marker");
        marker.textContent = number;
        numbersElem.appendChild(marker);
      }
    }
    
    const colorsElem = this.element.querySelector("#colors");
    colorsElem.replaceChildren();
    if (this.colors.length > 1) {
      for (let color of this.colors) {
        const marker = getTemplate("marker");
        marker.classList.add(color);
        colorsElem.appendChild(marker);
      }
    }
  }

  isSpecified() {
    return this.numbers.length === 1 && this.colors.length === 1;
  }
  
  setSelected(isSelected) {
    this.isSelected = isSelected;
    this.element.classList.toggle("selected", /* force= */ isSelected);
    updateHintUseButtons();
  }

  toggleSelected() {
    this.setSelected(!this.isSelected);
  }
  
  use() {
    this.element.style.display = "none";
    this.isUsed = true;
    this.player.newFirework();
  }
  
  setNumber(number) {
    this.numbers = [number];
    this.element.querySelector("#label").textContent = number;
    this.updateMarkers();
  }
  
  setNotNumber(number) {
    if (this.numbers.includes(number)) {
      this.numbers.splice(this.numbers.indexOf(number), 1);
    }
    this.updateMarkers();
  }
  
  setColor(color) {
    this.colors = [color];
    this.element.classList = "firework";
    this.element.classList.add(fireworkUpdate.color);
    this.updateMarkers();
  }
  
  setNotColor(color) {
    if (this.colors.includes(color)) {
      this.colors.splice(this.colors.indexOf(color), 1);
    }
    this.updateMarkers();
  }
}

class Player {
  constructor(game, playerNum) {
    /** @public {!Game} */ this.game = game;
    /** @public {number} */ this.num = playerNum;
    /** @public {!Array<!Firework>} */ this.fireworks = [];

    /** @public {!Element} */ this.element = getTemplate("player");
    this.element.id = "player-" + playerNum;
    this.element.querySelector(".title").textContent = playerNum === 0 ? "you" : "player " + playerNum;

    /** @private {!Element} */ this.handElem = this.element.querySelector(".hand");
    for (let fireworkNum = 0; fireworkNum < this.game.handSize; fireworkNum++) {
      this.newFirework();
    }
  }
  
  newFirework() {
    const firework = new Firework(this.game, this, this.fireworks.length);
    this.fireworks.push(firework);
    this.handElem.appendChild(firework.element);
    return firework;
  }
  
  getSelected() {
    return this.fireworks.filter(firework => firework.isSelected);
  }
  
  clearSelected() {
    this.fireworks.forEach(firework => firework.setSelected(false));
  }
  
  getCurrent() {
    return this.fireworks.filter(firework => !firework.isUsed);
  }
}

class Game {
  constructor(playerCount, colorRule) {
    /** @public {number} */ this.playerCount = playerCount;
    /** @public {string} */ this.colorRule = colorRule;
    
    /** @public {number} */ this.handSize = SETTINGS.playerCount[playerCount].handSize;
    /** @public {!Array<number} */ this.numbers = [1, 2, 3, 4, 5];
    /** @public {!Array<string>} */ this.colors = SETTINGS.colorRule[colorRule].colors;
  
    /** @public {!Array<!Firework>} */ this.players = [];
    const playersElem = document.getElementById("players");
    playersElem.replaceChildren();
    for (let playerNum = 0; playerNum < playerCount; playerNum++) {
      const player = new Player(this, playerNum)
      this.players.push(player);
      playersElem.appendChild(player.element);
    }
  }
}

/** @type {Game} */
let game = null;

/**
 * @param {string} name
 * @return {!Element}
 */
function getTemplate(name) {
  return document.getElementById(name + "-template").content.cloneNode(true).firstElementChild;
}

/**
 * @param {!Element} element
 * @return {string}
 */
function getElementQualifier(element) {
  return element.id.split("-")[1];
}

/**
 * @param {!Element} element
 * @return {number}
 */
function getElementNumber(element) {
  return parseInt(getElementQualifier(element));
}

function clickNewGame() {
  document.getElementById("game-settings").classList.add("show");
}

function startGame() {
  document.getElementById("game-settings").classList.remove("show");
  const playerCount = getElementNumber(document.querySelector("input[name='pc']:checked"));
  const colorRule = getElementQualifier(document.querySelector("input[name='cr']:checked"));
  game = new Game(playerCount, colorRule);
  populateUsed(game.colors);
  populateSettings(game.colors);
}

/** @param {!Set<!Color>} colors */
function populateUsed(colors) {
  const usedElem = document.getElementById("used");
  usedElem.replaceChildren();
  for (const color of colors) {
    for (let fireworkNum = 1; fireworkNum <= 5; fireworkNum++) {
      const fireworkElem = getTemplate("firework");
      fireworkElem.querySelector("#label").textContent = fireworkNum;
      fireworkElem.classList.add(color);
      fireworkElem.classList.add("none");
      usedElem.appendChild(fireworkElem);
    }
  }
}

/** @param {!Set<!Color>} colors */
function populateSettings(colors) {
  const colorsElem = document.querySelector("#firework-settings #colors");
  colorsElem.replaceChildren();
  for (const color of colors) {
    const colorElem = getTemplate("color-chooser");
    colorElem.id = "color-" + color;
    colorElem.textContent = color;
    colorsElem.appendChild(colorElem);
  }
}

function clickHint() {
  openFireworkSettings(game.players[0].getSelected(), "hint");
  game.players[0].clearSelected();
}

function clickUse() {
  const firework = game.players[0].getSelected()[0]
  firework.setSelected(false);
  if (firework.isSpecified()) {
    firework.use();
  } else {
    openFireworkSettings([firework], "use");
  }
}

function updateHintUseButtons() {
  const selectedFireworks = game.players[0].getSelected()
  const hintElem = document.querySelector("#give-hint");
  if (selectedFireworks.length > 0) {
    hintElem.classList.remove("disabled");
    hintElem.onclick = clickHint;
  } else {
    hintElem.classList.add("disabled");
    hintElem.onclick = null;
  }
  
  const useElem = document.querySelector("#play-discard");
  if (selectedFireworks.length === 1) {
    useElem.classList.remove("disabled");
    useElem.onclick = clickUse;
  } else {
    useElem.classList.add("disabled");
    useElem.onclick = null;
  }
}

/**
 * @param {number} playerNum
 * @param {number} fireworkNum
 */
function clickFirework(playerNum, fireworkNum) {
  const firework = game.players[playerNum].fireworks[fireworkNum];
  if (playerNum === 0) {
    firework.toggleSelected();
  } else if (firework.isSpecified()) {
    firework.use();
  } else {
    openFireworkSettings([firework]);
  }
}

let fireworkUpdate = null;

/**
 * @param {!Array<!Firework>} fireworks
 * @param {string} updateType
 */
function openFireworkSettings(fireworks, updateType) {
  document.getElementById("firework-settings").classList.add("show");
  fireworkUpdate = {
      fireworks: fireworks,
      type: updateType,
  };
  const numbers = fireworks.reduce((numbers, firework) =>
      numbers.filter(num => firework.numbers.includes(num)), game.numbers);
  for (let numberChoice of document.querySelectorAll(".number-choice")) {
    const number = getElementNumber(numberChoice);
    numberChoice.classList.toggle("disabled", !numbers.includes(number));
    numberChoice.onclick = numbers.includes(number)? () => setNumber(number) : null;
    if (numbers.length === 1 && number === numbers[0]) {
      numberChoice.classList.add("selected");
    }
  }
  
  const colors = fireworks.reduce((colors, firework) =>
      colors.filter(color => firework.colors.includes(color)), game.colors);
  for (let colorChoice of document.querySelectorAll(".color-choice")) {
    const color = getElementQualifier(colorChoice);
    colorChoice.classList.toggle("disabled", !colors.includes(color));
    colorChoice.onclick = colors.includes(color)? () => setColor(color) : null;
    if (colors.length === 1 && color === colors[0]) {
      colorChoice.classList.add("selected");
    }
  }
}

function setNumber(number) {
  document.querySelectorAll("#firework-settings .number-choice").forEach(item => item.classList.remove("selected"));
  document.querySelector(`#number-${number}`).classList.add("selected");

  fireworkUpdate.number = number;
  if (fireworkUpdate.type === "hint"|| "color" in fireworkUpdate) {
    applyFireworkUpdate(fireworkUpdate.type === "hint");
  }
}

function setColor(color) {
  document.querySelectorAll("#firework-settings .color-choice").forEach(item => item.classList.remove("selected"));
  document.querySelector(`#color-${color}`).classList.add("selected");

  fireworkUpdate.color = color;
  if (fireworkUpdate.type === "hint" || "number" in fireworkUpdate) {
    applyFireworkUpdate(fireworkUpdate.type === "hint");
  }
}

function applyFireworkUpdate(isHint) {
  document.getElementById("firework-settings").classList.remove("show");
  document.querySelectorAll("#firework-settings .number-choice").forEach(item => item.classList.remove("selected"));
  document.querySelectorAll("#firework-settings .color-choice").forEach(item => item.classList.remove("selected"));

  for (let firework of fireworkUpdate.fireworks) {
    if ("number" in fireworkUpdate) {
      firework.setNumber(fireworkUpdate.number);
      if (isHint) {
        for (let other of firework.player.getCurrent().filter(f => !fireworkUpdate.fireworks.includes(f))) {
          other.setNotNumber(fireworkUpdate.number);
        }
      }
    }
    if ("color" in fireworkUpdate) {
      firework.setColor(fireworkUpdate.color);
      if (isHint) {
        for (let other of firework.player.getCurrent().filter(f => !fireworkUpdate.fireworks.includes(f))) {
          other.setNotColor(fireworkUpdate.color);
        }
      }
    }
  }
  if (fireworkUpdate.type === "use") {
    for (let firework of fireworkUpdate.fireworks) {
      firework.use();
    }
  }
  fireworkUpdate = null;
}
