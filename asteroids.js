"use strict";
function asteroids() {
    const svg = document.getElementById("canvas");
    const life_text = document.getElementById("life");
    const g = new Elem(svg, 'g')
        .attr("transform", "translate(300 300)");
    const asteroid_array = new Array(0);
    const ship = new Elem(svg, 'polygon', g.elem)
        .attr("points", "-15,20 15,20 0,-20")
        .attr("style", "fill:white;stroke:white;stroke-width:1");
    const destroyAll = (asteroid, bullet) => {
        asteroid_array.splice(asteroid_array.indexOf(asteroid), 1);
        asteroid.remove();
        bullet.remove();
    };
    let life = 3;
    const angle = (e) => parseFloat(e.attr("transform").split("rotate")[1].split("(")[1].split(")")[0]);
    const radToDeg = (rad) => rad * 180 / Math.PI + 90;
    const canvasLeft = svg.getBoundingClientRect().left;
    const canvasRight = svg.getBoundingClientRect().right;
    const canvasTop = svg.getBoundingClientRect().top;
    const canvasBot = svg.getBoundingClientRect().bottom;
    const inBoundX = (e) => canvasLeft - 80 < transformMatrix(e).m41 && transformMatrix(e).m41 < canvasRight ? true : false;
    const inBoundY = (e) => canvasTop - 80 < transformMatrix(e).m42 && transformMatrix(e).m42 < canvasBot ? true : false;
    const CollideX = (elem, asteroid) => transformMatrix(elem).m41 > (transformMatrix(asteroid).m41 - parseFloat(asteroid.attr("r"))) &&
        transformMatrix(elem).m41 < (transformMatrix(asteroid).m41 + parseFloat(asteroid.attr("r"))) ? true : false;
    const CollideY = (elem, asteroid) => transformMatrix(elem).m42 > (transformMatrix(asteroid).m42 - parseFloat(asteroid.attr("r"))) &&
        transformMatrix(elem).m42 < (transformMatrix(asteroid).m42 + parseFloat(asteroid.attr("r"))) ? true : false;
    const transformMatrix = (e) => new WebKitCSSMatrix(window.getComputedStyle(e.elem).webkitTransform);
    Observable.fromEvent(svg, "mousemove")
        .map(({ clientX, clientY }) => ({
        lookx: clientX - canvasLeft,
        looky: clientY - canvasTop,
        x: transformMatrix(g).m41,
        y: transformMatrix(g).m42
    })).subscribe(({ lookx, looky, x, y }) => g.attr("transform", "translate(" + x + " " + y + ")" +
        "rotate(" + radToDeg(Math.atan2(looky - y, lookx - x)) + ")"));
    Observable.fromEvent(document, "keydown")
        .filter(event => event.code == "KeyW")
        .map(() => ({
        dx: transformMatrix(g).m41 + 9 * Math.cos((angle(g) - 90) * Math.PI / 180),
        dy: transformMatrix(g).m42 + 9 * Math.sin((angle(g) - 90) * Math.PI / 180),
    }))
        .subscribe(({ dx, dy }) => g.attr("transform", "translate(" + dx + " " + dy + ")" + "rotate(" + angle(g) + ")"));
    Observable.fromEvent(document, "keydown")
        .map(() => ({
        dy: transformMatrix(g).m42,
        top: svg.getBoundingClientRect().top - 92
    }))
        .filter(({ dy, top }) => dy < top)
        .map(() => ({
        dx: transformMatrix(g).m41,
        bottom: canvasBot - 70,
    }))
        .subscribe(({ dx, bottom }) => g.attr("transform", "translate(" + dx + " " + bottom + ")" + "rotate(" + angle(g) + ")"));
    Observable.fromEvent(document, "keydown")
        .map(() => ({
        dx: transformMatrix(g).m41,
        left: svg.getBoundingClientRect().left - 20
    }))
        .filter(({ dx, left }) => dx < left)
        .map(() => ({
        right: canvasRight,
        dy: transformMatrix(g).m42,
    }))
        .subscribe(({ right, dy }) => g.attr("transform", "translate(" + right + " " + dy + ")" + "rotate(" + angle(g) + ")"));
    Observable.fromEvent(document, "keydown")
        .map(() => ({
        dy: transformMatrix(g).m42,
        bottom: canvasBot - 70
    }))
        .filter(({ dy, bottom }) => dy > bottom)
        .map(() => ({
        dx: transformMatrix(g).m41,
        top: canvasTop - 85,
    }))
        .subscribe(({ dx, top }) => g.attr("transform", "translate(" + dx + " " + top + ")" + "rotate(" + angle(g) + ")"));
    Observable.fromEvent(document, "keydown")
        .map(() => ({
        dx: transformMatrix(g).m41,
    }))
        .filter(({ dx }) => dx > canvasRight)
        .map(() => ({
        left: canvasLeft - 20,
        dy: transformMatrix(g).m42,
    }))
        .subscribe(({ left, dy }) => g.attr("transform", "translate(" + left + " " + dy + ")" + "rotate(" + angle(g) + ")"));
    Observable.fromEvent(svg, "mousedown")
        .filter(() => life > 0)
        .map(({ clientX, clientY }) => ({
        lookx: clientX - canvasLeft,
        looky: clientY - canvasTop,
        x: transformMatrix(g).m41,
        y: transformMatrix(g).m42
    }))
        .map(({ x, y, lookx, looky }) => ({
        bullet: new Elem(svg, 'rect')
            .attr("width", "2")
            .attr("height", "20")
            .attr("style", "fill:white;stroke:white;stroke-width:3")
            .attr("transform", "translate(" + x + " " + y + ")" + "rotate(" + radToDeg(Math.atan2(-(looky - y), -(lookx - x))) + ")")
    }))
        .flatMap(({ bullet }) => Observable.interval(20)
        .takeUntil(Observable.interval(1500))
        .map(() => ({
        direction: angle(bullet),
        vx: transformMatrix(bullet).m41 + 10 * (Math.cos((angle(bullet) + 90) * Math.PI / 180)),
        vy: transformMatrix(bullet).m42 + 10 * (Math.sin((angle(bullet) + 90) * Math.PI / 180))
    })).map(({ direction, vx, vy }) => inBoundX(bullet) && inBoundY(bullet) ? bullet.attr("transform", "translate(" + vx + " " + vy + ")" + "rotate(" + direction + ")") : bullet.remove())
        .map(() => asteroid_array.forEach((asteroid) => CollideX(bullet, asteroid) && CollideY(bullet, asteroid) ? destroyAll(asteroid, bullet) : undefined)))
        .subscribe(() => null);
    Observable.interval(1000)
        .filter(() => asteroid_array.length < 7)
        .map(() => ({
        direction: Math.random() * 360,
        x: Math.floor(Math.random() * canvasRight),
        y: Math.floor(Math.random() * canvasBot)
    }))
        .map(({ direction, x, y }) => ({
        asteroid: new Elem(svg, "circle")
            .attr("cx", "0")
            .attr("cy", "0")
            .attr("r", "50")
            .attr("style", "fill:white;stroke:white;stroke-width:3")
            .attr("transform", "translate(" + x + " " + y + ")" + "rotate(" + direction + ")")
            .attr("angle", direction)
    })).map(({ asteroid }) => ({
        asteroid: asteroid,
    })).map(({ asteroid }) => asteroid_array.push(asteroid))
        .subscribe(() => null);
    Observable.interval(30)
        .flatMap(() => Observable.fromArray(asteroid_array)
        .map((asteroid) => ({
        direction: parseFloat(asteroid.attr("angle")),
        vx: transformMatrix(asteroid).m41 + 6 * (Math.cos((parseFloat(asteroid.attr("angle")) + 90) * Math.PI / 180)),
        vy: transformMatrix(asteroid).m42 + 6 * (Math.sin((parseFloat(asteroid.attr("angle")) + 90) * Math.PI / 180)),
        asteroid: asteroid
    }))
        .map(({ asteroid, direction, vx, vy }) => asteroid.attr("transform", "translate(" + vx + " " + vy + ")" + "rotate(" + direction + ")").attr("angle", direction)))
        .subscribe(() => null);
    Observable.interval(100)
        .flatMap(() => Observable.fromArray(asteroid_array)
        .map((asteroid) => transformMatrix(asteroid).m42 < canvasTop - 120 ? asteroid.attr("transform", "translate(" + transformMatrix(asteroid).m41 + " " + canvasBot + ")") : undefined))
        .subscribe(() => null);
    Observable.interval(100)
        .flatMap(() => Observable.fromArray(asteroid_array)
        .map((asteroid) => transformMatrix(asteroid).m42 > canvasBot ? asteroid.attr("transform", "translate(" + transformMatrix(asteroid).m41 + " " + (canvasTop - 80) + ")") : undefined))
        .subscribe(() => null);
    Observable.interval(100)
        .flatMap(() => Observable.fromArray(asteroid_array)
        .map((asteroid) => transformMatrix(asteroid).m41 < canvasLeft - 120 ? asteroid.attr("transform", "translate(" + canvasRight + " " + transformMatrix(asteroid).m42 + ")") : undefined))
        .subscribe(() => null);
    Observable.interval(100)
        .flatMap(() => Observable.fromArray(asteroid_array)
        .map((asteroid) => transformMatrix(asteroid).m41 > canvasRight + 70 ? asteroid.attr("transform", "translate(" + (canvasLeft - 80) + " " + transformMatrix(asteroid).m42 + ")") : undefined))
        .subscribe(() => null);
    Observable.interval(350)
        .filter(() => life > 0)
        .map(() => asteroid_array.forEach((asteroid) => CollideX(g, asteroid) && CollideY(g, asteroid) ? (life -= 1, g.attr("transform", "translate(" + 300 + " " + 300 + ")")) : undefined))
        .map(() => (life_text.innerHTML = "LIFE: " + life))
        .map(() => life == 0 ? (g.remove(), life_text.innerHTML = "GAME OVER") : undefined)
        .subscribe(() => null);
}
if (typeof window != 'undefined')
    window.onload = () => {
        asteroids();
    };
//# sourceMappingURL=asteroids.js.map