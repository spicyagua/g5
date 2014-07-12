//TODO a "bar" across the bottom with a box with the color w/ a number by/in it (current score).  Some arrow or other indicator of who is "up"
//Such a bar may also have a "quit" button and launch to something like an options page.

var EG5 = EG5 || {};

EG5.Game = function(canvas) {

  this.params = {
    dotSep: 70,
    dotRadius: 10,
    dotInnerColor: "rgba(250,250, 250, 1)",
    dotOuterColor: "rgba(220, 220, 220, 0.6)",
    activeDotInnerColor: "rgba(245, 233, 20, 1)",
    activeDotOuterColor: "rgba(182, 175, 116, 0.6)",
    cvsWidth: 0,
    cvsHeight: 0,
    cvsOffsetX: 0,
    cvxOffsetY: 0
  };
  this.canvas = canvas;
  this.ctx = canvas.getContext("2d");
  this.params.halfDotSep = Math.floor(this.params.dotSep/2);
  this.params.cvsWidth = canvas.width;
  this.params.cvsHeight = canvas.height;

  //Currently selected dot.  x/y -1 if none selected
  this.currentDot = (function() {
    var x = -1;
    var y = -1;

    return {
      getX: function() {return x;},
      getY: function() {return y;},
      isSet: function() {return x>=0;},
      clear: function() {x=-1; y=-1},
      setXY: function(x1,y1) {x = x1; y = y1;},
      toString: function() {return "X: " + x + ", Y: " + y;}
    }
  }());
  
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
    this.handleTap(e.pageX, e.pageY);
  },

  handleTap: function(x,y) {
    var dotCoord = this.xyToDot(x,y);
    console.log("In dots: " + dotCoord.x + ", " + dotCoord.y);
    var dotCenter = this.dotToXY(dotCoord.x, dotCoord.y);
    if(this.currentDot.isSet()) {
      //Check for clicking on same dot or one not adjacent (unset)
      var xDiff = Math.abs(this.currentDot.getX()-dotCoord.x);
      var yDiff = Math.abs(this.currentDot.getY()-dotCoord.y);
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
      //Yippie!! We have a line to draw
      this.drawLine({x: this.currentDot.getX(), y:this.currentDot.getY()}, dotCoord, this.params.dotInnerColor);
      var oldDotCenter = this.dotToXY(this.currentDot.getX(), this.currentDot.getY());
      this.drawDot(oldDotCenter.x, oldDotCenter.y, this.params.dotInnerColor, this.params.dotOuterColor);
      this.currentDot.clear();
    }
    else {
      //Make sure there are possible connections to this dot still available
      var canHighlight = false;
      //Check horizontal, rtl first
      if((dotCoord.x > 0) && !this.horLines[dotCoord.x-1][dotCoord.y]) {
        canHighlight = true;
      }
      if((dotCoord.y < this.horLines.length) && !this.horLines[dotCoord.x][dotCoord.y]) {
        canHighlight = true;
      }
      //Check vertical ttb first
      if((dotCoord.y > 0) && !this.verLines[dotCoord.x][dotCoord.y-1]) {
        canHighlight = true;
      }
      if((dotCoord.y > this.verLines[0].length) && !this.verLines[dotCoord.x][dotCoord.y]) {
        canHighlight = true;
      }
      if(canHighlight) {
        console.log("Set current dot");
        this.currentDot.setXY(dotCoord.x, dotCoord.y);
        this.drawDot(dotCenter.x, dotCenter.y, this.params.activeDotInnerColor, this.params.activeDotOuterColor);
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
    var numHorDots = Math.floor((params.cvsWidth-params.halfDotSep)/params.dotSep);
    var numVerDots = Math.floor((params.cvsHeight-params.halfDotSep)/params.dotSep);

    var loX = Math.floor((params.cvsWidth-params.halfDotSep)%params.dotSep);
    var loY = Math.floor((params.cvsHeight-params.halfDotSep)/params.dotSep);
    var smallest = loX>loY?loY:loX;
    if(smallest > numHorDots) {
      var xtra = Math.floor(smallest/numHorDots);
      console.log("Added " + xtra + " extra");
      params.dotSep+=xtra;
      params.halfDotSep = Math.floor(params.dotSep/2)
    }

    console.log("Game " + numHorDots + "x" + numVerDots + ", Leftover: " + loX + "x" + loY);

    //Create data structures
    this.horLines = this.createArrays(numHorDots-1, numVerDots-1, false);
    this.verLines = this.createArrays(numHorDots-1, numVerDots-1, false);


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

  xyToDot: function(x,y) {
    var params = this.params;
    x-=params.halfDotSep;
    y-=params.halfDotSep;
    x-=params.cvsOffsetX;
    y-=params.cvxOffsetY;

    xDot = Math.round(x/params.dotSep);
    yDot = Math.round(y/params.dotSep);

    return {
      x: xDot,
      y: yDot
    };
  },
  dotToXY: function(dotX,dotY) {
    x = this.params.halfDotSep + (dotX*this.params.dotSep);
    y = this.params.halfDotSep + (dotY*this.params.dotSep);

    return {
      x: x,
      y: y,
      toString: function() {
        return "X: " + x + ", Y: " + y;
      }
    };
  },

  drawDot: function(x,y, ic, oc) {
//    if(true) {return;}
    console.log("Draw dot: " + x + ", " + y + ", IC: " + ic);
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
//      console.log("First point: " + xy1.x + "," + xy1.y);
//      console.log("Second point: " + xy2.x + "," + xy2.y);      
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
