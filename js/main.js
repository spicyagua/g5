//TODO a "bar" across the bottom with a box with the color w/ a number by/in it (current score).  Some arrow or other indicator of who is "up"
//Such a bar may also have a "quit" button and launch to something like an options page.

var EG5 = EG5 || {};

EG5.Point = function(x,y) {
  this.x = x;
  this.y = y;
};

EG5.Point.prototype = {
  isSet: function() {return this.x>=0;},
  clear: function() {this.x=-1},
  setXY: function(x1,y1) {this.x = x1; this.y = y1;},
  assignFrom: function(foo) {this.x = foo.x; this.y = foo.y;},
  toString: function() {return "X: " + this.x + ", Y: " + this.y;}
};

//I know this is my Java background creeping in and I recognize that
//this has the same effective use as the "point", but I prefer to refer to
//"width" vs "x".  I'd started creating some bugs for myself w/o this "type"
EG5.Dimension = function(width, height) {
  this.width = width;
  this.height = height;
};

EG5.Dimension.prototype = {
  toString: function() {return "Width: " + this.width + ", Height: " + this.height;}
};

/**
 * When drawing lines, they area always drawn from the canvas origin as the starting point.
 * so they are always left-to-right (lrt) or top-to-bottom (ttb).
 */
EG5.Line = function(p1, p2) {
  this.p1 = p1;
  this.p2 = p2;
};

/**
 *
 */
EG5.Line.prototype = {

};

EG5.Game = function(canvas) {

  this.params = {
    dotSep: 70,
    dotRadius: 10,
    dotInnerColor: "rgba(250,250, 250, 1)",
    dotOuterColor: "rgba(220, 220, 220, 0.6)",
    activeDotInnerColor: "rgba(245, 233, 20, 1)",
    activeDotOuterColor: "rgba(182, 175, 116, 0.6)",
    cvsOffsetXY: new EG5.Point(0,0),
    cvsDimXY: new EG5.Dimension(0,0),
    cvsDimDots: new EG5.Dimension(0,0),
    boardTLXY: 0,
    boardBRXY:0

  };
  this.canvas = canvas;
  this.ctx = canvas.getContext("2d");
  this.params.halfDotSep = Math.floor(this.params.dotSep/2);
  this.params.cvsDimXY.width = canvas.width;
  this.params.cvsDimXY.height = canvas.height;
  //Currently hardcoding the assumption that the canvas is at 0,0 of the window, but trying to make
  //sure my *other* calculations don't make the same assumption
  this.params.cvsOffsetXY.x = 0;
  this.params.cvsOffsetXY.y = 0;

  console.log("Canvas dimensions" + this.params.cvsDimXY);

  //Currently selected dot.  x/y -1 if none selected
  this.currentDot = (function() {
    var dot = {x:-1,y:-1};

    return {
      getX: function() {return dot.x;},
      getY: function() {return dot.y;},
      isSet: function() {return dot.x>=0;},
      clear: function() {dot.x=-1; dot.y=-1},
      setXY: function(x1,y1) {dot.x = x1; dot.y = y1;},
      setDot: function(foo) {dot.x = foo.x; dot.y = foo.y;},
      getDot: function() {return dot;},
      toString: function() {return "Dot coords.  X: " + dot.x + ", Y: " + dot.y;}
    }
  }());

  /**
   * Holds 2 dots.  A "dot" is an object with {x,y}
   */
  this.lastLine = (function() {
    var emptyObj = {};
    var d1 = emptyObj;
    var d2 = emptyObj;

    return {
      getD1: function() {return x;},
      getD2: function() {return y;},
      isSet: function() {return d1 == emptyObj},
      clear: function() {x=emptyObj; y=emptyObj},
      setDots: function(d1,d2) {d1 = d1; d2 = d2;},
      toString: function() {return "D1 (" + d1.x + "," + d1.y + ") D2 (" + d2.x + "," + d2.y + ")";}
    }
  }());
};

