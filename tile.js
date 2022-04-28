export class Tile {
  row;
  col;
  x;
  y;
  neighbors;
  smallTile = 70 / 3;
  tileWidth = 70;
  tileHeight = 70;
  treasure;
  players;
  cornerTiles = [
    [0, 0], [2, 0], [0, 2], [2, 2]
  ];
  reachable = false;
  parent;

  constructor(row, col, neighbors) {
    this.row = row;
    this.col = col;
    this.x = this.col * this.tileWidth;
    this.y = this.row * this.tileHeight;
    this.neighbors = neighbors;
    this.players = [];
  }

  fromNeighborsToCoordinates(neighbors) {
    let res = [[1, 1]];

    for (let elem of neighbors) {
      switch (elem) {
        case 0: res.push([0, 1]); break;
        case 1: res.push([1, 2]); break;
        case 2: res.push([2, 1]); break;
        case 3: res.push([1, 0]); break;
      }
    }

    return res;
  }

  drawTile(context) {
    context.save();

    // translate to position
    context.translate(this.x, this.y);

    context.clearRect(0,0,70,70);

    // draw black background
    context.fillStyle = '#413d3a';
    context.fillRect(0, 0, this.tileWidth, this.tileHeight);

    // draw rooms
    let roomColor = this.reachable ? 'pink' : '#ffc107';
    this.drawRoom(context, roomColor);

    // draw players
    this.drawPlayers(context);

    // draw treasure
    this.drawTreasure(context);

    // draw brown border 
    context.strokeStyle = '#b3826b';
    context.strokeRect(0, 0, this.tileWidth, this.tileHeight);

    // restore original position
    context.restore();
  }

  drawRoom(context, color) {
    let coordinates = this.fromNeighborsToCoordinates(this.neighbors);
    coordinates.forEach(coord => {
      context.save();
      context.translate(coord[1] * this.smallTile, coord[0] * this.smallTile);
      context.fillStyle = color;
      context.fillRect(0, 0, this.smallTile, this.smallTile);
      context.strokeStyle = color;
      context.strokeRect(0, 0, this.smallTile, this.smallTile);
      context.restore();
    })
  }

  drawPlayers(context) {
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].moving) continue;
      context.save();
      context.translate(this.cornerTiles[i][0] * this.smallTile, this.cornerTiles[i][1] * this.smallTile);
      context.beginPath();
      context.arc(this.smallTile / 2, this.smallTile / 2, 10, 0, 2 * Math.PI, false);
      context.fillStyle = this.players[i].getColor();
      context.fill();
      context.lineWidth = 2;
      context.strokeStyle = '#003300';
      context.stroke();
      context.restore();
    }
  }

  drawTreasure(context) {
    if (this.treasure) {
      context.fillStyle = 'black';
      context.font = '23px Amaranth';
      context.textAlign = 'center';
      context.fillText(this.treasure, this.tileWidth / 2, this.tileWidth / 2 + 8)
    }
  }

  addPlayer(player) {
    this.players.push(player);
  }

  removePlayer(playerID) {
    let playerIndex = this.players.map(player => playerID).indexOf(playerID);
    this.players.splice(playerIndex, 1);
  }


  addTreasure(treasure) {
    this.treasure = treasure;
  }

  removeTreasure() {
    this.treasure = undefined;
  }

  hasTreasure() {
    return this.treasure !== undefined;
  }

  setRow(row) {
    this.row = row;
    // update players on this tile
    this.players.forEach(player => {
      player.currRow = this.row;
    })
  }


  setCol(col) {
    this.col = col;
    // update players on this tile
    this.players.forEach(player => {
      player.currCol = this.col;
    })

  }

  rotateTile(context) {
    this.neighbors = this.neighbors.map(x => (x + 1) % 4);
  }
}

