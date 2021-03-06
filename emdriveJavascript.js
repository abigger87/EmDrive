var inst = this;
var dae;
var object;
var scene;
var camera;
var controls;
var renderer;
var mesh;
var simulation;
var scene;
var mesh; 
var intersects;
var intersects2;
var intersectionpoint;
var coordinate;
var faceUp;
var faceDown;
var dist = 20;
var dist2 = 20;
var oldvector;
var x = 20;
var y = 0;
var z = 0;
var point;
//https://threejs.org/docs/#Reference/Core/Raycaster
//https://threejs.org/docs/api/core/Raycaster.html
var raycaster = new THREE.Raycaster();
var raycaster2 = new THREE.Raycaster();
var objects = [];

// constants
var STAR_COUNT = 1000;
var EMDRIVEMINDISTANCE = 3000;
var SUN_OPACITY = 8;
var STAR_MIN_DISTANCE = 3000;
var SUN_DENSITY = 1408;
var SPEED_OF_LIGHT = 2.99 * Math.pow(10, 8);
var SCALE_FACTOR = 100000;

function init() {
   // initialize three.js
   scene = new THREE.Scene();
   camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 12000);
   renderer = new THREE.WebGLRenderer();
   renderer.setSize(window.innerWidth, window.innerHeight);
   document.body.appendChild(renderer.domElement);
   camera.position.z = 1100;
   controls = new THREE.OrbitControls(camera);
   controls.damping = 0.2;
   scene.add(camera);
   //scene.add(dae);
   // initialize mesh and render
   simulation = new Object();
   simulation.isActive = true;
   simulation.steps = 0;
   simulation.startTime = new Date().getTime() / 1000;
   simulation.l = 1 / (SUN_OPACITY * SUN_DENSITY);
   initMesh();
   displayStats();
   displayHint();
   animate();
};
    
function animate() {
   // Defined in the RequestAnimationFrame.js file, this function
   // means that the animate function is called upon timeout:
   requestAnimationFrame(animate);
   //raycaster.set(mesh.photon.position, oldvector);
   render();
}
    
/**
* Initialize Mesh Objects 
*/

function initMesh() {
    // photon
    mesh = new Object();
    var gPhoton = new THREE.SphereGeometry(5, 8, 6);
    var mPhoton = new THREE.MeshBasicMaterial({ color: 0x2E66FF });
    mesh.photon = new THREE.Mesh(gPhoton, mPhoton);
    mesh.photon.position.x = 75;//13.97; //half of length of base
    mesh.photon.position.y = -8.001;
    mesh.photon.position.z = 0;	
    scene.add(mesh.photon);
    oldvector = getVector3(mesh.photon);
	
    // random background stars
    for (var i=0; i < STAR_COUNT; i++) {
        var gStar = new THREE.SphereGeometry(6, 8, 6);
        var mStar = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        var star = new THREE.Mesh(gStar, mStar);
        star.position.x = rnd();
        star.position.y = rnd();
        star.position.z = rnd();
        // if the star is very close to the sun it will 
        // not be added to the scene
        if (calc3dDistance(star) >= STAR_MIN_DISTANCE)
            scene.add(star);
    }
    //http://stackoverflow.com/questions/22114224/three-js-raycasting-obj
	var manager = new THREE.LoadingManager();
	var loader = new THREE.OBJLoader(manager);
	loader.load('EmDriveModel.obj', function(object) {
	      object.traverse( function ( child ) {
		   if ( child instanceof THREE.Mesh ) {
			 console.log("instance");
			 child.geometry.computeFaceNormals();
			 child.material = new THREE.MeshBasicMaterial( { color: 0xCC9933, depthWrite: false, transparent: true, opacity: 0.5} );
			 child.material.side = THREE.DoubleSided;
		   }

	      } );
	      objects.push(object);
	      object.scale.x = object.scale.y = object.scale.z = 5; 
	      scene.add(object);
	});
    var raycasterUp = new THREE.Raycaster();
	raycasterUp.set(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 20, 0));
	var intersectsUp = raycasterUp.intersectObjects(objects, true);
	//faceUp = intersectsUp[0].face;
    var raycasterDown = new THREE.Raycaster();
	raycasterDown.set(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -20, 0));
	var intersectsDown = raycasterDown.intersectObjects(objects, true);
	//faceDown = intersectsDown[0].face;
}

//-----------------------------Photon Movement and propagation-------------------------------------------------------------

/**
* Process Simulation Frame
*
* This method proceeds one step of the simulation (60 steps will make 1 second on scene).
*/
function processSimulation() {
        simulation.steps++;
	console.log("1processSimulation");
	Intersection();
	if(dist > 21){
	    //move photons
	    oldvector = getVector3(mesh.photon);
	    mesh.photon.position.x += x;
            mesh.photon.position.y += y;
            mesh.photon.position.z += z;
	    var newVector = getVector3(mesh.photon); // get new position
            createLine(oldvector, newVector);
	}
	else {
	    //reset x,y,z values
	    //move photon
	    oldvector = getVector3(mesh.photon);
	    mesh.photon.position = intersectionpoint;
	    createLine(oldvector, newVector);
	    oldvector = getVector3(mesh.photon);
	    Intersection();
	    if(dist > 21)
	    {
	        mesh.photon.position.x += x;
            	mesh.photon.position.y += y;
            	mesh.photon.position.z += z;
		createLine(oldvector, newVector);
	    }
	    else if(dist == -1) {
		mesh.photon.position.x += x;
            	mesh.photon.position.y += y;
            	mesh.photon.position.z += z;
	    }
	    else{
		oldvector = getVector3(mesh.photon);
	    	mesh.photon.position = intersectionpoint;
	    	createLine(oldvector, newVector);
		oldvector = getVector3(mesh.photon);
		mesh.photon.position.x += x;
            	mesh.photon.position.y += y;
            	mesh.photon.position.z += z;
	    }
		
	    //test for corner condition
	}
	coordinate = 'X:' + mesh.photon.position.x + ' Y:' + mesh.photon.position.y + ' Z:' + mesh.photon.position.z;
        dist = calc3dDistance(mesh.photon);
    };

    /**
     * Calculate Intersection with emdrive or not
     *https://gist.github.com/nickjanssen/de388ae1090a16bb43ce
     */
