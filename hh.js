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

class Firework {
  constructor(num, color) {
    /** @public @const {number} */ this.num = num;
    /** @public @const {string} */ this.color = color;
  }
}

class Tile {
  constructor(game, player, showMarkers) {
    /** @private @const {!Game} */ this.game = game;
    /** @private @const {!Player} */ this.player = player;
    /** @private @const {boolean} */ this.showMarkers = showMarkers;

    /** @public @readonly {!Array<number>} */ this.numbers = [...game.numbers];
    /** @public @readonly {!Array<string>} */ this.colors = [...game.colors];
    /** @public @readonly {boolean */ this.isUsed = false;
    /** @public @readonly {boolean */ this.isSelected = false;
    /** @public @const {!Element} */ this.element = getTemplate("tile");

    /** @private {?Firework} */ this.firework = null;
    this.updateUi();
  }

  update() {
    this.numbers = this.getPossibleNumbers();
    this.colors = this.getPossibleColors();
    const poolChanged = this.maybeTakeFirework();
    this.updateUi();
    return poolChanged;
  }

  /** @private */
  getPossibleNumbers() {
    const poolNumbers = this.filterPool(this.game.pool).map(firework => firework.num);
    return this.game.numbers.filter(number => poolNumbers.includes(number));
  }

  /** @private */
  getPossibleColors() {
    const poolColors = this.filterPool(this.game.pool).map(firework => firework.color);
    return this.game.colors.filter(color => poolColors.includes(color));
  }