EG5.Game.prototype = {

  canvasClicked: function(e) {
    console.log("canvasClicked " + e.pageX + " " + e.pageY);
    this.handleTapOnBoard(e.pageX, e.pageY);
  },

  handleTapOnBoard: function(x,y) {

    var p = this.params;

    /*
    Odd bug with how I did things is that someone can click to the right outside
    the board, or below the last row.  It'll then try to draw a line to no-where.
    x-late the clicked point to the x/y of the last row/column then let the rest
    of existing logic take over.
    */
    if(
      (x<p.boardTLXY.x) ||
      (x>p.boardBRXY.x) ||
      (y<p.boardTLXY.y) ||
      (y>p.boardBRXY.y) ) {
      //Not on the "board".  Return
      return;
    }


    /*
      There are a bunch of edge cases to handle.  The bottom left dot has no incoming vectors, and only
      one outgoing.  The left column has no incomming horozontal vectors, etc.  The thing I forgot first time was in the checking
      of bounds for the bottom and right-most columns.
    */

    var newDotCoordDot = this.xyToDot(x,y);
    var newDotCenterXY = this.dotToXY(newDotCoordDot.x, newDotCoordDot.y);

    if(this.currentDot.isSet()) {
      //Check for clicking on same dot or one not adjacent (unset)
      var xDiff = Math.abs(this.currentDot.getX()-newDotCoordDot.x);
      var yDiff = Math.abs(this.currentDot.getY()-newDotCoordDot.y);
      if(
        (xDiff > 1) || //more than one away
        (yDiff > 1) || //more than one away
        (xDiff == yDiff) //same dot, or diagnol
        ) {
        console.log("Clear current dot " + this.currentDot);
        var oldDotCenter = this.dotToXY(this.currentDot.getX(), this.currentDot.getY());
        this.drawDot(oldDotCenter.x, oldDotCenter.y, this.params.dotInnerColor, this.params.dotOuterColor);
        this.currentDot.clear();
        return;
      }

      //***TODO*** Make sure there isn't already a line in that spot.  It could be a legal dot
      //to click (the first one), but not the second.

      //Yippie!! We have a line to draw
      this.drawLine(
        this.currentDot.getDot(),
        newDotCoordDot,
        this.params.dotInnerColor);
      var oldDotCenter = this.dotToXY(this.currentDot.getX(), this.currentDot.getY());
      this.drawDot(oldDotCenter.x, oldDotCenter.y, this.params.dotInnerColor, this.params.dotOuterColor);
      this.currentDot.clear();
    }
    else {
      //Make sure there are possible connections to this dot still available
      var canHighlight = false;

      //Check horizontal
      //rtl first.  If it isn't the first column, check if there is an
      //inbound vector
      if((newDotCoordDot.x > 0) && !this.horLines[newDotCoordDot.x-1][newDotCoordDot.y]) {
        canHighlight = true;
      }
      //Check if the current point has an outbound vector, unless it is the
      //last column
      if(
        (newDotCoordDot.x != (p.cvsDimDots.width-1)) && //Check if not the last column
        (!this.horLines[newDotCoordDot.x][newDotCoordDot.y])) {
        canHighlight = true;
      }
      //Check vertical
      //ttb first.  Top has no inbound
      if(
        (newDotCoordDot.y > 0) && !this.verLines[newDotCoordDot.x][newDotCoordDot.y-1]) {
        canHighlight = true;
      }
      //Outbound (down).  The last row cannot have this.
      if(
        (newDotCoordDot.y != (p.cvsDimDots.height-1)) &&
        (!this.verLines[newDotCoordDot.x][newDotCoordDot.y])
        ) {
        canHighlight = true;
      }
      if(canHighlight) {
        console.log("Set current dot");
        this.currentDot.setXY(newDotCoordDot.x, newDotCoordDot.y);
        this.drawDot(newDotCenterXY.x, newDotCenterXY.y, this.params.activeDotInnerColor, this.params.activeDotOuterColor);
      }
    }




  },

  beginGame: function() {
    this.createGameboard();
    jQuery("#myCanvas").click(this.canvasClicked.bind(this));
  },

  createGameboard: function() {
    var params = this.params;

    //Calculate the # of horizontal and vertical dots
    var numHorDots = Math.floor((params.cvsDimXY.width-params.halfDotSep)/params.dotSep);
    var numVerDots = Math.floor((params.cvsDimXY.height-params.halfDotSep)/params.dotSep);

    this.params.cvsDimDots.width = numHorDots;
    this.params.cvsDimDots.height = numVerDots;


    var loX = Math.floor((params.cvsDimXY.width-params.halfDotSep)%params.dotSep);
    var loY = Math.floor((params.cvsDimXY.height-params.halfDotSep)/params.dotSep);
    var smallest = loX>loY?loY:loX;
    if(smallest > numHorDots) {
      var xtra = Math.floor(smallest/numHorDots);
      console.log("Added " + xtra + " extra");
      params.dotSep+=xtra;
      params.halfDotSep = Math.floor(params.dotSep/2)
    }

    //Record the boundary of the board
    this.params.boardTLXY = new EG5.Point(1,1);
    this.params.boardBRXY = new EG5.Point(((numHorDots*params.dotSep))-1, ((numVerDots*params.dotSep))-1);

    console.log("Board TL: " + this.params.boardTLXY);
    console.log("Board BR: " + this.params.boardBRXY);

    console.log("Game " + numHorDots + "x" + numVerDots + ", Leftover: " + loX + "x" + loY);

    //Create data structures
    this.horLines = this.createArrays(numHorDots, numVerDots, false);
    this.verLines = this.createArrays(numHorDots, numVerDots, false);


    var xLoc = params.halfDotSep;
    for(var i = 0; i<numHorDots; i++) {
      var yLoc = params.halfDotSep;
      for(var j = 0; j<numVerDots; j++) {
        this.drawDot(xLoc, yLoc, params.dotInnerColor, params.dotOuterColor);
        yLoc+=params.dotSep;
      }
      xLoc+=params.dotSep;
    }

  },

  createArrays: function(x,y, val) {
    //TODO I feel stupid doing this.  First off, I can use "undefined" rather tha
    //prefill.  Plus, there should be some JS/jquery magic for going this iteration
    var ret = [];
    for(var i = 0; i<x; i++) {
      ret[i] = [];
      for(var j = 0; j<y; j++) {
        ret[i][j] = 0
      }
    }
    return ret;
  },

  /**
   * Returns the nearest dot to the x.y coordinate, in the "dot" coordinate system.
   */
  xyToDot: function(x,y) {
    var point;
    if(arguments.length == 2) {
      point = {x: arguments[0], y: arguments[1]};
    }
    else {
      point = arguments[0];
    }
    var params = this.params;
    point.x-=params.halfDotSep;
    point.y-=params.halfDotSep;
    point.x-=params.cvsOffsetXY.x;
    point.y-=params.cvsOffsetXY.y;

    xDot = Math.round(point.x/params.dotSep);
    yDot = Math.round(point.y/params.dotSep);

    return new EG5.Point(xDot, yDot);
  },

  /**
   * Returns the center of a dot in canvas coordinates (not currently absolute, of the canvas isn't at 0,0 of the browser).
   * Can accept x,y or a point
   */
  dotToXY: function() {
    var point;
    if(arguments.length == 2) {
      point = {x: arguments[0], y: arguments[1]};
    }
    else {
      point = arguments[0];
    }
    return new EG5.Point(this.params.halfDotSep + (point.x*this.params.dotSep), this.params.halfDotSep + (point.y*this.params.dotSep));
  },

  drawDot: function(x,y, ic, oc) {
    var ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x, y, this.params.dotRadius, 2*Math.PI, false);
    var gradient = ctx.createRadialGradient(x, y, Math.floor(this.params.dotRadius*0.5), x, y, this.params.dotRadius);
    gradient.addColorStop(0, ic);
    gradient.addColorStop(1, oc);
    ctx.fillStyle = gradient;
    ctx.fill();

  },


  //Passed points are in dot coordinates.  Always draws
  //rtl or ttb
  drawLine: function(d1, d2, c) {
    if((d1.x>d2.x) || (d1.y>d2.y)) {
      var foo = d1;
      d1 = d2;
      d2 = foo;
    }

//    console.log("Dot1: " + d1.x + "," + d1.y);
//    console.log("Dot2: " + d2.x + "," + d2.y);

    xy1 = this.dotToXY(d1.x, d1.y);
    xy2 = this.dotToXY(d2.x, d2.y);

    var ctx = this.ctx;
    var halfLineWidth = this.params.dotRadius;

    ctx.beginPath();

    if(d1.x == d2.x) {
      //Vertical
      ctx.arc(xy1.x, xy1.y, halfLineWidth, 0, 1*Math.PI, false);
      ctx.lineTo(xy2-halfLineWidth, xy2.y);
      ctx.arc(xy2.x, xy2.y, halfLineWidth, 1*Math.PI, 0, false);
      ctx.lineTo(xy1.x+halfLineWidth, xy1.y);
    }
    else {
      //Horizontal
      ctx.arc(xy1.x, xy1.y, halfLineWidth, 1.5*Math.PI, 0.5*Math.PI, false);
      ctx.lineTo(xy2.x, xy2.y+halfLineWidth);
      ctx.arc(xy2.x, xy2.y, halfLineWidth, 0.5*Math.PI, 1.5*Math.PI, false);
      ctx.lineTo(xy1.x, xy1.y-halfLineWidth);

    }
    ctx.closePath();
    ctx.fillStyle = c;
    ctx.fill();
  },


};

EG5.app = (function() {
  var _init = function() {

    //Damm voodo for browsers
    document.documentElement.style.overflow = 'hidden';
    document.body.scroll = "no";
    var wholeContent = $("#wholeContent")[0];

    var canvas = $("#myCanvas")[0];
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    console.log("Canvas height: " + canvas.height);
    console.log("Canvas width: " + canvas.width);

    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgb(32,32,32)";
    ctx.fillRect(0,0,canvas.width, canvas.height);
/*
    //Debug
    ctx.beginPath();
    ctx.strokeStyle = "white"
    ctx.moveTo(0,0);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.moveTo(canvas.width, 0);
    ctx.lineTo(0,canvas.height);
    ctx.stroke();
*/
    var game = new EG5.Game(canvas);
    game.beginGame();


  };
  return {
    init: _init
  }
}());
