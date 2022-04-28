import { Tile } from '/tile.js';
import { Board } from '/board.js';
import { Player } from '/player.js';

const storyBtn = document.querySelector("#story");
const storyDiv = document.querySelector("#story-text");
const rulesBtn = document.querySelector("#rules");
const rulesDiv = document.querySelector("#rules-text");
const startBtn = document.querySelector("#start");
const playerInput = document.querySelector("#player-count");
const treasureInput = document.querySelector("#treasure-count");
const controlsDiv = document.querySelector("#controls");
const fieldDiv = document.querySelector("#field");
const playerCards = document.querySelectorAll('.card');
const cardArray = Array.from(playerCards);
const whosTurn = document.querySelector('#whosturn');
const newGameBtn = document.querySelector('#newgame');
const saveGameBtn = document.querySelector('#savegame');
const loadGameBtn = document.querySelector('#loadgame');
const controlHelp = document.querySelector('#controlHelp');

const MAXTREASURES = 24;

const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');

let board;
let currentPlayer;
let playerCount;
let treasureCount;
let hasMovedExtraTile = false;
let gameState;
let loaded = false;
let firstRound;

if (localStorage.getItem('katakomba')) {
  loadGameBtn.hidden = false;
}

const GameStates = {
  INGAME: 1,
  END: 2
}

function initGame() {
  controlsDiv.hidden = true;
  fieldDiv.hidden = false;
  saveGameBtn.hidden = false;
  gameState = GameStates.INGAME;
  firstRound = true;

  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('contextmenu', onRightClick);
  canvas.addEventListener('click', onLeftClick);

  if (!loaded) {
    playerCount = parseInt(playerInput.value);
    treasureCount = parseInt(treasureInput.value);
    board = new Board(playerCount, treasureCount);
    board.drawFixedBoard(context);
    board.fillWithRandomTiles();
    board.addTreasures();
    board.addPlayers();
  }
  board.renderState(context);

  //show cards
  for (let i = 0; i < playerCount; i++) {
    cardArray[i].hidden = false;
  }

  if (!loaded) {
    step();
  }
}



function step() {
  board.renderState(context);
  if (currentPlayer) {
    cardArray[currentPlayer.ID].classList.remove('currentplayer');
    firstRound = false;
    controlHelp.hidden = true;
  }

  let scores = board.getPlayerScores();
  updateCardScores(scores);
  let currentTreasures = board.getCurrentTreasures();
  updateCardTreasure(currentTreasures);

  if (board.getWinner()) {
    gameState = GameStates.END;
  }
  if (gameState !== GameStates.END) {
    hasMovedExtraTile = false;
    board.hasMovedExtraTile = false;
    currentPlayer = board.getNextPlayer();
    cardArray[currentPlayer.ID].classList.add('currentplayer');
    whosTurn.innerHTML = `${currentPlayer.ID + 1}. játékos ${firstRound ? ' kezd' : ' következik'}`;
    saveGameBtn.disabled = false;
  } else {
    whosTurn.innerHTML = 'Vége';
    newGameBtn.hidden = false;
    saveGameBtn.hidden = true;
    cardArray[currentPlayer.ID].classList.add('winner');
    context.font = "50px Amaranth";
    context.fillStyle = "white";
    context.strokeStyle = "black";
    context.fillText(`${currentPlayer.ID + 1}. játékos nyert!`, 150, canvas.height / 2);
    context.strokeText(`${currentPlayer.ID + 1}. játékos nyert!`, 150, canvas.height / 2);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('contextmenu', onRightClick);
    canvas.removeEventListener('click', onLeftClick);
  }
}

function updateCardScores(scores) {
  scores.forEach((score, i) => {
    cardArray[i].querySelector('.points').innerHTML = `${score}/${treasureCount}`;
  })
}

function updateCardTreasure(currentTreasures) {
  currentTreasures.forEach((treasure, i) => {
    cardArray[i].querySelector('.treasure').innerHTML = treasure;
  })
}

// Event listeners

// move extra tile over arrow
function onMouseMove(e) {
  if (!hasMovedExtraTile && board.isMouseOnArrowTile(e.offsetX, e.offsetY)) {
    board.moveExtraTileToArrowTile(e.offsetX, e.offsetY);
    board.renderState(context);
  }
}

// rotate extra tile
function onRightClick(e) {
  e.preventDefault();
  if (!hasMovedExtraTile && board.isMouseOnArrowTile(e.offsetX, e.offsetY)) {
    board.rotateExtraTile(context);
    board.renderState(context);
  }
}

// slide extra tile into the row
function onLeftClick(e) {
  if (!hasMovedExtraTile && board.isMouseOnArrowTile(e.offsetX, e.offsetY)) {
    saveGameBtn.disabled = true;
    board.moveExtraTileToArrowTile(e.offsetX, e.offsetY);
    hasMovedExtraTile = true;
    board.hasMovedExtraTile = true;
    board.slideTileIntoBoard(e.offsetX, e.offsetY);
    let rep = 2;
    let timeID = setInterval(function () {
      if (rep++ > 10) {
        clearInterval(timeID);
      }
      board.update(mouseclick);
      board.renderState(context);
    }, 20);

    setTimeout(() => {
      board.markReachableTilesFrom(currentPlayer.currRow, currentPlayer.currCol);
    }, 700);
    setTimeout(() => {
      board.renderState(context);
      saveGameBtn.disabled = false;
    }, 710);
  } else if (hasMovedExtraTile && board.isMouseOnReachableTile(e.offsetX, e.offsetY) && !board.currentPlayer.moving) {
    saveGameBtn.disabled = true;
    board.movePlayerToReachableTile(e.offsetX, e.offsetY);
    board.generatePlayerPath(e.offsetX, e.offsetY);

    let segments = board.playerPathCoordinates.length;
    let rep = 1;
    let timeID = setInterval(function () {
      if (rep++ > 14 * (segments)) {
        clearInterval(timeID);
        board.currentPlayer.moving = false;
        board.renderState(context);
        board.unmarkReachableTiles();
        board.reachableTiles = null;
        board.checkTreasure(e.offsetX, e.offsetY);
      }

      board.updateCurrentPlayerPosition();
      board.renderState(context);
      if (rep < 14 * (segments)) {
        board.drawCurrentPlayer(context);
      }
    }, 20);

    setTimeout(() => {
      board.unmarkReachableTiles();
    }, 20 * 17 * segments);
    setTimeout(() => {
      board.renderState(context);
    }, 20 * 17 * segments);
    setTimeout(() => {
      step();
    }, 20 * 18 * segments);
  }
}

