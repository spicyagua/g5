var EG5 = EG5 || {};

EG5.Game = function(canvas) {
  this.params = {
    dotSep: 50,
    dotRadius: 10
  };
  this.canvas = canvas;
  this.ctx = canvas.getContext("2d");
  this.params.halfDotSep = Math.floor(this.params.dotSep/2)
};

EG5.Game.prototype = {

  beginGame: function() {
    this.createGameboard();
  },

  createGameboard: function() {
    var params = this.params;
    var canvasWidth = this.canvas.width;
    var canvasHeight = this.canvas.height;

    //Calculate the # of horizontal and vertical dots
    var numHorDots = Math.floor((canvasWidth-params.halfDotSep)/params.dotSep);
    var numVerDots = Math.floor((canvasHeight-params.halfDotSep)/params.dotSep);

    console.log("Game " + numHorDots + "x" + numVerDots);

    var xLoc = params.halfDotSep;
    for(var i = 0; i<numHorDots; i++) {
      var yLoc = params.halfDotSep;
      for(var j = 0; j<numVerDots; j++) {
        this.drawDot(xLoc, yLoc);
        yLoc+=params.dotSep;
      }
      xLoc+=params.dotSep;
    }

  },

  drawDot: function(x,y) {
    var ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x, y, this.params.dotRadius, 2*Math.PI, false);
    var gradient = ctx.createRadialGradient(x, y, Math.floor(this.params.dotRadius*0.6), x, y, this.params.dotRadius);
    gradient.addColorStop(0, "rgba(255,255, 255, 1)");
    gradient.addColorStop(1, "rgba(220, 220, 220, 1)");
    ctx.fillStyle = gradient;
    ctx.fill();

  },

  foo: function() {
    console.log("Foo called");
  }
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

    //Debug
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0,0,canvas.width, canvas.height);
    ctx.beginPath();
    ctx.strokeStyle = "white"
    ctx.moveTo(0,0);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.moveTo(canvas.width, 0);
    ctx.lineTo(0,canvas.height);
    ctx.stroke();

    var game = new EG5.Game(canvas);
    game.beginGame();
    game.foo();

  };
  return {
    init: _init
  }
}());