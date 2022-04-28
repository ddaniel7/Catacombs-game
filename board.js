import { Player } from './player.js';
import { Tile } from '/tile.js';

export class Board {
  state;
  rows = 9;
  columns = 9;
  tileWidth = 70;
  tileHeight = 70;
  // 13 straight paths, 15 turns, 6 intersections
  randomTiles = [13, 15, 6];
  arrowTiles = [
    [0, 2], [0, 4], [0, 6],
    [2, 0], [2, 8],
    [4, 0], [4, 8],
    [6, 0], [6, 8],
    [8, 2], [8, 4], [8, 6]
  ]
  playerPositions = [
    [1, 1], [1, 7], [7, 1], [7, 7]
  ]
  players = [];
  extraTile;
  treasures = "ABCDEFGHIJKLMNOPQRSTUXYZ".split('');
  playerCount;
  treasureCount;
  currentPlayer;
  reachableTiles = [];
  lastExtraTilePosition;
  hasMovedExtraTile = false;
  playerPathCoordinates = [
  ];
  nextTargetPoint;

  constructor(playerCount, treasureCount) {
    this.playerCount = playerCount;
    this.treasureCount = treasureCount;

    this.state = [
      ["", "", "", "", "", "", "", "", ""],
      ["", new Tile(1, 1, [1, 2]), "", new Tile(1, 3, [1, 2, 3]), "", new Tile(1, 5, [1, 2, 3]), "", new Tile(1, 7, [2, 3]), ""],
      ["", "", "", "", "", "", "", "", ""],
      ["", new Tile(3, 1, [0, 1, 2]), "", new Tile(3, 3, [0, 1, 2]), "", new Tile(3, 5, [1, 2, 3]), "", new Tile(3, 7, [2, 3, 0]), ""],
      ["", "", "", "", "", "", "", "", ""],
      ["", new Tile(5, 1, [0, 1, 2]), "", new Tile(5, 3, [3, 0, 1]), "", new Tile(5, 5, [2, 3, 0]), "", new Tile(5, 7, [2, 3, 0]), ""],
      ["", "", "", "", "", "", "", "", ""],
      ["", new Tile(7, 1, [0, 1]), "", new Tile(7, 3, [3, 0, 1]), "", new Tile(7, 5, [3, 0, 1]), "", new Tile(7, 7, [3, 0]), ""],
      ["", "", "", "", "", "", "", "", ""],
    ];

    let allTreasures = treasureCount * playerCount;

    // trim treasures according to allTreasures
    this.treasures = this.treasures.slice(0, allTreasures);

    // shuffle treasures
    this.treasures = this.treasures.sort(function () { return 0.5 - Math.random() });
  }




