var EG5 = EG5 || {};

//=================================================
//            Point
//=================================================

EG5.Point = function(x,y) {
  this.x = x;
  this.y = y;
};

EG5.Point.prototype = {
  assignFrom: function(foo) {this.x = foo.x; this.y = foo.y;},
  toString: function() {return "X: " + this.x + ", Y: " + this.y;}
};


//=================================================
//            Dimmension
//=================================================

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


//=================================================
//            Line
//=================================================

/**
 * When drawing lines, they area always drawn from the canvas origin as the starting point.
 * so they are always left-to-right (lrt) or top-to-bottom (ttb).  The constructor will
 * ensure this order is maintained (i.e. "p1" is the origin of any potential line)
 */
EG5.Line = function(p1, p2) {
  if(p1.x == p2.x) {
    this.horizontal = false;
    //vertical
    if(p1.y>p2.y) {
      this.p1 = p2;
      this.p2 = p1;
      return;
    }
  }
  else {
    this.horizontal = true;
    //horizontal
    if(p2.x < p1.x) {
      this.p1 = p2;
      this.p2 = p1;
      return;
    }
  }
  this.p1 = p1;
  this.p2 = p2;
};

EG5.Line.prototype = {
  toString: function() {return (this.horizontal?"Horizontal":"Vertical") + " line from " + this.p1 + " to " + this.p2;}
};



//=================================================
//            Game
//=================================================


/**
 *
 *
 */
EG5.Game = function(canvas) {

  this.PERSISTENT_PARAMS = [
    {
      name: "dotSep",
      type: "int"
    },
    {
      name: "dotRadius",
      type: "int"
    },
    {
      name: "p1Name",
      type: "string"
    },
    {
      name: "p2Name",
      type: "string"
    },
  ];

  this.params = {
    dotSep: 70,
    dotRadius: 10,
    bgColor: "rgb(32,32,32)",
    dotInnerColor: "rgba(250,250, 250, 1)",
    dotOuterColor: "rgba(220, 220, 220, 0.6)",
    activeDotInnerColor: "rgba(245, 233, 20, 1)",
    activeDotOuterColor: "rgba(182, 175, 116, 0.6)",
    cvsOffsetXY: new EG5.Point(0,0),//Offset of canvas from Window origin
    cvsDimXY: new EG5.Dimension(0,0),//Size of canvas, in XY
    cvsDimDots: new EG5.Dimension(0,0),//Size of canvas, in Dots
    boardTLXY: 0,//top-left of the board (subset of canvas), in XY of the window
    boardBRXY:0,//bottom-right of the board, in XY of the window
    p1Color: "#7ebce6",
    p2Color: "#ba3140",
    p1Name: "Player 1",
    p2Name: "Player 2",
    totalNumBoxes: 0,
    version: 1//Someday if I choose to change defaults this may come in handy

  };

  var savedParams = jQuery.cookie();
  jQuery.extend(this.params, savedParams);
  this.correctParamTypes();

  this.canvas = canvas;
  this.ctx = canvas.getContext("2d");
  this.params.halfDotSep = Math.floor(this.params.dotSep/2);

  this.player1Count = 0;
  this.player2Count = 0;
  this.player1Current = true;
  this.boxesFilled = 0;

  this.canvasClickCallback = this.canvasClicked.bind(this);


};