function Intersection(){
	console.log("2 Intersection Function Called");
	console.log(oldvector);
	raycaster.set(mesh.photon.position, oldvector);
	intersects = raycaster.intersectObjects(objects, true);
	if(intersects.length > 0){
		console.log("3 intersects.length > 0");
	        //dist = intersects[0].distance;
		//intersectionpoint = intersects[0].point;
		if((intersects[0].face == faceUp) || (intersects[0].face == faceDown)){
		    raycaster2.set(mesh.photon.position, new THREE.Vector3(0, 0, oldvector.y));
		    intersects2 = raycaster2.intersectObjects(objects, true);
		    //dist2 = intersects2[0].distance;
		    y = -y;
		}
		else{
		    raycaster2.set(mesh.photon.position, new THREE.Vector3(oldvector.x, oldvector.z, 0));
		    intersects2 = raycaster2.intersectObjects(objects, true);
		    //dist2 = intersects2[0].distance;
		    x = -x;
		    z = -z;
		}
	}
	else{
	    x = -x;
	    y = -y;
	    z = -z;
	    dist = -1;
	}
}

    /**
     * Calculate 3D From Scene Center Point(0, 0, 0)
     * 
     * @param {THREE.Mesh} mesh 
     * @return {Number}
     */
function calc3dDistance(mesh) {
        return Math.sqrt(Math.pow(mesh.position.x, 2) 
                + Math.pow(mesh.position.y, 2) + Math.pow(mesh.position.z, 2));
    };

    /**
     * Get a Vector3 Object From Mesh Position
     * 
     * @param {THREE.Mesh} mesh
     */
function getVector3(mesh) {
        return new THREE.Vector3(
            mesh.position.x,
            mesh.position.y,
            mesh.position.z
        );
    };

    /**
     * Create new line in order to display for the 
     * trajectory of the photon.
     * 
     * @param {THREE.Vector3} oldVector 
     * @param {THREE.Vector3} newVector 
     */
function createLine(oldVector, newVector) {
        var gLine = new THREE.Geometry();
        gLine.vertices.push(oldVector);
        gLine.vertices.push(newVector);
        var mLine = new THREE.LineBasicMaterial({ color: 0xC93434, linewidth: 1, transparent: true, opacity: 0.9 });
        var line = new THREE.Line(gLine, mLine);
        scene.add(line);
    };
   
  //-----------------------------Loop Program------------------------------------------------------------------------------
    
     /**
     * Render Loop
     */
function render() {
	requestAnimationFrame(render);
	if (simulation.isActive) {
		coordinate = processSimulation();
		var command = '<p style="color:purple;">Photon Moved</p>';
		updateStats(document.getElementById('statistics').innerHTML, command, coordinate);
	}
	setTimeout(render, 5000);
	renderer.render(scene, camera); 
    };
    
    /**
     * Pause Simulation
     */
    function pause() {
        simulation.isActive = false;
	displayStats();
	console.log('Simulation Ended');
    };

    /**
     * Resume Simulation
     */
    function resume() {
	init();
    };
    

  //-----------------------------Minor Functions--------------------------------------------------------------------------

    /**
     * Genera Random Number For Star Positioning
     * 
     * @return {Number}
     */
function rnd() {
        return Math.floor((Math.random() * 10000) - 5000);
    };
  //-----------------------------Data Section------------------------------------------------------------------------------  
    
    /**
     * Display Simulation Statistics
     *
     * This method is called when the photon reaces the surface
     * of the sun and it displays the simulation statistics (number
     * of steps, simulation time, photon real time in years etc ...)
     */
    function displayStats() {
        var html = '<p style="color:yellow;">Scene Created</p>' + '<p style="color:purple;">Photon Created</p>' + '<p style="color:green;">EmDrive Model Loaded</p>' + '<p style="color:white;">Press Start To Begin</p>';
        var div = document.createElement('div');
        div.innerHTML = html;
        document.getElementById('statistics').appendChild(div);
    };
    
    /**
     * Update Simulation Statistics
     *
     * This method is called when the simulation renders and it displays the simulation statistics
     */
    function updateStats(html, command, text) {
        var html2 = command + text + html;
        document.getElementById('statistics').innerHTML = html2;
    };
    
    /**
     * Display Viewport Hint
     */
    function displayHint() {
        var html = '<strong>Use your mouse to change the view.</strong>';
        var div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.top = '10px';
        div.style.right = '10px';
        div.style.padding = '10px';
        div.style.font = '11px arial, helvetica';
        div.style.color= '#FFF';
        div.innerHTML = html;
        document.body.appendChild(div);
    };