storyBtn.addEventListener('click', function () {
  storyDiv.hidden = !storyDiv.hidden;
  rulesDiv.hidden = true;
})

rulesBtn.addEventListener('click', function () {
  storyDiv.hidden = true;
  rulesDiv.hidden = !rulesDiv.hidden;
})

startBtn.addEventListener('click', function () {
  controlHelp.hidden = false;
  loaded = false;
  initGame();
});

playerInput.addEventListener('input', function () {
  treasureInput.max = MAXTREASURES / parseInt(playerInput.value);
})

treasureInput.addEventListener('input', function () {
  treasureInput.max = MAXTREASURES / parseInt(playerInput.value);
})

playerInput.addEventListener('input', checkValidity);
treasureInput.addEventListener('input', checkValidity);

function checkValidity() {
  if (!playerInput.validity.valid || !treasureInput.validity.valid || playerInput.value.trim() === "" || treasureInput.value.trim() === "") {
    startBtn.disabled = true;
  } else {
    startBtn.disabled = false;
  }
}

newGameBtn.addEventListener('click', reset);

function reset() {
  playerInput.value = 2;
  treasureInput.value = 2;
  controlsDiv.hidden = false;
  fieldDiv.hidden = true;
  for (let i = 0; i < playerCount; i++) {
    cardArray[i].hidden = true;
  }
  cardArray[currentPlayer.ID].classList.remove('winner');
  context.clearRect(0, 0, canvas.width, canvas.height);
  newGameBtn.hidden = true;
  currentPlayer = null;
  loadGameBtn.hidden = true;
}

saveGameBtn.addEventListener('click', save);

function save() {
  localStorage.setItem('katakomba', JSON.stringify(board));
}

loadGameBtn.addEventListener('click', load);

function load() {
  if (!localStorage.getItem('katakomba')) return;
  let loadedBoard = JSON.parse(localStorage.getItem('katakomba'));
  Object.setPrototypeOf(loadedBoard, Board.prototype);

  playerCount = loadedBoard.playerCount;
  treasureCount = loadedBoard.treasureCount;
  hasMovedExtraTile = loadedBoard.hasMovedExtraTile;
  loaded = true;
  board = loadedBoard;

  board.currentPlayer = Object.assign(new Player(null, null, null, []), board.currentPlayer);
  for (let i = 0; i < board.players.length; i++) {
    board.players[i] = Object.assign(new Player(null, null, null, []), board.players[i]);
    if (board.players[i].ID === board.currentPlayer.ID) {
      board.currentPlayer = board.players[i];
    }
  }
  board.extraTile = Object.assign(new Tile(null, null, null), board.extraTile);
  for (let i = 0; i < board.rows; i++) {
    for (let j = 0; j < board.columns; j++) {
      if (board.state[i][j]) {
        board.state[i][j] = Object.assign(new Tile(null, null, null), board.state[i][j]);
        if (board.state[i][j].players.length !== 0) {
          for (let k = 0; k < board.state[i][j].players.length; k++) {
            board.state[i][j].players[k] = board.players.find(p => p.ID === board.state[i][j].players[k].ID);
          }
        }
      }
    }
  }
  if (board.reachableTiles) {
    for (let i = 0; i < board.reachableTiles.length; i++) {
      board.reachableTiles[i] = board.state[board.reachableTiles[i].row][board.reachableTiles[i].col];
    }
  }

  currentPlayer = board.currentPlayer;

  initGame();

  let scores = board.getPlayerScores();
  updateCardScores(scores);
  let currentTreasures = board.getCurrentTreasures();
  updateCardTreasure(currentTreasures);
  cardArray[currentPlayer.ID].classList.add('currentplayer');
  whosTurn.innerHTML = `${currentPlayer.ID + 1}. játékos ${firstRound ? ' kezd' : ' következik'}`;
}

canvas.addEventListener('click', function (e) {
  mouseclick.x = e.offsetX;
  mouseclick.y = e.offsetY;
  mouseclick.col = parseInt(e.offsetX / 70);
  mouseclick.row = parseInt(e.offsetY / 70);
  mouseclick.dir = getDirFromClick();
})


let mouseclick = { x: undefined, y: undefined, row: undefined, col: undefined, dir: undefined };

function getDirFromClick() {
  if (mouseclick.col === 0) {
    return Directions.RIGHT;
  } else if (mouseclick.col === (board.columns - 1)) {
    return Directions.LEFT;
  } else if (mouseclick.row === 0) {
    return Directions.DOWN;
  } else if (mouseclick.row === (board.rows - 1)) {
    return Directions.UP;
  } else {
    return undefined;
  }
}

const Directions = {
  UP: 1,
  RIGHT: 2,
  DOWN: 3,
  LEFT: 4
}