  drawFixedBoard(context) {
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.columns; j++) {
        if (!this.isOuterEdge(i, j)) {
          if (this.isFixedPosition(i, j)) {
            // draw fixed rooms        
            this.state[i][j].drawTile(context);
          } else {
            // blue background, later filled randomly with rooms
            context.fillStyle = '#b3c3f5';
            context.fillRect(j * this.tileWidth, i * this.tileHeight, this.tileWidth, this.tileHeight);
          }
        } else {
          // draw purple outer part 
          context.fillStyle = '#483D8B';
          context.fillRect(j * this.tileWidth, i * this.tileHeight, this.tileWidth, this.tileHeight);

          // draw arrows
          if ([2, 4, 6].includes(i) || [2, 4, 6].includes(j)) {
            this.drawArrow(i, j, context);
          }
        }
      }
    }
  }

  isOuterEdge(row, col) {
    return (row == 0) || (row == this.rows - 1) || (col == 0) || (col == this.columns - 1);
  }

  isFixedPosition(row, col) {
    return (row % 2 === 1) && (col % 2 === 1);
  }

  drawArrow(row, col, context) {
    context.save();

    // translate to position 
    context.translate(col * this.tileWidth, row * this.tileWidth);

    // rotate according to position
    if (col === this.columns - 1) {
      context.translate(this.tileWidth, 0);
      context.rotate(Math.PI / 2);
    } else if (row === this.rows - 1) {
      context.translate(this.tileWidth, this.tileHeight);
      context.rotate(Math.PI);
    } else if (col == 0) {
      context.translate(0, this.tileHeight);
      context.rotate(-Math.PI / 2);
    }

    // draw it
    context.fillStyle = '#ffffff';
    context.strokeStyle = '#ffffff';
    context.beginPath();
    context.moveTo(this.tileWidth / 2, this.tileHeight - 10);
    context.lineTo((this.tileWidth / 2) + 20, this.tileHeight - 40);
    context.lineTo((this.tileWidth / 2) - 20, this.tileHeight - 40);
    context.closePath();
    context.fill();
    context.stroke();

    // restore original position
    context.restore();
  }

  fillWithRandomTiles() {
    for (let i = 1; i < this.rows - 1; i++) {
      for (let j = 1; j < this.columns - 1; j++) {
        if (this.state[i][j] === "") {
          this.state[i][j] = this.generateRandomTile(i, j);
        }
      }
    }

    // add extra tile
    this.extraTile = this.generateRandomTile(0, this.columns - 1);
    this.state[0][this.columns - 1] = this.extraTile;
  }

  generateRandomTile(row, col) {
    // generate random tile type
    let rand;
    do {
      // 0 - STRAIGHT, 1 - TURN, 2 - INTERSECTION
      rand = this.randomNumber(0, 2);
    } while (this.randomTiles[rand] === 0);
    this.randomTiles[rand]--;


    let dir;
    // generate random directions
    if (rand === 0) { // straight
      dir = this.randomNumber(0, 1);
      return new Tile(row, col, [dir, dir + 2]);
    } else if (rand === 1) { // turn
      dir = this.randomNumber(0, 3);
      return new Tile(row, col, [dir, (dir + 1) % 4]);
    } else { // intersection
      dir = this.randomNumber(0, 3);
      return new Tile(row, col, [dir, (dir + 1) % 4, (dir + 2) % 4]);
    }
  }

  randomNumber(a, b) {
    return Math.floor(Math.random() * (b - a + 1) + a);
  }

  renderState(context) {
    // draw purple outer part first
    for (let j = 0; j < this.columns; j++) {
      // draw first and last rows
      context.fillStyle = '#483D8B';
      context.fillRect(j * this.tileWidth, 0 * this.tileHeight, this.tileWidth, this.tileHeight);
      context.fillRect(j * this.tileWidth, 8 * this.tileHeight, this.tileWidth, this.tileHeight);

      // draw arrows
      if ([2, 4, 6].includes(j)) {
        if (this.lastExtraTilePosition && 0 === this.lastExtraTilePosition[0]
          && j === this.lastExtraTilePosition[1]) {
            // do nothing
        } else {
          this.drawArrow(0, j, context);
        }

        if (this.lastExtraTilePosition && 8 === this.lastExtraTilePosition[0]
          && j === this.lastExtraTilePosition[1]) {
            // do nothing
        } else {
          this.drawArrow(8, j, context);
        }
      }
    }

    for (let i = 1; i < this.rows - 1; i++) {
      // draw first and last columns
      context.fillStyle = '#483D8B';
      context.fillRect(0 * this.tileWidth, i * this.tileHeight, this.tileWidth, this.tileHeight);
      context.fillRect(8 * this.tileWidth, i * this.tileHeight, this.tileWidth, this.tileHeight);

      if ([2, 4, 6].includes(i)) {
        if (this.lastExtraTilePosition && i === this.lastExtraTilePosition[0] && 0 === this.lastExtraTilePosition[1]) {
          // do nothing
        } else {
          this.drawArrow(i, 0, context);
        }

        if (this.lastExtraTilePosition && i === this.lastExtraTilePosition[0] && 8 === this.lastExtraTilePosition[1]) {
          // do nothing
        } else {
          this.drawArrow(i, 8, context);
        }
      }
    }

    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.columns; j++) {
        if (this.state[i][j] !== "") {
          this.state[i][j].drawTile(context);
        }
      }
    }
  }

  isMouseOnArrowTile(x, y) {
    for (const tile of this.arrowTiles) {
      if (this.lastExtraTilePosition && tile[0] === this.lastExtraTilePosition[0] &&
        tile[1] === this.lastExtraTilePosition[1]) continue;
      const { top, bottom, left, right } = this.getBoundariesFromCoordinates(tile);
      if (top <= y && y <= bottom && left <= x && x <= right) {
        return true;
      }
    }
  }

  isMouseOnReachableTile(x, y) {
    if (!this.reachableTiles) return; 
    for (const tile of this.reachableTiles) {
      const { top, bottom, left, right } = this.getBoundariesFromCoordinates([tile.row, tile.col]);
      if (top <= y && y <= bottom && left <= x && x <= right) {
        return true;
      }
    }
  }

  moveExtraTileToArrowTile(x, y) {
    for (const tile of this.arrowTiles) {
      const { top, bottom, left, right } = this.getBoundariesFromCoordinates(tile);
      if (top <= y && y <= bottom && left <= x && x <= right) {
        this.state[this.extraTile.row][this.extraTile.col] = "";
        this.state[tile[0]][tile[1]] = this.extraTile;
        this.extraTile.setRow(tile[0]);
        this.extraTile.setCol(tile[1]);
        this.extraTile.x = tile[1] * this.tileWidth;
        this.extraTile.y = tile[0] * this.tileHeight;
      }
    }
  }

  movePlayerToReachableTile(x, y) {
    for (const tile of this.reachableTiles) {
      const { top, bottom, left, right } = this.getBoundariesFromCoordinates([tile.row, tile.col]);
      if (top <= y && y <= bottom && left <= x && x <= right) {
        this.currentPlayer.moving = true;
        //remove player from former position
        this.state[this.currentPlayer.currRow][this.currentPlayer.currCol].removePlayer(this.currentPlayer.ID);
        this.currentPlayer.x = this.currentPlayer.currCol * 70 + 35;
        this.currentPlayer.y = this.currentPlayer.currRow * 70 + 35;
        this.nextTargetPoint = undefined;
        //add player to selected position
        this.state[tile.row][tile.col].addPlayer(this.currentPlayer);
        //update player's position
        this.currentPlayer.updatePosition(tile.row, tile.col);
      }
    }
  }

  checkTreasure(x, y) {
    let tile = this.state[Math.floor(y / 70)][Math.floor(x / 70)];
    if (tile.treasure && tile.treasure === this.currentPlayer.currentTreasure) {
      this.currentPlayer.increaseScore();
      this.currentPlayer.updateTreasure();
      tile.removeTreasure();
    }
  }

  drawCurrentPlayer(context) {
    this.currentPlayer.draw(context);
  }

  updateCurrentPlayerPosition() {
    if (!this.nextTargetPoint) this.nextTargetPoint = this.playerPathCoordinates.shift();
    if (this.currentPlayer.x == this.nextTargetPoint[0] &&
      this.currentPlayer.y == this.nextTargetPoint[1]) {
      if (this.playerPathCoordinates.length === 0) return;
      this.nextTargetPoint = this.playerPathCoordinates.shift();
    } else {
      if (this.currentPlayer.x !== this.nextTargetPoint[0]) {
        if (this.currentPlayer.x < this.nextTargetPoint[0]) {
          this.currentPlayer.x += 5;
        } else {
          this.currentPlayer.x -= 5;
        }
      } else {
        if (this.currentPlayer.y < this.nextTargetPoint[1]) {
          this.currentPlayer.y += 5;
        } else {
          this.currentPlayer.y -= 5;
        }
      }
    }
  }

  getBoundariesFromCoordinates(tile) {
    let top = tile[0] * this.tileHeight;
    let bottom = top + this.tileHeight;
    let left = tile[1] * this.tileWidth;
    let right = left + this.tileWidth;
    return { top, bottom, left, right };
  }

  rotateExtraTile(context) {
    this.extraTile.rotateTile(context);
  }

  slideTileIntoBoard(x, y) {
    for (const tile of this.arrowTiles) {
      const { top, bottom, left, right } = this.getBoundariesFromCoordinates(tile);
      if (top <= y && y <= bottom && left <= x && x <= right) {
        if (tile[0] == 0) {
          this.extraTile = this.state[this.rows - 2][tile[1]];
          this.state[this.rows - 1][tile[1]] = this.extraTile;
          this.extraTile.setRow(this.rows - 1);

          for (let row = this.rows - 2; row >= 1; row--) {
            this.state[row][tile[1]] = this.state[row - 1][tile[1]];
            this.state[row - 1][tile[1]].setRow(row);
          }
          // if the players are pushed off the map,         
          // put them back on the opposite side
          this.extraTile.players.forEach(player => {
            this.state[tile[0] + 1][tile[1]].addPlayer(player);
            player.updatePosition(tile[0] + 1, tile[1]);
          })
        }

        if (tile[0] == this.rows - 1) {
          this.extraTile = this.state[1][tile[1]];
          this.state[0][tile[1]] = this.extraTile;
          this.extraTile.setRow(0);
          for (let row = 1; row <= this.rows - 2; row++) {
            this.state[row][tile[1]] = this.state[row + 1][tile[1]];
            this.state[row + 1][tile[1]].setRow(row);
          }
          // if the players are pushed off the map,         
          // put them back on the opposite side
          this.extraTile.players.forEach(player => {
            this.state[tile[0] - 1][tile[1]].addPlayer(player);
            player.updatePosition(tile[0] - 1, tile[1]);
          })
        }


        if (tile[1] == 0) {
          this.extraTile = this.state[tile[0]][this.columns - 2];
          this.state[tile[0]][this.columns - 1] = this.extraTile;
          this.extraTile.setCol(this.columns - 1);
          for (let col = this.columns - 2; col >= 1; col--) {
            this.state[tile[0]][col] = this.state[tile[0]][col - 1];
            this.state[tile[0]][col - 1].setCol(col);
          }
          // if the players are pushed off the map,         
          // put them back on the opposite side
          this.extraTile.players.forEach(player => {
            this.state[tile[0]][tile[1] + 1].addPlayer(player);
            player.updatePosition(tile[0], tile[1] + 1);
          })
        }

        if (tile[1] == this.columns - 1) {
          this.extraTile = this.state[tile[0]][1];
          this.state[tile[0]][0] = this.extraTile;
          this.extraTile.setCol(0);
          for (let col = 1; col <= this.columns - 2; col++) {
            this.state[tile[0]][col] = this.state[tile[0]][col + 1];
            this.state[tile[0]][col + 1].setCol(col);
          }
          // if the players are pushed off the map, 
          // put them back on the opposite side
          this.extraTile.players.forEach(player => {
            this.state[tile[0]][tile[1] - 1].addPlayer(player);
            player.updatePosition(tile[0], tile[1] - 1);
          })
        }

        this.extraTile.players = [];
        this.state[tile[0]][tile[1]] = "";
        this.lastExtraTilePosition = [this.extraTile.row, this.extraTile.col];
      }
    }
  }

  // translate tiles in the given direction by 7 pixels
  update(mouseclick) {
    if (mouseclick.dir === Directions.RIGHT) {
      for (let j = 1; j < this.columns; j++) {
        this.state[mouseclick.row][j].x += 7;
      }
    } else if (mouseclick.dir === Directions.LEFT) {
      for (let j = 0; j <= this.columns - 2; j++) {
        this.state[mouseclick.row][j].x -= 7;
      }
    } else if (mouseclick.dir === Directions.DOWN) {
      for (let i = 1; i < this.rows; i++) {
        this.state[i][mouseclick.col].y += 7;
      }
    } else if (mouseclick.dir === Directions.UP) {
      for (let i = this.rows - 2; i >= 0; i--) {
        this.state[i][mouseclick.col].y -= 7;
      }
    }
  }

  // add treasures to tiles randomly
  addTreasures() {
    for (let i = 0; i < this.treasures.length; i++) {
      let row, col;
      do {
        row = this.randomNumber(0, 8);
        col = this.randomNumber(0, 8);
      } while (this.state[row][col] == ""
      || this.isCorner(row, col)
      || this.state[row][col] == this.extraTile
      || this.state[row][col].hasTreasure()
      )
      this.state[row][col].addTreasure(this.treasures[i]);
    }
  }

  isCorner(x, y) {
    for (const [row, col] of this.playerPositions) {
      if (x == row && y == col) {
        return true;
      }
    }
    return false;
  }

  addPlayers() {
    for (let i = 0; i < this.playerCount; i++) {
      // treasures are already shuffled
      let playerTreasures = this.treasures.splice(0, this.treasureCount);

      let row = this.playerPositions[i][0];
      let col = this.playerPositions[i][1];

      let player = new Player(row, col, i, playerTreasures);

      this.players.push(player);
      this.state[row][col].addPlayer(player);
    }
  }

  getPlayerScores() {
    return this.players.map(player => player.collectedJewels);
  }

  getCurrentTreasures() {
    return this.players.map(player => player.currentTreasure);
  }

  getCurrentPlayer() {
    if (this.currentPlayer) {
      return this.currentPlayer;
    } else {
      this.currentPlayer = this.players[this.randomNumber(0, this.playerCount - 1)];
      return this.currentPlayer;
    }
  }

  getNextPlayer() {
    if (this.currentPlayer) {
      this.currentPlayer = this.players[(this.currentPlayer.ID + 1) % this.playerCount];
      return this.currentPlayer;
    } else {
      this.currentPlayer = this.players[this.randomNumber(0, this.playerCount - 1)];
      return this.currentPlayer;
    }
  }

  unmarkReachableTiles() {
    if (!this.reachableTiles) return;
    this.reachableTiles.forEach(tile => {
      tile.reachable = false;
      tile.parent = undefined;
    })
  }

  //breadth first search from (row, col)
  markReachableTilesFrom(row, col) {
    this.reachableTiles = [this.state[row][col]];
    let visited = [];
    for (let i = 0; i < this.rows; i++) {
      visited[i] = [];
      for (let j = 0; j < this.columns; j++) {
        visited[i][j] = false;
      }
    }
    let queue = [this.state[row][col]];
    visited[row][col] = true;
    while (queue.length > 0) {
      let tile = queue.shift();
      tile.reachable = true;
      let currentRow = tile.row;
      let currentCol = tile.col;
      // check if there's a path up
      if (tile.neighbors.includes(0) && currentRow > 1 && !visited[currentRow - 1][currentCol] && this.state[currentRow - 1][currentCol].neighbors.includes(2)) {
        queue.push(this.state[currentRow - 1][currentCol]);
        this.reachableTiles.push(this.state[currentRow - 1][currentCol]);
        visited[currentRow - 1][currentCol] = true;
        this.state[currentRow - 1][currentCol].parent = tile;
      }
      // check if there's a path right
      if (tile.neighbors.includes(1) && currentCol < this.columns - 2 && !visited[currentRow][currentCol + 1] && this.state[currentRow][currentCol + 1].neighbors.includes(3)) {
        queue.push(this.state[currentRow][currentCol + 1]);
        this.reachableTiles.push(this.state[currentRow][currentCol + 1]);
        visited[currentRow][currentCol + 1] = true;
        this.state[currentRow][currentCol + 1].parent = tile;
      }

      // check if there's a path down
      if (tile.neighbors.includes(2) && currentRow < this.rows - 2 && !visited[currentRow + 1][currentCol] && this.state[currentRow + 1][currentCol].neighbors.includes(0)) {
        queue.push(this.state[currentRow + 1][currentCol]);
        this.reachableTiles.push(this.state[currentRow + 1][currentCol]);
        visited[currentRow + 1][currentCol] = true;
        this.state[currentRow + 1][currentCol].parent = tile;
      }

      // check if there's a path left
      if (tile.neighbors.includes(3) && currentCol > 1 && !visited[currentRow][currentCol - 1] && this.state[currentRow][currentCol - 1].neighbors.includes(1)) {
        queue.push(this.state[currentRow][currentCol - 1]);
        this.reachableTiles.push(this.state[currentRow][currentCol - 1]);
        visited[currentRow][currentCol - 1] = true;
        this.state[currentRow][currentCol - 1].parent = tile;
      }

    }
  }


  getWinner() {
    return this.players.find(player => player.hasReachedStartingPoint()
      && player.collectedJewels === this.treasureCount);
  }

  generatePlayerPath(targetX, targetY) {
    this.playerPathCoordinates = [];
    let destinationCol = Math.floor(targetX / 70);
    let destinationRow = Math.floor(targetY / 70);
    let tile = this.state[destinationRow][destinationCol];
    while (tile) {
      this.playerPathCoordinates.unshift([tile.col * 70 + 35, tile.row * 70 + 35]);
      tile = tile.parent;
    }
  }
}

const Directions = {
  UP: 1,
  RIGHT: 2,
  DOWN: 3,
  LEFT: 4
}