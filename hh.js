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
  },
  fireworkCount: {
    1: 3,
    2: 2,
    3: 2,
    4: 2,
    5: 1,
  }
};

function arrayEquals(a, b) {
  return Array.isArray(a)
      && Array.isArray(b)
      && a.length === b.length
      && a.every((val, index) => val === b[index]);
}

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
    /** @private {?Firework} */ this.firework = null;

    /** @public {!Element} */ this.element = getTemplate("tile");
    this.element.id = "tile-" + tileNum;
    this.element.onclick = () => clickTile(this.player.num, this.num);
    this.update();
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
    if (this.numbers.length !== 1 || this.numbers[0] !== number) {
      this.numbers = [number];
      return this.update();
    }
    return false;
  }

  setNotNumber(number) {
    if (this.numbers.includes(number)) {
      this.numbers.splice(this.numbers.indexOf(number), 1);
      return this.update();
    }
    return false;
  }

  setColor(color) {
    if (this.colors.length !== 1 || this.colors[0] !== color) {
      this.colors = [color];
      return this.update();
    }
    return false;
  }

  setNotColor(color) {
    if (this.colors.includes(color)) {
      this.colors.splice(this.colors.indexOf(color), 1);
      return this.update();
    }
    return false;
  }

  update() {
    this.updatePossibilities();
    if (this.player.num === 0) {
      this.updateMarkers();
    }
    if (this.numbers.length === 1) {
      this.element.querySelector("#label").textContent = this.numbers[0];
    }
    if (this.colors.length === 1) {
      this.element.classList = "tile";
      this.element.classList.add(this.colors[0]);
    }
    return this.maybeTakeFirework();
  }

  /** @private */
  updatePossibilities() {
    this.numbers = this.getPossibleNumbers();
    this.colors = this.getPossibleColors();
  }

  /** @private */
  updateMarkers() {
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

  /** @private */
  maybeTakeFirework() {
    if (this.isSpecified() && this.firework === null) {
      for (let firework of this.game.pool) {
        if (firework.num === this.numbers[0] && firework.color === this.colors[0]) {
          this.firework = this.game.pool.splice(this.game.pool.indexOf(firework), 1)[0];
          return true;
        }
      }
    }
    return false;
  }

  /** @private */
  filterPool(pool) {
    return pool.filter(firework => this.numbers.includes(firework.num) && this.colors.includes(firework.color));
  }

  getPossibleNumbers() {
    const poolNumbers = this.filterPool(this.game.pool).map(firework => firework.num);
    return this.game.numbers.filter(number => poolNumbers.includes(number));
  }

  getPossibleColors() {
    const poolColors = this.filterPool(this.game.pool).map(firework => firework.color);
    return this.game.colors.filter(color => poolColors.includes(color));
  }

  static getCommonNumbers(tiles) {
    return tiles.reduce(
      (numbers, tile) => numbers.filter(number => tile.numbers.includes(number)),
      tiles[0].numbers);
  }

  static getCommonColors(tiles) {
    return tiles.reduce(
        (colors, tile) => colors.filter(color => tile.colors.includes(color)),
        tiles[0].colors);
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
    this.game.tiles.push(tile);
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
    /** @public {!Array<!Tile>} */ this.tiles = [];
    const playersElem = document.getElementById("players");
    playersElem.replaceChildren();
    for (let playerNum = 0; playerNum < playerCount; playerNum++) {
      const player = new Player(this, playerNum)
      this.players.push(player);
      playersElem.appendChild(player.element);
    }

    const usedElem = document.getElementById("used");
    usedElem.replaceChildren();
    for (const color of this.colors) {
      for (let tileNum = 1; tileNum <= 5; tileNum++) {
        const tileElem = getTemplate("tile");
        tileElem.id = `${tileNum}-${color}`;
        tileElem.querySelector("#label").textContent = tileNum;
        tileElem.classList.add(color);
        tileElem.classList.add("none");
        usedElem.appendChild(tileElem);
      }
    }

    const colorsElem = document.querySelector("#tile-settings #colors");
    colorsElem.replaceChildren();
    for (const color of this.colors) {
      const colorElem = getTemplate("color-chooser");
      colorElem.id = "color-" + color;
      colorElem.textContent = color;
      colorsElem.appendChild(colorElem);
    }
  }

  getUnspecifiedTiles() {
    return this.tiles.filter(tile => !tile.isSpecified());
  }

  updateUnspecifiedTiles() {
    let poolChanged = false;
    for (let tile of this.getUnspecifiedTiles()) {
      poolChanged = tile.update() || poolChanged;
    }
    return poolChanged;
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
}

function clickHint() {
  const player = game.players[0];
  openTileSettings("hint", player.getSelected(), player.getCurrentUnselected());
  player.clearSelected();
}

function clickUse() {
  const tile = game.players[0].getSelected()[0]
  tile.setSelected(false);
  if (tile.isSpecified()) {
    tile.use();
  } else {
    openTileSettings("use", [tile]);
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
    openTileSettings("full", [tile]);
  }
}

let tileUpdate = null;

function updateTileChoices() {
  const numbers = Tile.getCommonNumbers(tileUpdate.tiles);
  const colors = Tile.getCommonColors(tileUpdate.tiles);

  for (let numberChoice of document.querySelectorAll(".number-choice")) {
    const number = getElementNumber(numberChoice);
    const isSelected = tileUpdate.type !== "hint" && numbers.length === 1 && numbers.includes(number);
    numberChoice.classList.toggle("disabled", !numbers.includes(number));
    numberChoice.classList.toggle("selected", isSelected);
    numberChoice.onclick = numbers.includes(number) && !isSelected
        ? () => setNumber(number) : null;
  }

  for (let colorChoice of document.querySelectorAll(".color-choice")) {
    const color = getElementQualifier(colorChoice);
    const isSelected = tileUpdate.type !== "hint" && colors.length === 1 && colors.includes(color);
    colorChoice.classList.toggle("disabled", !colors.includes(color));
    colorChoice.classList.toggle("selected",
        tileUpdate.type !== "hint" && colors.length === 1 && colors.includes(color));
    colorChoice.onclick = colors.includes(color) && !isSelected
        ? () => setColor(color) : null;
  }
}

/**
 * @param {string} updateType
 * @param {!Array<!Tile>} tiles
 * @param {?Array<!Tile>} nonHintTiles
 */
function openTileSettings(updateType, tiles, nonHintTiles) {
  tileUpdate = {
      type: updateType,
      tiles: tiles,
      nonHintTiles: nonHintTiles,
  };
  document.getElementById("tile-settings").classList.add("show");
  updateTileChoices();
}

function setNumber(number) {
  let poolChanged = false;
  for (let tile of tileUpdate.tiles) {
    poolChanged = tile.setNumber(number) || poolChanged;
  }
  if (tileUpdate.type === "hint") {
    for (let other of tileUpdate.nonHintTiles) {
      poolChanged = other.setNotNumber(number) || poolChanged;
    }
  }
  maybeFinishTileUpdate(poolChanged);
}

function setColor(color) {
  let poolChanged = false;
  for (let tile of tileUpdate.tiles) {
    poolChanged = tile.setColor(color) || poolChanged;
  }
  if (tileUpdate.type === "hint") {
    for (let other of tileUpdate.nonHintTiles) {
      poolChanged = other.setNotColor(color) || poolChanged;
    }
  }
  maybeFinishTileUpdate(poolChanged);
}

function maybeFinishTileUpdate(poolChanged) {
  if (tileUpdate.type === "hint" || tileUpdate.tiles[0].isSpecified()) {
    finishTileUpdate(poolChanged);
  } else {
    updateTileChoices();
  }
}

function finishTileUpdate(poolChanged) {
  document.getElementById("tile-settings").classList.remove("show");
  if (tileUpdate.type === "use") {
    for (let tile of tileUpdate.tiles) {
      tile.use();
    }
  }
  tileUpdate = null;
  while (poolChanged) {
    poolChanged = game.updateUnspecifiedTiles();
  }
}
