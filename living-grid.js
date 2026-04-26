(function () {
  var canvas = document.querySelector(".living-grid");

  if (!canvas) {
    return;
  }

  var ctx = canvas.getContext("2d", { alpha: true });
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var nodes = [];
  var columns = 0;
  var rows = 0;
  var spacing = 86;
  var width = 0;
  var height = 0;
  var dpr = 1;
  var frameId = 0;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    canvas.width = Math.ceil(width * dpr);
    canvas.height = Math.ceil(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    spacing = width < 720 ? 60 : 78;
    buildNodes();
    draw(reducedMotion.matches ? 900 : performance.now());
  }

  function buildNodes() {
    nodes = [];
    columns = Math.ceil(width / spacing) + 3;
    rows = Math.ceil(height / spacing) + 3;

    for (var row = 0; row < rows; row += 1) {
      for (var column = 0; column < columns; column += 1) {
        var stagger = row % 2 ? spacing * 0.5 : 0;
        nodes.push({
          column: column,
          row: row,
          x: column * spacing - spacing + stagger,
          y: row * spacing - spacing,
          phase: (column * 0.72) + (row * 0.47),
          depth: 0.45 + (((column + row) % 5) * 0.1)
        });
      }
    }
  }

  function project(node, time) {
    var wave = Math.sin(time * 0.00082 + node.phase);
    var cross = Math.cos(time * 0.00056 + node.phase * 1.3);
    var horizon = (node.y / Math.max(height, 1)) - 0.35;
    var perspective = 1 + (horizon * 0.08);

    return {
      x: (node.x * perspective) + (wave * 13 * node.depth),
      y: node.y + (cross * 20 * node.depth) + (wave * 8),
      pulse: (wave + 1) * 0.5
    };
  }

  function lineAlpha(a, b) {
    var midpointY = (a.y + b.y) * 0.5;
    var lowerBoost = Math.max(0, midpointY / Math.max(height, 1) - 0.35);
    return 0.12 + lowerBoost * 0.08;
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;

    var projected = nodes.map(function (node) {
      return project(node, time);
    });

    function pointFor(column, row) {
      if (column < 0 || row < 0 || column >= columns || row >= rows) {
        return null;
      }

      return projected[(row * columns) + column];
    }

    for (var row = 0; row < rows - 1; row += 1) {
      for (var column = 0; column < columns - 1; column += 1) {
        var p1 = pointFor(column, row);
        var p2 = pointFor(column + 1, row);
        var p3 = pointFor(column, row + 1);
        var p4 = pointFor(column + 1, row + 1);

        if (!p1 || !p2 || !p3 || !p4) {
          continue;
        }

        if ((row + column) % 3 === 0) {
          drawFacet(p1, p2, p4, time);
        }

        drawLine(p1, p2);
        drawLine(p1, p3);

        if ((row + column) % 2 === 0) {
          drawLine(p1, p4);
        }
      }
    }

    projected.forEach(function (point, index) {
      var radius = 1.35 + point.pulse * 1.1;
      var alpha = 0.22 + point.pulse * 0.12;

      if (index % 4 === 0) {
        alpha *= 1.35;
      }

      ctx.beginPath();
      ctx.fillStyle = "rgba(91, 44, 255, " + alpha.toFixed(3) + ")";
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawLine(a, b) {
    var alpha = lineAlpha(a, b);

    if (alpha <= 0.01) {
      return;
    }

    ctx.beginPath();
    ctx.strokeStyle = "rgba(91, 44, 255, " + alpha.toFixed(3) + ")";
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  function drawFacet(a, b, c, time) {
    var alpha = 0.034 + Math.sin(time * 0.00045 + a.x * 0.01) * 0.014;

    if (alpha <= 0.004) {
      return;
    }

    ctx.beginPath();
    ctx.fillStyle = "rgba(91, 44, 255, " + alpha.toFixed(3) + ")";
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.closePath();
    ctx.fill();
  }

  function tick(time) {
    draw(time);
    frameId = window.requestAnimationFrame(tick);
  }

  function start() {
    window.cancelAnimationFrame(frameId);

    if (reducedMotion.matches || document.hidden) {
      draw(900);
      return;
    }

    frameId = window.requestAnimationFrame(tick);
  }

  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", start);

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", start);
  }

  resize();
  start();
}());