  /** @private */
  filterPool(pool) {
    return pool.filter(firework => this.numbers.includes(firework.num) && this.colors.includes(firework.color));
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

  updateUi() {
    this.element.querySelector("#label").textContent =
        this.numbers.length === 1 ? this.numbers[0] : "#";
    this.element.classList = "tile";
    if (this.colors.length === 1) {
      this.element.classList.add(this.colors[0]);
    }
    this.element.classList.toggle("hidden", /* force= */ this.isUsed);
    this.element.classList.toggle("selected", /* force= */ this.isSelected);
    this.updateMarkers();
  }

  /** @private */
  updateMarkers() {
    const numbersElem = this.element.querySelector("#numbers");
    const colorsElem = this.element.querySelector("#colors");

    numbersElem.replaceChildren();
    colorsElem.replaceChildren();
    if (!this.showMarkers) {
      return;
    }

    if (this.numbers.length > 1) {
      for (let number of this.numbers) {
        const marker = getTemplate("marker");
        marker.querySelector("#text").textContent = number;
        numbersElem.appendChild(marker);
      }
    }

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
    this.updateUi();
    updateHintUseButtons();
  }

  toggleSelected() {
    this.setSelected(!this.isSelected);
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

  use() {
    this.isUsed = true;
    this.updateUi();
    this.player.newTile();
    this.game.use(this.firework);
  }
}

class Player {
  constructor(game, playerNum, insertOnRight) {
    /** @private @const {!Game} */ this.game = game;
    /** @private @const {number} */ this.num = playerNum;
    /** @private @const {boolean} */ this.insertOnRight = insertOnRight;
    /** @public @readonly {!Array<!Tile>} */ this.tiles = [];

    /** @private @const {!Element} */ this.element = getTemplate("player");
    this.element.querySelector(".title").textContent = playerNum === 0 ? "you" : "player " + playerNum;

    /** @private @const {!Element} */ this.handElem = this.element.querySelector(".hand");
    for (let tileNum = 0; tileNum < this.game.handSize; tileNum++) {
      this.newTile();
    }
  }

  newTile() {
    if (this.game.pool.length <= this.game.getUnspecifiedTiles().length) {
      return;
    }
    const tile = new Tile(this.game, this, this.num === 0);
    const tileNum = this.tiles.length;
    tile.element.onclick = () => clickTile(this.num, tileNum);
    this.tiles.push(tile);
    this.game.tiles.push(tile);

    // Flip insertion side for other players to account for physical rotation.
    if ((this.num === 0) == this.insertOnRight) {
      this.handElem.appendChild(tile.element);
    } else {
      this.handElem.insertBefore(tile.element, this.handElem.firstChild);
    }
    return tile;
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

  restore(player) {
    this.tiles = [];
    this.handElem.replaceChildren();
    for (let tile of player.tiles) {
      const newTile = this.newTile();
      newTile.numbers = [...tile.numbers];
      newTile.colors = [...tile.colors];
      newTile.isUsed = tile.isUsed;
      newTile.firework = tile.firework;
      newTile.updateUi();
    }
  }
}

class Game {
  constructor(playerCount, colorRule, discardSide) {
    /** @public {number} */ this.playerCount = playerCount;
    /** @public {string} */ this.colorRule = colorRule;
    /** @public {string} */ this.insertOnRight = discardSide === "left";

    /** @public {number} */ this.handSize = SETTINGS.playerCount[playerCount].handSize;
    /** @public {!Array<number} */ this.numbers = [1, 2, 3, 4, 5];
    /** @public {!Array<string>} */ this.colors = SETTINGS.colorRule[colorRule].colors;
    /** @public {!Array<!Firework>} */ this.pool = [];
    /** @public {!Map<string, !Array<number>>} */ this.used = {};
    for (let color of this.colors) {
      this.used[color] = [];
      for (let number of this.numbers) {
        this.used[color][number] = 0;
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
      const player = new Player(this, playerNum, this.insertOnRight);
      this.players.push(player);
      playersElem.appendChild(player.element);
    }

    const usedElem = document.getElementById("used");
    usedElem.replaceChildren();
    for (const color of this.colors) {
      for (let tileNum = 1; tileNum <= 5; tileNum++) {
        const tileElem = getTemplate("tile");
        tileElem.id = `${color}-${tileNum}`;
        tileElem.querySelector("#label").textContent = tileNum;
        tileElem.classList.add(color);
        tileElem.classList.add("used-0");
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
    /** @private {!Array<Object>} */ this.undoStack = [];
    this.snapshot();
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

  use(firework) {
    this.used[firework.color][firework.num]++
    this.updateUsedMarker(firework.color, firework.num);
  }

  updateUsedMarker(color, number) {
    const percentUsed = this.used[color][number] / SETTINGS.fireworkCount[number];
    const usedClass = `used-${(percentUsed * 100).toFixed()}`;
    const usedElem = document.querySelector(`#used #${color}-${number}`);
    usedElem.classList = `tile ${color} ${usedClass}`;
  }

  updateUsedMarkers() {
    for (let color of this.colors) {
      for (let number of this.numbers) {
        this.updateUsedMarker(color, number);
      }
    }
  }

  undo() {
    if (this.undoStack.length < 2) {
      return;
    }
    // Throw out current state.
    this.undoStack.pop();
    // Load previous state and keep it on the stack.
    const state = this.undoStack[this.undoStack.length - 1];
    this.tiles = [];
    this.pool = [...state.pool];
    this.used = JSON.parse(JSON.stringify(state.used));
    this.updateUsedMarkers();
    for (let playerNum = 0; playerNum < this.playerCount; playerNum++) {
      this.players[playerNum].restore(state.players[playerNum]);
    }
  }

  snapshot() {
    const state = {
      pool: [...this.pool],
      used: JSON.parse(JSON.stringify(this.used)),
      players: this.players.map(player => ({
          tiles: player.tiles.map(tile => ({
              numbers: [...tile.numbers],
              colors: [...tile.colors],
              isUsed: tile.isUsed,
              firework: tile.firework,
          }))
      })),
    };
    this.undoStack.push(state);
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
  const discardSide = getElementQualifier(document.querySelector("input[name='ds']:checked"));
  game = new Game(playerCount, colorRule, discardSide);
}

function clickHint() {
  const player = game.players[0];
  openTileSettings("hint", player.getSelected(), player.getCurrentUnselected());
  player.clearSelected();
}

function clickUse() {
  const tile = game.players[0].getSelected()[0]
  tile.setSelected(false);
  openTileSettings("use", [tile]);
}

function clickUndo() {
  if (game) {
    game.undo();
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
  } else  {
    openTileSettings(tile.isSpecified() ? "use" : "full", [tile]);
  }
}

let tileUpdate = null;

function updateTileChoices() {
  const numbers = tileUpdate.tiles.reduce(
      (numbers, tile) => numbers.filter(number => tile.numbers.includes(number)),
      tileUpdate.tiles[0].numbers);
  for (let numberChoice of document.querySelectorAll(".number-choice")) {
    const number = getElementNumber(numberChoice);
    const isSelected = tileUpdate.type !== "hint" && numbers.length === 1 && numbers.includes(number);
    numberChoice.classList.toggle("disabled", !numbers.includes(number));
    numberChoice.classList.toggle("selected", isSelected);
    numberChoice.onclick = numbers.includes(number) && !isSelected
        ? () => setNumber(number) : null;
  }

  const colors = tileUpdate.tiles.reduce(
        (colors, tile) => colors.filter(color => tile.colors.includes(color)),
        tileUpdate.tiles[0].colors);
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
  if (updateType === "use") {
    maybeFinishTileUpdate(/* poolChanged= */ false);
  } else {
    updateTileChoices();
  }
}

function cancelTileSettings() {
  document.getElementById("tile-settings").classList.remove("show");
  tileUUpdate = null;
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
  game.snapshot();
}
