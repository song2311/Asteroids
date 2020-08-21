// FIT2102 2019 Assignment 1
// https://docs.google.com/document/d/1Gr-M6LTU-tfm4yabqZWJYg-zTjEVqHKKTCvePGCYsUA/edit?usp=sharing

function asteroids() {
  // Inside this function you will use the classes and functions 
  // defined in svgelement.ts and observable.ts
  // to add visuals to the svg element in asteroids.html, animate them, and make them interactive.
  // Study and complete the Observable tasks in the week 4 tutorial worksheet first to get ideas.

  // You will be marked on your functional programming style
  // as well as the functionality that you implement.
  // Document your code!  
  // Explain which ideas you have used ideas from the lectures to 
  // create reusable, generic functions.
  
  //Documentation of observables can be found on top of each observable.

  const svg = document.getElementById("canvas")!;
  const life_text= document.getElementById("life")!;
  // make a group for the spaceship and a transform to move it and rotate it
  // to animate the spaceship you will update the transform property
  const g = new Elem(svg,'g')
    .attr("transform","translate(300 300)")  
  const asteroid_array=new Array<Elem>(0)
  // create a polygon shape for the space ship as a child of the transform group
  const ship = new Elem(svg, 'polygon', g.elem) 
    .attr("points","-15,20 15,20 0,-20")
    .attr("style","fill:white;stroke:white;stroke-width:1")
  //function to destroy both asteroid and bullet, called when collision occurs
  const destroyAll=(asteroid:Elem,bullet:Elem)=>{
    asteroid_array.splice(asteroid_array.indexOf(asteroid),1)
    asteroid.remove()
    bullet.remove()
  }
  
  let life=3;
  const angle=(e:Elem)=>parseFloat(e.attr("transform").split("rotate")[1].split("(")[1].split(")")[0])
  // Convert radians to degrees. +90deg at the end because the ship to ensure correct conversion
  const radToDeg = (rad:number) => rad * 180 / Math.PI + 90;
  const canvasLeft=svg.getBoundingClientRect().left;
  const canvasRight=svg.getBoundingClientRect().right;
  const canvasTop=svg.getBoundingClientRect().top;
  const canvasBot=svg.getBoundingClientRect().bottom;
  //function to detect whether an element is out of bounds
  const inBoundX=(e:Elem)=>canvasLeft-80<transformMatrix(e).m41&&transformMatrix(e).m41<canvasRight?true:false
  //function to detect whether an element is out of bounds
  const inBoundY=(e:Elem)=>canvasTop-80<transformMatrix(e).m42&&transformMatrix(e).m42<canvasBot?true:false
  //function to check ship and bullet collision with the asteroid 
  const CollideX=(elem:Elem,asteroid:Elem)=>transformMatrix(elem).m41>(transformMatrix(asteroid).m41-parseFloat(asteroid.attr("r")))&&
                                                    transformMatrix(elem).m41<(transformMatrix(asteroid).m41+parseFloat(asteroid.attr("r")))?true:false
  //function to check ship and bullet collision with the asteroid 
  const CollideY=(elem:Elem,asteroid:Elem)=>transformMatrix(elem).m42>(transformMatrix(asteroid).m42-parseFloat(asteroid.attr("r")))&&
                                                    transformMatrix(elem).m42<(transformMatrix(asteroid).m42+parseFloat(asteroid.attr("r")))?true:false
  
  //function to get the x and y coordinates of elements
  const transformMatrix = 
    (e:Elem) => new WebKitCSSMatrix(window.getComputedStyle(e.elem).webkitTransform)

  // Subscribe mousemove event on the svg canvas
  //Math.atan2 is used because it is the most common way of getting an object rotation in games
  Observable.fromEvent<MouseEvent>(svg, "mousemove")
    // Calculate current pointer position relative to the canvas
    .map(({clientX, clientY}) => ({
      lookx: clientX - canvasLeft,
      looky: clientY - canvasTop,
      x: transformMatrix(g).m41, // m41 is transformX in the Webkit CSS Matrix
      y: transformMatrix(g).m42  // m42 is transformY in the Webkit CSS Matrix
    })).subscribe(({lookx, looky, x, y}) => 
    // Used alot in games to get rotation in radians: Math.atan2(looky - y, lookx - x)
    g.attr("transform",
      "translate(" + x + " " + y + ")" +
      "rotate(" + radToDeg(Math.atan2(looky - y, lookx - x)) + ")"));
  
  //Observable to move the ship foward
  //w is used as movement button because it is the most common foward movement key in games
  Observable.fromEvent<KeyboardEvent>(document,"keydown")
    .filter(event =>event.code=="KeyW")
    //get x and y position of ship and calculate new position
    .map(()=>({
      dx: transformMatrix(g).m41+9*Math.cos((angle(g)-90)*Math.PI/180), // calculate x movement
      dy: transformMatrix(g).m42+9*Math.sin((angle(g)-90)*Math.PI/180), // calculate y movement
    }))
    .subscribe(({dx,dy})=>
    g.attr("transform",
    "translate(" + dx + " " + dy + ")"+"rotate("+angle(g)+")"));
  
  //Observable to detect if ship is out of bounds at top of the screen
  //Four observables instead of one is use to ensure all 4 sides are properly covered so that the ship wraps around the canvas
  Observable.fromEvent<KeyboardEvent>(document,"keydown")
  .map(()=>({
    dy: transformMatrix(g).m42,
    top:svg.getBoundingClientRect().top-92
  }))
  .filter(({dy,top})=>dy<top)//check if bullet smaller than top bound
  .map(()=>({
    dx: transformMatrix(g).m41, // m41 is transformX in the Webkit CSS Matrix,
    bottom: canvasBot-70, // get bottom position to translate ship to bottom
  }))
  .subscribe(({dx,bottom})=>
  g.attr("transform",
  "translate(" + dx + " " + bottom + ")" +"rotate("+angle(g)+")"));
  
  //Observable to detect if ship is out of bounds at left edge of screen
  Observable.fromEvent<KeyboardEvent>(document,"keydown")
  .map(()=>({
    dx: transformMatrix(g).m41,
    left:svg.getBoundingClientRect().left-20
  }))
 .filter(({dx,left})=>dx<left)//check if ship smaller than left bound
 .map(()=>({
    right: canvasRight, // get right position to translate ship to bottom
    dy: transformMatrix(g).m42,
  }))
  .subscribe(({right,dy})=>
  g.attr("transform",
  "translate(" + right + " " + dy + ")" +"rotate("+angle(g)+")"));

  //Observable to detect if ship is out of bounds at bottom of screen
  Observable.fromEvent<KeyboardEvent>(document,"keydown")
    .map(()=>({
      dy: transformMatrix(g).m42,
      bottom:canvasBot-70
    }))
   .filter(({dy,bottom})=>dy>bottom)//check if ship greater than bottom bound
   .map(()=>({
      dx: transformMatrix(g).m41, // m41 is transformX in the Webkit CSS Matrix,
      top: canvasTop-85, // get bottom position to translate ship to bottom
    }))
    .subscribe(({dx,top})=>
    g.attr("transform",
    "translate(" + dx + " " + top + ")" +"rotate("+angle(g)+")")); 
  
  //Observable to detect if ship is out of bounds at right edge of screen
  Observable.fromEvent<KeyboardEvent>(document,"keydown")
  .map(()=>({
    dx: transformMatrix(g).m41,
  }))
  .filter(({dx})=>dx>canvasRight)//check if ship greater than right bound
  .map(()=>({
    left: canvasLeft-20, // get right position to translate ship to bottom
    dy: transformMatrix(g).m42,
  }))
  .subscribe(({left,dy})=>
  g.attr("transform",
  "translate(" + left + " " + dy + ")" +"rotate("+angle(g)+")"));
  
  //mouse click observable to shoot bullets
  //bullet is no put into a group because every bullet moves in different direction and is destroyed when it hits an asteroid or goes out of bounds
  //Observable interval is used in conjunction with mouseevent to ensure all bullets keep moving even when mouse is not pressed down
  //mouse click observable to shoot bullets
  //bullet is no put into a group because every bullet moves in different direction and is destroyed when it hits an asteroid or goes out of bounds
  //Observable interval is used in conjunction with mouseevent to ensure all bullets keep moving even when mouse is not pressed down
  Observable.fromEvent<MouseEvent>(svg,"mousedown")
  .filter(()=>life>0)
  .map(({clientX, clientY}) => ({
    lookx: clientX - canvasLeft,
    looky: clientY - canvasTop,
    x: transformMatrix(g).m41,
    y: transformMatrix(g).m42
  }))
  .map(({x,y,lookx,looky})=>({
  bullet:new Elem(svg, 'rect') //create new bullet object
    .attr("width","2")
    .attr("height","20")
    .attr("style","fill:white;stroke:white;stroke-width:3")
    .attr("transform","translate(" + x + " " + y + ")"+"rotate(" + radToDeg(Math.atan2(-(looky-y), -(lookx-x))) + ")")
  }))
  .flatMap(({bullet}) => Observable.interval(20)//move bullets every 20 milliseconds
  .takeUntil(Observable.interval(1500))//stop interval after 1.5 seconds which is enough for bullet to be destroyed
  .map(()=>({
     direction:angle(bullet),
     vx:transformMatrix(bullet).m41+10*(Math.cos((angle(bullet)+90)*Math.PI/180)),//calculate bullet movement
     vy:transformMatrix(bullet).m42+10*(Math.sin((angle(bullet)+90)*Math.PI/180))//calculate bullet movement
  })).map(({direction,vx,vy})=>inBoundX(bullet)&&inBoundY(bullet)? bullet.attr("transform",
  "translate(" + vx + " " + vy + ")" +"rotate("+direction+")"):bullet.remove())//move bullet if in bound, remove bullet otherwise
  .map(()=>asteroid_array.forEach((asteroid)=>CollideX(bullet,asteroid)&&CollideY(bullet,asteroid)?destroyAll(asteroid,bullet):undefined)))//destroy bullet and asteroid if there is a collision
  .subscribe(()=>null);

  
  //create new asteroid every second to prevent the map from having too much asteroids
  //limit the number of asteroids with filter method to prevent too many asteroids on the canvas at a given time.
  //circle is used for the shape of the asteroid so that the collision calculation is simpler. 
  Observable.interval(1000)
  .filter(()=>asteroid_array.length<7)//7 asteroids on canvas at any give time
  .map(()=>({
    direction:Math.random()*360,//set random direction for asteroid
    x:Math.floor(Math.random()*canvasRight),//set random x coordinate for asteroid
    y:Math.floor(Math.random()*canvasBot)//set random y coordinate for asteroid
  }))
  .map(({direction,x,y})=>({
    asteroid:new Elem(svg, "circle") //create new asteroid 
    .attr("cx","0")
    .attr("cy","0")
    .attr("r","50")
    .attr("style","fill:white;stroke:white;stroke-width:3")
    .attr("transform","translate(" + x + " " + y + ")"+"rotate(" +direction+")")
    .attr("angle",direction)
  })).map(({asteroid})=>({
    asteroid:asteroid,
  })).map(({asteroid})=>asteroid_array.push(asteroid))//asteroid into array
  .subscribe(()=>null)
  
  //move all asteroids on map
  //Observable fromArray is used so that all asteroids on the canvas are moved at the same time
  //30 milliseconds is used to ensure asteroids do not move too fast
  Observable.interval(30)
  .flatMap(()=>
  Observable.fromArray<Elem>(asteroid_array)//loop through every asteroid on the canvas
  .map((asteroid)=>({
    direction:parseFloat(asteroid.attr("angle")),
    vx:transformMatrix(asteroid).m41+6*(Math.cos((parseFloat(asteroid.attr("angle"))+90)*Math.PI/180)),//calculate horizontal movement
    vy:transformMatrix(asteroid).m42+6*(Math.sin((parseFloat(asteroid.attr("angle"))+90)*Math.PI/180)),//calculate vertical movement
    asteroid:asteroid
  }))
  .map(({asteroid,direction,vx,vy})=>asteroid.attr("transform",
  "translate(" + vx + " " + vy + ")" +"rotate("+direction+")").attr("angle",direction)))//move asteroid if in bound, destroy asteroid otherwise
  .subscribe(()=>null)
 
 //Four observables instead of one is use to ensure all 4 sides are properly covered
 //Observable to wrap asteroid around canvas
  Observable.interval(100)
  .flatMap(()=>
  Observable.fromArray<Elem>(asteroid_array)//loop through every asteroid on the canvas
  .map((asteroid:Elem)=>transformMatrix(asteroid).m42<canvasTop-120?asteroid.attr("transform",//check if asteroid out of bounds at top
  "translate(" + transformMatrix(asteroid).m41 + " " + canvasBot + ")"):undefined))
  .subscribe(()=>null)
  
  //Observable to wrap asteroid around canvas
  Observable.interval(100)
  .flatMap(()=>
  Observable.fromArray<Elem>(asteroid_array)//loop through every asteroid on the canvas
  .map((asteroid:Elem)=>transformMatrix(asteroid).m42>canvasBot?asteroid.attr("transform",//check if asteroid out of bounds at bottom
  "translate(" + transformMatrix(asteroid).m41 + " " + (canvasTop-80) + ")"):undefined))
  .subscribe(()=>null)
  
  //Observable to wrap asteroid around canvas
  Observable.interval(100)
  .flatMap(()=>
  Observable.fromArray<Elem>(asteroid_array)//loop through every asteroid on the canvas
  .map((asteroid:Elem)=>transformMatrix(asteroid).m41<canvasLeft-120?asteroid.attr("transform",//check if asteroid out of bounds at left
  "translate(" + canvasRight+ " " + transformMatrix(asteroid).m42+ ")"):undefined))
  .subscribe(()=>null)

  //Observable to wrap asteroid around canvas
  Observable.interval(100)
  .flatMap(()=>
  Observable.fromArray<Elem>(asteroid_array)//loop through every asteroid on the canvas
  .map((asteroid:Elem)=>transformMatrix(asteroid).m41>canvasRight+70?asteroid.attr("transform",//check if asteroid out of bounds at right
  "translate(" + (canvasLeft-80) + " " + transformMatrix(asteroid).m42+ ")"):undefined))
  .subscribe(()=>null)

  //observable to detect collision of asteroid and ship
  //350 milliseconds is used to ensure that the ship does not collide with the asteroid two times in a short period of time
  Observable.interval(350)
  .filter(()=>life>0)
  .map(()=>asteroid_array.forEach((asteroid:Elem)=>CollideX(g,asteroid)&&CollideY(g,asteroid)?(life-=1,g.attr("transform",
  "translate(" + 300 + " " + 300 + ")")):undefined))//if collision occurs, move ship back to spawn point and reduce life by 1
  .map(()=>(life_text.innerHTML="LIFE: "+life))//update html text that displays amount of lives
  .map(()=>life==0?(g.remove(),life_text.innerHTML="GAME OVER"):undefined)//if no lives left destroy ship
  .subscribe(()=>null)
}
   
// the following simply runs your asteroids function on window load.  Make sure to leave it in place.
if (typeof window != 'undefined')
  window.onload = ()=>{
    asteroids();
    
  }

 

 
