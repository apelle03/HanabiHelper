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
  constructor(num, color) {
    /** @public @const {number} */ this.num = num;
    /** @public @const {string} */ this.color = color;
  }
}

class Tile {
  constructor(game, player, tileNum) {
    /** @public {!Game} */ this.game = game;
    /** @public {!Player} */ this.player = player;
    /** @public {number} */ this.num = tileNum;

    /** @public {!Array<number>} */ this.numbers = [...this.game.numbers];
    /** @public {!Array<string>} */ this.colors = [...this.game.colors];
    /** @public {boolean */ this.isUsed = false;
    /** @public {boolean */ this.isSelected = false;

    /** @public {!Element} */ this.element = getTemplate("tile");
    this.element.id = "tile-" + tileNum;
    this.element.onclick = () => clickTile(this.player.num, this.num);
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
        marker.querySelector("#text").textContent = number;
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
    this.player.newTile();
  }

  setNumber(number) {
    this.numbers = [number];
    this.element.querySelector("#label").textContent = number;
    this.updateMarkers();
    this.maybeTakeFirework();
  }

  setNotNumber(number) {
    if (this.numbers.includes(number)) {
      this.numbers.splice(this.numbers.indexOf(number), 1);
    }
    this.updateMarkers();
    this.maybeTakeFirework();
  }

  setColor(color) {
    this.colors = [color];
    this.element.classList = "tile";
    this.element.classList.add(tileUpdate.color);
    this.updateMarkers();
    this.maybeTakeFirework();
  }

  setNotColor(color) {
    if (this.colors.includes(color)) {
      this.colors.splice(this.colors.indexOf(color), 1);
    }
    this.updateMarkers();
    this.maybeTakeFirework();
  }

  maybeTakeFirework() {
    if (this.isSpecified()) {
      for (let firework of this.game.pool) {
        if (firework.num === this.numbers[0] && firework.color === this.colors[0]) {
          this.game.pool.splice(this.game.pool.indexOf(firework), 1);
          return;
        }
      }
    }
  }

  filterPool(pool) {
    return pool.filter(firework => this.numbers.includes(firework.num) && this.colors.includes(firework.color));
  }

  static getPossibleNumbers(tiles, pool) {
    tiles.forEach(tile => pool = tile.filterPool(pool));
    return [...new Set(pool.map(firework => firework.num))];
  }

  static getPossibleColors(tiles, pool) {
    tiles.forEach(tile => pool = tile.filterPool(pool));
    return [...new Set(pool.map(firework => firework.color))];
  }
}

class Player {
  constructor(game, playerNum) {
    /** @public {!Game} */ this.game = game;
    /** @public {number} */ this.num = playerNum;
    /** @public {!Array<!Tile>} */ this.tiles = [];

    /** @public {!Element} */ this.element = getTemplate("player");
    this.element.id = "player-" + playerNum;
    this.element.querySelector(".title").textContent = playerNum === 0 ? "you" : "player " + playerNum;

    /** @private {!Element} */ this.handElem = this.element.querySelector(".hand");
    for (let tileNum = 0; tileNum < this.game.handSize; tileNum++) {
      this.newTile();
    }
  }

  newTile() {
    if (this.game.pool.length <= this.game.getUnspecifiedTiles().length) {
      return;
    }
    const tile = new Tile(this.game, this, this.tiles.length);
    this.tiles.push(tile);
    this.handElem.appendChild(tile.element);
  }

  getSelected() {
    return this.tiles.filter(tile => tile.isSelected);
  }

  getCurrentUnselected() {
    return this.getCurrent().filter(tile => !tile.isSelected);
  }

  clearSelected() {
    this.tiles.forEach(tile => tile.setSelected(false));
  }

  getCurrent() {
    return this.tiles.filter(tile => !tile.isUsed);
  }

  getUnspecifiedTiles() {
    return this.tiles.filter(tile => !tile.isSpecified());
  }
}

class Game {
  constructor(playerCount, colorRule) {
    /** @public {number} */ this.playerCount = playerCount;
    /** @public {string} */ this.colorRule = colorRule;

    /** @public {number} */ this.handSize = SETTINGS.playerCount[playerCount].handSize;
    /** @public {!Array<number} */ this.numbers = [1, 2, 3, 4, 5];
    /** @public {!Array<string>} */ this.colors = SETTINGS.colorRule[colorRule].colors;
    /** @public {!Array<!Firework>} */ this.pool = [];
    for (let color of this.colors) {
      for (let number of this.numbers) {
        for (let i = 0; i < SETTINGS.fireworkCount[number]; i++) {
          this.pool.push(new Firework(number, color));
        }
      }
    }

    /** @public {!Array<!Tile>} */ this.players = [];
    const playersElem = document.getElementById("players");
    playersElem.replaceChildren();
    for (let playerNum = 0; playerNum < playerCount; playerNum++) {
      const player = new Player(this, playerNum)
      this.players.push(player);
      playersElem.appendChild(player.element);
    }
  }