EG5.Game.prototype = {

  //TEMP method until I resolve how to handle cross-device tap
  canvasClicked: function(e) {
    console.log("canvasClicked " + e.pageX + " " + e.pageY);
    this.handleTapOnBoard(e.pageX, e.pageY);
  },



  // ---------------------------------
  // Lifecycle Methods
  // ---------------------------------

  beginGame: function() {
    if(this.currentDot) {
      delete this.currentDot
    }
    this.player1Count = 0;
    this.player2Count = 0;
    this.player1Current = true;
    this.boxesFilled = 0;

    this.resetCanvas();
    this.createGameboard();
    this.ui.paintCurrentPlayer(this.player1Current?this.params.p1Name:this.params.p2Name,
      this.getCurrentPlayerColor());
    //TODO This is temp until I figure the real cross-device way to capture the user gestures
    jQuery("#myCanvas").off("tap", this.canvasClickCallback);
    jQuery("#myCanvas").on("tap", this.canvasClickCallback);
  },

  resetCanvas: function() {
    var canvas = this.canvas;
    var cvsDims = this.ui.getCanvasDimAndPosition();
    canvas.width = cvsDims.width;
    canvas.height = cvsDims.height;

    var ctx = this.ctx;
    ctx.fillStyle = this.params.bgColor;
    ctx.fillRect(0,0,canvas.width, canvas.height);

    this.params.cvsDimXY.width = canvas.width;
    this.params.cvsDimXY.height = canvas.height;
    this.params.cvsOffsetXY.x = cvsDims.x;
    this.params.cvsOffsetXY.y = cvsDims.y;

    console.log("Canvas dimensions" + this.params.cvsDimXY);
  },

  createGameboard: function() {
    var params = this.params;

    //Calculate the # of horizontal and vertical dots
    var numHorDots = Math.floor((params.cvsDimXY.width-params.dotSep)/params.dotSep)+1;
    var numVerDots = Math.floor((params.cvsDimXY.height-params.dotSep)/params.dotSep)+1;

    this.params.cvsDimDots.width = numHorDots-1;
    this.params.cvsDimDots.height = numVerDots-1;

    var loXHalf = Math.floor((((params.cvsDimXY.width-params.dotSep)%params.dotSep)/2));
    var loYHalf = Math.floor(((params.cvsDimXY.height-params.dotSep)%params.dotSep)/2);

    this.params.boardTLXY = new EG5.Point(loXHalf,loYHalf);
    this.params.boardBRXY = new EG5.Point((loXHalf + (numHorDots*params.dotSep)), (loYHalf + (numVerDots*params.dotSep)));

    console.log("Board TL: " + this.params.boardTLXY);
    console.log("Board BR: " + this.params.boardBRXY);

    console.log("Game " + this.params.cvsDimDots + ", Leftover: " + (loXHalf*2) + "x" + (loYHalf*2));

    //Create data structures
    this.horLines = this.createArrays(numHorDots, numVerDots, false);
    this.verLines = this.createArrays(numHorDots, numVerDots, false);
    this.boxes = this.createArrays(numHorDots-1, numVerDots-1, false);//TODO: I never use this.  Kill it?
    this.params.totalNumBoxes = (numHorDots-1)*(numVerDots-1);
    //Seems faster if I precompute the XY centers for every Dot.  I had a function to xlate this but
    //I seemed to call it a lot.  thought about attaching "XY" and "DOT" coords to point, but this seemed
    //more realsonable.  I know none of this matters given the magnitude of the board - just trying to stretch
    //my thinking.
    this.dotCentersXY = this.createArrays(numHorDots, numVerDots, 0);


    var xLoc = params.halfDotSep + this.params.boardTLXY.x;
    for(var i = 0; i<numHorDots; i++) {
      var yLoc = params.halfDotSep + this.params.boardTLXY.y;
      for(var j = 0; j<numVerDots; j++) {
        this.dotCentersXY[i][j] = new EG5.Point(xLoc, yLoc);
        this.drawDot(this.dotCentersXY[i][j], params.dotInnerColor, params.dotOuterColor);
        yLoc+=params.dotSep;
      }
      xLoc+=params.dotSep;
    }

  },

  /**
   * Call to update parameters based on passed-in values.
   */
  updateParams: function(newParams) {

    jQuery.extend(this.params, newParams);
    this.correctParamTypes();

    var that = this;

    jQuery.each(this.PERSISTENT_PARAMS, function(index, val) {
      console.log("Update cookie: " + val.name);
      jQuery.cookie(val.name, that.params[val.name], {expires: 365});
    });

    //This sucks.  I should use one of those nifty 2-way binding libraries for this.  Or, I can
    //just chill and admit it a a finite number of props I care about.
    this.ui.paintCurrentPlayer(this.player1Current?this.params.p1Name:this.params.p2Name,
      this.getCurrentPlayerColor());
  },

  /**
   * There should be a more elegant way to do this, but for some of the numbers
   * I seem to be having a String append vs. addition, so I convert them
   * back to numbers.  Remains to be seen if I have to do this for booleans,
   * or if I have any floats.
   */
  correctParamTypes: function() {
    var that = this;
    jQuery.each(this.PERSISTENT_PARAMS, function(index, value) {
      switch(value.type) {
        case "int":
          var numVal = parseInt(that.params[value.name]);
          that.params[value.name] = numVal;
      }
    });
  },



  // ---------------------------------
  // Board Logic Methods
  // ---------------------------------

  handleTapOnBoard: function(x,y) {

    var p = this.params;

    /*
    Odd bug with how I did things is that someone can click to the right outside
    the board, or below the last row.  It'll then try to draw a line to no-where.
    x-late the clicked point to the x/y of the last row/column then let the rest
    of existing logic take over.
    */
    if(
      (x<(p.boardTLXY.x+1)) ||
      (x>(p.boardBRXY.x-1)) ||
      (y<(p.boardTLXY.y+1)) ||
      (y>(p.boardBRXY.y-1)) ) {
      //Not on the "board".  Return
      console.log("Click outside board");
      return;
    }
    else {
      console.log("coordinate: " + x + "," + y + " is within TL: " + p.boardTLXY + ", BR: " + p.boardBRXY);
    }


    /*
      There are a bunch of edge cases to handle.  The bottom left dot has no incoming vectors, and only
      one outgoing.  The left column has no incomming horozontal vectors, etc.  The thing I forgot first time was in the checking
      of bounds for the bottom and right-most columns.
    */
    var newDotCoordDot = this.xyToDot(x,y);
    var newDotCenterXY = this.dotToXY(newDotCoordDot);

    if(this.currentDot) {

      var shouldDrawLine = true;

      //Check for clicking on same dot or one not adjacent (unset)
      var xDiff = Math.abs(this.currentDot.x-newDotCoordDot.x);
      var yDiff = Math.abs(this.currentDot.y-newDotCoordDot.y);
      if(
        (xDiff > 1) || //more than one away
        (yDiff > 1) || //more than one away
        (xDiff == yDiff) //same dot, or diagnol
        ) {
        console.log("Won't draw line since line >1 unit or same dot (old: " + this.currentDot + ", new: " + this.newDotCoordDot + ")");
        shouldDrawLine = false;
      }
      var newLine = new EG5.Line(this.currentDot, newDotCoordDot);
      if(this.lineExists(newLine)) {
        console.log("Won't draw line since line exists");
        shouldDrawLine = false;
      }

      if(shouldDrawLine) {
        this.drawLine(
          this.currentDot,
          newDotCoordDot,
          this.params.dotInnerColor);
        this.recordLine(newLine);

        var newBoxes = this.testLineClosedBox(newLine);
        if(newBoxes.length>0) {
          console.log("Line created: " + newBoxes.length + " boxes");
          for(var i = 0; i<newBoxes.length; i++) {
            console.log("Draw and record box: " + newBoxes[i]);
            this.boxes[newBoxes[i].x][newBoxes[i].y] = true;//Do I need this for anything?  TODO I don't think I need this structure.
            this.drawBox(newBoxes[i], this.getCurrentPlayerColor());
            if(this.playerClosedBox(this.player1Current)) {
              //TODO: I don't think I need the boolean return.  I check later for this.
            }
          }
        }
        else {
          console.log("Line did not close box");
          this.switchPlayers();
        }
      }

      //Clear previous highlight
      var oldDotCenterXY = this.dotToXY(this.currentDot);
      this.drawDot(oldDotCenterXY, this.params.dotInnerColor, this.params.dotOuterColor);
      delete this.currentDot;
      if(this.boxesFilled == this.params.totalNumBoxes) {
        console.log("Game over");
        this.ui.showGameEnd(this.params.p1Name, this.player1Count,
          this.params.p2Name, this.player2Count);
      }
      else {
        console.log("Boxes Filled: " + this.boxesFilled + " total " + this.params.totalNumBoxes);
      }
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
        (newDotCoordDot.x != (p.cvsDimDots.width)) && //Check if not the last column
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
        (newDotCoordDot.y != (p.cvsDimDots.height)) &&
        (!this.verLines[newDotCoordDot.x][newDotCoordDot.y])
        ) {
        canHighlight = true;
      }
      if(canHighlight) {
        console.log("Set current dot");
        this.currentDot = newDotCoordDot;
        this.drawDot(newDotCenterXY, this.params.activeDotInnerColor, this.params.activeDotOuterColor);
      }
    }
  },

  switchPlayers: function() {
    console.log("Switch players");
    this.player1Current = !this.player1Current;
    this.ui.paintCurrentPlayer(this.player1Current?this.params.p1Name:this.params.p2Name,
      this.getCurrentPlayerColor());
  },

  playerClosedBox: function(player1) {
    if(this.player1Current) {this.player1Count++}else{this.player2Count++};
    console.log("Player 1: " + this.player1Count + ", Player 2: " + this.player2Count);
    if(++this.boxesFilled == this.totalNumBoxes) {
      return true;
    }
    return false;
  },




  /**
   * Returns an array with the coordinates of each box closed (0, 1, or 2 in length).
   */
  testLineClosedBox: function(l) {
    //TODO This is a very goofy implementation using arrays
    //like this
    var ret = [];
    //Every line drawn can close at most 2 boxes.  Edge lines may close only one.
    if(l.horizontal) {
      //Check above
      if(
        (l.p1.y > 0) && //Don't check if top-most row
        (
          this.horLines[l.p1.x][l.p1.y-1] && //top of upper box
          this.verLines[l.p1.x][l.p1.y-1] && //left of upper box
          this.verLines[l.p2.x][l.p1.y-1]
        )) {
        ret.push(new EG5.Point(l.p1.x, l.p1.y-1));
      }
      //Check below
      if(
        (l.p1.y != (this.params.cvsDimDots.height)) && //make sure not last row
        (
          this.verLines[l.p1.x][l.p1.y] && //Left
          this.verLines[l.p2.x][l.p2.y] && //right
          this.horLines[l.p1.x][l.p2.y+1]//bottom
        )) {
        ret.push(new EG5.Point(l.p1.x, l.p1.y));
      }
    }
    else {
      //Check left
      if(
        (l.p1.x>0) && //Don't check if first column
        (
          this.horLines[l.p1.x-1][l.p1.y] && //top
          this.horLines[l.p2.x-1][l.p2.y] &&//Bottom
          this.verLines[l.p1.x-1][l.p1.y]//left
        )
        ) {
        ret.push(new EG5.Point(l.p1.x-1, l.p1.y));
      }
      if(
        (l.p1.x != this.params.cvsDimDots.width) && //Don't check last column
        (
          this.horLines[l.p1.x][l.p1.y] && //top
          this.horLines[l.p2.x][l.p2.y] && //bottom
          this.verLines[l.p1.x+1][l.p1.y]
        )
        ) {
        ret.push(new EG5.Point(l.p1.x, l.p1.y));
      }
    }
    return ret;
  },

  /**
   * Marks a line as existing between two
   * points, rtl or ttb
   */
  recordLine: function(l) {
    console.log("Recording line: " + l.toString());
    if(l.horizontal) {
      this.horLines[l.p1.x][l.p1.y] = true;
    }
    else {
      this.verLines[l.p1.x][l.p1.y] = true;
    }
  },

  /**
   * Tests if a line exists
   */
  lineExists: function(l) {
    return l.horizontal?
      this.horLines[l.p1.x][l.p1.y]:
      this.verLines[l.p1.x][l.p1.y];
  },


  // ---------------------------------
  // Utility Methods
  // ---------------------------------


  getCurrentPlayerColor: function() {
    return this.player1Current?this.params.p1Color:this.params.p2Color
  },

  createArrays: function(x,y, val) {
    //TODO I feel stupid doing this.  First off, I can use "undefined" rather tha
    //prefill.  Plus, there should be some JS/jquery magic for going this iteration
    var ret = [];
    for(var i = 0; i<x; i++) {
      ret[i] = [];
      for(var j = 0; j<y; j++) {
        ret[i][j] = val;
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
    //Adjust for the canvas offset
    point.x-=params.cvsOffsetXY.x;
    point.y-=params.cvsOffsetXY.y;

    //Adjust for the board offset
    point.x-=params.boardTLXY.x-params.cvsOffsetXY.x;
    point.y-=params.boardTLXY.y-params.cvsOffsetXY.y;

    point.x-=params.halfDotSep;
    point.y-=params.halfDotSep;


    var xDot = Math.round(point.x/params.dotSep);
    var yDot = Math.round(point.y/params.dotSep);

    var ret = new EG5.Point(xDot, yDot);
    console.log("xyToDot x: " + x + ", y: " + y + ", ret: " + ret);
    return ret;
  },

  /**
   * Returns the center of a dot in canvas coordinates (not currently absolute, if the canvas isn't at 0,0 of the browser).
   *
   */
  dotToXY: function(d) {
    try {
      console.log("dotToXY: " + d);
      return this.dotCentersXY[d.x][d.y];
    }
    catch(e) {
      console.log("Caught exception");
      console.log(e.stackTrace());
    }
  },

  // ---------------------------------
  // Canvas Painting Methods
  // ---------------------------------

  /**
   * Draw a dit at the given x/y coordinate, with the inner and outer colors
   */
  drawDot: function(d, ic, oc) {
    var ctx = this.ctx;
    //Clear old due to alpha
    ctx.beginPath();
    ctx.fillStyle = this.params.bgColor;
    ctx.arc(d.x, d.y, this.params.dotRadius, 2*Math.PI, false);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(d.x, d.y, this.params.dotRadius, 2*Math.PI, false);
    var p1 = d.x;
    var p2 = d.y;
    var p3 = this.params.dotRadius*0.5;
    var p4 = Math.floor(this.params.dotRadius*0.5);
    var p5 = this.params.dotRadius;
//    console.log("p1: " + p1 + " p2: " + p2 + " p3: " + p3 + " p4: " + p4 + " p5: " + p5);
    var gradient = ctx.createRadialGradient(p1, p2, p4, p1, p2, p5);
//    var gradient = ctx.createRadialGradient(d.x, d.y, Math.floor(this.params.dotRadius*0.5), d.x, d.y, this.params.dotRadius);

    gradient.addColorStop(0, ic);
    gradient.addColorStop(1, oc);
    ctx.fillStyle = gradient;
    ctx.fill();

  },

  /**
   * The point is the point of the upper-left corner, in DOT notation (not
   * XY).
   */
  drawBox: function(p, color) {
    console.log("Draw box");
    var tlXY = this.dotToXY(p);
    //Yea - I was debugging...TODO - Bill - remove this polution
    var ctx = this.ctx;
    var sides = Math.round(0.7071*this.params.dotRadius);
    var x = tlXY.x+sides;
    var y = tlXY.y+sides;
    var w = this.params.dotSep-(2*sides);
    var h = this.params.dotSep-(2*sides);
    ctx.beginPath();
    //TODO: Shadow?!?  Cool effect.   Check it out.
//    ctx.shadowBlur = 15;
//    ctx.shadowColor = this.params.dotOuterColor;
    ctx.fillStyle = color;
    ctx.rect(x, y, w, h);
    ctx.fill();

  },


  /**
   * Passed points are in dot coordinates.  Always draws rtl or ttb
   */
  drawLine: function(d1, d2, c) {
    if((d1.x>d2.x) || (d1.y>d2.y)) {
      var foo = d1;
      d1 = d2;
      d2 = foo;
    }

    xy1 = this.dotToXY(d1);
    xy2 = this.dotToXY(d2);

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


//=================================================
//            Controller
//=================================================

EG5.UI = function() {
};

EG5.UI.prototype = {

  init: function(game) {
    this.game = game;

    jQuery("#settingsButton").on("click", this.openSettingsClicked.bind(this));
    jQuery("#restartButton").on("click", this.restartGameClicked.bind(this));

    jQuery("#saveSettingsButton").on("click", this.saveSettingsClicked.bind(this));
    jQuery("#cancelSettingsButton").on("click", this.saveSettingsClicked.bind(this));

    jQuery("#confirmRestartButton").on("click", this.confirmRestart.bind(this));
    jQuery("#cancelRestartButton").on("click", this.cancelRestart.bind(this));

    jQuery("#winnerBanner").on("popupafterclose", this.winnerBannerClosed.bind(this));
  },


  // ---------------------------------
  // Methods for Game
  // ---------------------------------

  paintCurrentPlayer: function(name, color) {
    //The hackery below is because the life of me I could not get
    //the text to change with a simple ".text" call in jQuery.  Didn't
    //find anything useful in the JQM docs/stackoverflow
    console.log("Updating display for player: " + name);
    var theElement = jQuery("#currentPlayerLabel");
    var theParent = theElement.parent();
    jQuery("#currentPlayerLabel").text(name);
    jQuery("#currentPlayerLabel").replaceWith("<span style=\"color: " + color + "\" id=\"currentPlayerLabel\">"
      + name +"'s turn</span>");

  },

  /**
   * Returns to the Game the x, y (of upper left) and width/height
   * for the canvas.  The UI knows of any other controls, and
   * adjusts the canvas accordingly
   */
  getCanvasDimAndPosition: function() {
    //Currently hardcoding the assumption that the canvas is at 0,0 of the window, but trying to make
    //sure my *other* calculations don't make the same assumption
    return {
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight-45
    };
  },

  showGameEnd: function(p1Name, p1Score, p2Name, p2Score) {
    var txt = "<span id=\"winnerText\"><p>" + p1Name + ": " + p1Score + "</p>" +
      "<p>" + p2Name + ": " + p2Score + "</p>" +
      "<p>" + ((p1Score>p2Score)?p1Name:p2Name) + " is the winner!</p></span>";
    console.log(txt);
    jQuery("#winnerText").replaceWith(txt);
    jQuery("#winnerBanner").popup("open");
  },

  // ---------------------------------
  // UI Callbacks
  // ---------------------------------

  winnerBannerClosed: function() {
    this.game.beginGame.call(this.game);
  },

  restartGameClicked: function() {
    console.log("Restart clicked");
    jQuery("#restartConfirmDialog").popup("open");
  },

  confirmRestart: function() {
    this.game.beginGame.call(this.game);
    jQuery("#restartConfirmDialog").popup("close");
  },
  cancelRestart: function() {
    jQuery("#restartConfirmDialog").popup("close");
  },

  openSettingsClicked: function() {
    console.log("Settings clicked");
    jQuery("#player1Name").val(this.game.params.p1Name);
    jQuery("#player2Name").val(this.game.params.p2Name);
    jQuery("#dotSep").val(this.game.params.dotSep);
    jQuery("#dotRadius").val(this.game.params.dotRadius);
    jQuery("#settingsDialog").popup("open");
  },

  saveSettingsClicked: function() {
    console.log("Save settings selected");
    $("#settingsDialog").popup("close");
    this.game.updateParams.call(this.game,
    {
      p1Name: jQuery("#player1Name").val(),
      p2Name: jQuery("#player2Name").val(),
      dotRadius: jQuery("#dotRadius").val(),
      dotSep: jQuery("#dotSep").val()
    });
  },
  cancelSettingsClicked: function() {
    console.log("Cancel settings selected");
    $("#settingsDialog").popup("close");
  }


};


//=================================================
//            Entry Point from .html
//=================================================

EG5.app = (function() {
  var _init = function() {



    //Damm voodo for browsers
    document.documentElement.style.overflow = 'hidden';
    document.body.scroll = "no";
    $("[data-role=footer]").toolbar({ tapToggle: false });

    var game = new EG5.Game($("#myCanvas")[0]);
    var controller = new EG5.UI();
    controller.init(game);
    game.ui = controller;
    game.beginGame();
  };
  return {
    init: _init
  }
}());
