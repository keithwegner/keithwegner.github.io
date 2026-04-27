(function () {
  var canvases = Array.prototype.slice.call(document.querySelectorAll(".living-grid, .section-living-grid"));

  if (!canvases.length) {
    return;
  }

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var instances = canvases.map(createGrid);

  function createGrid(canvas) {
    return {
      canvas: canvas,
      ctx: canvas.getContext("2d", { alpha: true }),
      inverted: canvas.getAttribute("data-living-grid-theme") === "inverted",
      section: canvas.classList.contains("section-living-grid"),
      nodes: [],
      columns: 0,
      rows: 0,
      spacing: 86,
      width: 0,
      height: 0,
      viewportWidth: 0,
      viewportHeight: 0,
      dpr: 1,
      bleed: 0,
      rect: null
    };
  }

  function resizeInstance(instance) {
    var canvas = instance.canvas;
    var rect = instance.section ? canvas.parentElement.getBoundingClientRect() : null;

    instance.viewportWidth = window.innerWidth;
    instance.viewportHeight = window.innerHeight;
    instance.bleed = instance.section ? 1 : 0;
    instance.width = instance.section ? Math.max(rect.width, instance.viewportWidth) : instance.viewportWidth;
    instance.height = instance.section ? Math.max(rect.height + (instance.bleed * 2), 1) : instance.viewportHeight;
    instance.dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    instance.rect = rect;
    canvas.width = Math.ceil(instance.width * instance.dpr);
    canvas.height = Math.ceil(instance.height * instance.dpr);
    canvas.style.top = instance.section ? "-" + instance.bleed + "px" : "";
    canvas.style.width = instance.width + "px";
    canvas.style.height = instance.height + "px";
    instance.ctx.setTransform(instance.dpr, 0, 0, instance.dpr, 0, 0);
    instance.spacing = instance.viewportWidth < 720 ? 60 : 78;
    buildNodes(instance);
  }

  function resize() {
    instances.forEach(function (instance) {
      resizeInstance(instance);
      draw(instance, reducedMotion.matches ? 900 : performance.now());
    });
  }

  function buildNodes(instance) {
    instance.nodes = [];
    instance.columns = Math.ceil(instance.viewportWidth / instance.spacing) + 3;
    instance.rows = Math.ceil(instance.viewportHeight / instance.spacing) + 3;

    for (var row = 0; row < instance.rows; row += 1) {
      for (var column = 0; column < instance.columns; column += 1) {
        var stagger = row % 2 ? instance.spacing * 0.5 : 0;
        instance.nodes.push({
          column: column,
          row: row,
          x: column * instance.spacing - instance.spacing + stagger,
          y: row * instance.spacing - instance.spacing,
          phase: (column * 0.72) + (row * 0.47),
          depth: 0.45 + (((column + row) % 5) * 0.1)
        });
      }
    }
  }

  function project(instance, node, time) {
    var wave = Math.sin(time * 0.00082 + node.phase);
    var cross = Math.cos(time * 0.00056 + node.phase * 1.3);
    var horizon = (node.y / Math.max(instance.viewportHeight, 1)) - 0.35;
    var perspective = 1 + (horizon * 0.08);
    var x = (node.x * perspective) + (wave * 13 * node.depth);
    var y = node.y + (cross * 20 * node.depth) + (wave * 8);

    if (instance.section && instance.rect) {
      x -= instance.rect.left;
      y -= instance.rect.top - instance.bleed;
    }

    return {
      x: x,
      y: y,
      viewportY: instance.section ? y + instance.rect.top : y,
      pulse: (wave + 1) * 0.5
    };
  }

  function lineAlpha(instance, a, b) {
    var midpointY = (a.viewportY + b.viewportY) * 0.5;
    var lowerBoost = Math.max(0, midpointY / Math.max(instance.viewportHeight, 1) - 0.35);
    var base = instance.inverted ? 0.16 : 0.12;
    var boost = instance.inverted ? 0.1 : 0.08;

    return base + lowerBoost * boost;
  }

  function color(instance, alpha) {
    var channel = instance.inverted ? "255, 255, 255" : "91, 44, 255";

    return "rgba(" + channel + ", " + alpha.toFixed(3) + ")";
  }

  function draw(instance, time) {
    var ctx = instance.ctx;

    ctx.clearRect(0, 0, instance.width, instance.height);
    ctx.lineWidth = 1;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (instance.section) {
      instance.rect = instance.canvas.parentElement.getBoundingClientRect();
    }

    var projected = instance.nodes.map(function (node) {
      return project(instance, node, time);
    });

    function pointFor(column, row) {
      if (column < 0 || row < 0 || column >= instance.columns || row >= instance.rows) {
        return null;
      }

      return projected[(row * instance.columns) + column];
    }

    for (var row = 0; row < instance.rows - 1; row += 1) {
      for (var column = 0; column < instance.columns - 1; column += 1) {
        var p1 = pointFor(column, row);
        var p2 = pointFor(column + 1, row);
        var p3 = pointFor(column, row + 1);
        var p4 = pointFor(column + 1, row + 1);

        if (!p1 || !p2 || !p3 || !p4) {
          continue;
        }

        if ((row + column) % 3 === 0) {
          drawFacet(instance, p1, p2, p4, time);
        }

        drawLine(instance, p1, p2);
        drawLine(instance, p1, p3);

        if ((row + column) % 2 === 0) {
          drawLine(instance, p1, p4);
        }
      }
    }

    projected.forEach(function (point, index) {
      var radius = 1.35 + point.pulse * 1.1;
      var alpha = instance.inverted ? 0.26 + point.pulse * 0.14 : 0.22 + point.pulse * 0.12;

      if (index % 4 === 0) {
        alpha *= instance.inverted ? 1.2 : 1.35;
      }

      ctx.beginPath();
      ctx.fillStyle = color(instance, alpha);
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawLine(instance, a, b) {
    var alpha = lineAlpha(instance, a, b);

    if (alpha <= 0.01) {
      return;
    }

    instance.ctx.beginPath();
    instance.ctx.strokeStyle = color(instance, alpha);
    instance.ctx.moveTo(a.x, a.y);
    instance.ctx.lineTo(b.x, b.y);
    instance.ctx.stroke();
  }

  function drawFacet(instance, a, b, c, time) {
    var base = instance.inverted ? 0.045 : 0.034;
    var wave = instance.inverted ? 0.018 : 0.014;
    var alpha = base + Math.sin(time * 0.00045 + a.x * 0.01) * wave;

    if (alpha <= 0.004) {
      return;
    }

    instance.ctx.beginPath();
    instance.ctx.fillStyle = color(instance, alpha);
    instance.ctx.moveTo(a.x, a.y);
    instance.ctx.lineTo(b.x, b.y);
    instance.ctx.lineTo(c.x, c.y);
    instance.ctx.closePath();
    instance.ctx.fill();
  }

  var frameId = 0;

  function tick(time) {
    instances.forEach(function (instance) {
      draw(instance, time);
    });
    frameId = window.requestAnimationFrame(tick);
  }

  function drawStatic() {
    instances.forEach(function (instance) {
      draw(instance, 900);
    });
  }

  function start() {
    window.cancelAnimationFrame(frameId);

    if (reducedMotion.matches || document.hidden) {
      drawStatic();
      return;
    }

    frameId = window.requestAnimationFrame(tick);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("scroll", function () {
    if (reducedMotion.matches) {
      drawStatic();
    }
  }, { passive: true });
  document.addEventListener("visibilitychange", start);

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", start);
  }

  resize();
  start();
}());