  getUnspecifiedTiles() {
    const tiles = [];
    for (let player of this.players) {
      tiles.push(...player.getUnspecifiedTiles());
    }
    return tiles;
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
    for (let tileNum = 1; tileNum <= 5; tileNum++) {
      const tileElem = getTemplate("tile");
      tileElem.querySelector("#label").textContent = tileNum;
      tileElem.classList.add(color);
      tileElem.classList.add("none");
      usedElem.appendChild(tileElem);
    }
  }
}

/** @param {!Set<!Color>} colors */
function populateSettings(colors) {
  const colorsElem = document.querySelector("#tile-settings #colors");
  colorsElem.replaceChildren();
  for (const color of colors) {
    const colorElem = getTemplate("color-chooser");
    colorElem.id = "color-" + color;
    colorElem.textContent = color;
    colorsElem.appendChild(colorElem);
  }
}

function clickHint() {
  openTileSettings(/* player= */ 0, game.players[0].getSelected(), "hint");
  game.players[0].clearSelected();
}

function clickUse() {
  const tile = game.players[0].getSelected()[0]
  tile.setSelected(false);
  if (tile.isSpecified()) {
    tile.use();
  } else {
    openTileSettings(/* player= */ 0, [tile], "use");
  }
}

function updateHintUseButtons() {
  const selectedTiles = game.players[0].getSelected()
  const hintElem = document.querySelector("#give-hint");
  if (selectedTiles.length > 0) {
    hintElem.classList.remove("disabled");
    hintElem.onclick = clickHint;
  } else {
    hintElem.classList.add("disabled");
    hintElem.onclick = null;
  }

  const useElem = document.querySelector("#play-discard");
  if (selectedTiles.length === 1) {
    useElem.classList.remove("disabled");
    useElem.onclick = clickUse;
  } else {
    useElem.classList.add("disabled");
    useElem.onclick = null;
  }
}

/**
 * @param {number} playerNum
 * @param {number} tileNum
 */
function clickTile(playerNum, tileNum) {
  const tile = game.players[playerNum].tiles[tileNum];
  if (playerNum === 0) {
    tile.toggleSelected();
  } else if (tile.isSpecified()) {
    tile.use();
  } else {
    openTileSettings(tile.player.num, [tile]);
  }
}

let tileUpdate = null;

function updateTileChoices() {
  const numbers = Tile.getPossibleNumbers(tileUpdate.tiles, game.pool);
  if (tileUpdate.type !== "hint" && numbers.length === 1 && !("number" in tileUpdate)) {
    setNumber(numbers[0]);
    return;
  }

  const colors = Tile.getPossibleColors(tileUpdate.tiles, game.pool);
  if (tileUpdate.type != "hint" && colors.length === 1 && !("color" in tileUpdate)) {
    setColor(colors[0]);
    return;
  }

  for (let numberChoice of document.querySelectorAll(".number-choice")) {
    const number = getElementNumber(numberChoice);
    numberChoice.classList.toggle("disabled", !numbers.includes(number));
    numberChoice.classList.toggle("selected", numbers.length === 1 && numbers.includes(number));
    numberChoice.onclick = numbers.includes(number)? () => setNumber(number) : null;
  }

  for (let colorChoice of document.querySelectorAll(".color-choice")) {
    const color = getElementQualifier(colorChoice);
    colorChoice.classList.toggle("disabled", !colors.includes(color));
    colorChoice.classList.toggle("selected", colors.length === 1 && colors.includes(color));
    colorChoice.onclick = colors.includes(color)? () => setColor(color) : null;
  }
}

/**
 * @param {number} playerNum
 * @param {!Array<!Tile>} tiles
 * @param {string} updateType
 */
function openTileSettings(playerNum, tiles, updateType) {
  tileUpdate = {
      playerNum: playerNum,
      tiles: tiles,
      type: updateType,
  };
  document.getElementById("tile-settings").classList.add("show");
  updateTileChoices(tiles);
}

function setNumber(number) {
  tileUpdate.number = number;
  for (let tile of tileUpdate.tiles) {
    tile.setNumber(number);
  }
  if (tileUpdate.type === "hint") {
    for (let other of game.players[tileUpdate.playerNum].getCurrentUnselected()) {
      other.setNotNumber(number);
    }
  }
  maybeFinishTileUpdate();
}

function setColor(color) {
  tileUpdate.color = color;
  for (let tile of tileUpdate.tiles) {
    tile.setColor(color);
  }
  if (tileUpdate.type === "hint") {
    for (let other of game.players[tileUpdate.playerNum].getCurrentUnselected()) {
      other.setNotColor(color);
    }
  }
  maybeFinishTileUpdate();
}

function maybeFinishTileUpdate() {
  if (tileUpdate.type === "hint" || ("color" in tileUpdate && "number" in tileUpdate)) {
    finishTileUpdate();
  } else {
    updateTileChoices();
  }
}

function finishTileUpdate() {
  document.getElementById("tile-settings").classList.remove("show");
  game.players[tileUpdate.playerNum].clearSelected();
  if (tileUpdate.type === "use") {
    for (let tile of tileUpdate.tiles) {
      tile.use();
    }
  }
  tileUpdate = null;
}
