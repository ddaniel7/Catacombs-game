export class Player {
  startRow;
  startCol;
  currRow;
  currCol;
  x;
  y;
  colors = ["red", "blue", "green", "purple"]
  ID;
  collectedJewels = 0;
  treasures;
  currentTreasure;
  moving;


  constructor(startRow, startCol, ID, treasures) {
    this.startRow = startRow;
    this.currRow = startRow;
    this.startCol = startCol;
    this.currCol = startCol;
    this.ID = ID;
    this.treasures = treasures;
    this.currentTreasure = this.treasures.shift();
    this.x = startCol * 70 + 35;
    this.y = startRow * 70 + 35;
  }

  draw(context) {
    context.beginPath();
    context.arc(this.x, this.y, 10, 0, 2 * Math.PI, false);
    context.fillStyle = this.getColor();
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = '#003300';
    context.stroke();
  }

  hasReachedStartingPoint() {
    return this.currRow === this.startRow && this.currCol === this.startCol;
  }

  getScore() {
    return this.collectedJewels;
  }

  getCurrentTreasure() {
    return this.currentTreasure;
  }

  increaseScore() {
    this.collectedJewels++;
  }

  updateTreasure() {
    this.currentTreasure = this.treasures.shift() || "";
  }

  updatePosition(row, col) {
    this.currRow = row;
    this.currCol = col;
  }

  getColor() {
    return this.colors[this.ID];
  }
}