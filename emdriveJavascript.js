/**
 * Random Walk Simulation (Photon) - Three.js
 * @requires three.js and OrbitControls.js
 */
function RWS() {
    // members
    var inst = this;
    inst.dae;
    inst.loader;
    inst.scene;
    inst.camera;
    inst.controls;
    inst.renderer;
    inst.mesh;
    inst.simulation;
    
    // constants
    var STAR_COUNT = 1000;
    var EMDRIVEMINDISTANCE = 3000;
    var SUN_OPACITY = 8;
    var SUN_DENSITY = 1408;
    var SPEED_OF_LIGHT = 2.99 * Math.pow(10, 8);
    var SCALE_FACTOR = 100000;
    
    inst.initialize = function(autostart) {
        // initialize three.js
        inst.scene = new THREE.Scene();
        inst.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 12000);
        inst.renderer = new THREE.WebGLRenderer();
        inst.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(inst.renderer.domElement);
        inst.camera.position.z = 1100;
        inst.controls = new THREE.OrbitControls(inst.camera);
        inst.controls.damping = 0.2;

        // initialize mesh and render
        inst.loader = new THREE.ColladaLoader();
        inst.loader.load('EmDriveModel.dae', function ( collada ) { inst.dae = collada.inst.scene; inst.dae.scale.x = inst.dae.scale.y = inst.dae.scale.z = 25.0; inst.scene.add(inst.dae); inst.animate(); });
        inst.simulation = new Object();
        inst.simulation.isActive = true;
        inst.simulation.steps = 0;
        inst.simulation.startTime = new Date().getTime() / 1000;
        inst.simulation.l = 1 / (SUN_OPACITY * SUN_DENSITY);
        inst.initMesh();
        inst.displayHint();
        if (autostart || typeof autostart == 'undefined') inst.render();
    };
    
    inst.animate = function() {
        // Defined in the RequestAnimationFrame.js file, this function
        // means that the animate function is called upon timeout:
        requestAnimationFrame(animate);
        inst.render();
    }
    
    //-----------------------------Photon Movement and propagation--------------------------
    /**
     * Initialize Mesh Objects 
     */
    inst.initMesh = function() {
        inst.mesh = new Object(); 
        // photon
        var gPhoton = new THREE.SphereGeometry(5, 8, 6);
        var mPhoton = new THREE.MeshBasicMaterial({ color: 0x2E66FF });
        inst.mesh.photon = new THREE.Mesh(gPhoton, mPhoton);
        inst.scene.add(inst.mesh.photon);
        // random background stars
        for (var i=0; i < STAR_COUNT; i++) {
            var gStar = new THREE.SphereGeometry(6, 8, 6);
            var mStar = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
            var star = new THREE.Mesh(gStar, mStar);
            star.position.x = inst.rnd();
            star.position.y = inst.rnd();
            star.position.z = inst.rnd();
            // if the star is very close to the sun it will 
            // not be added to the scene
            if (inst.calc3dDistance(star) >= 0)
                inst.scene.add(star);
        }
    }

    /**
     * Process Simulation Frame
     *
     * This method proceeds one step of the simulation (60 steps will make 1 second on scene).
     */
    inst.processSimulation = function() {
        inst.simulation.steps++
        var oldVector = inst.getVector3(inst.mesh.photon); // get old position

        var pxl = inst.simulation.l * SCALE_FACTOR;
        var theta = 2 * Math.PI * Math.random();
        var phi = Math.PI - 2 * Math.PI * Math.random();
        inst.mesh.photon.position.x += pxl * Math.sin(phi) * Math.cos(theta);
        inst.mesh.photon.position.y += pxl * Math.sin(phi) * Math.sin(theta);
        inst.mesh.photon.position.z += pxl * Math.cos(phi);

        var newVector = inst.getVector3(inst.mesh.photon); // get new position
        inst.createLine(oldVector, newVector);

        dist = inst.calc3dDistance(inst.mesh.photon);
        if (dist > 0) {
            console.log('Simulation Ended'); // stop simulation and print data
            inst.simulation.isActive = false;
            inst.simulation.endTime = new Date().getTime() / 1000;
            inst.displayStats();
        }   
    };

    /**
     * Genera Random Number For Star Positioning
     * 
     * @return {Number}
     */
    inst.rnd = function() {
        return Math.floor((Math.random() * 10000) - 5000);
    };


    /**
     * Calculate 3D From Scene Center Point(0, 0, 0)
     * 
     * @param {THREE.Mesh} mesh 
     * @return {Number}
     */
    inst.calc3dDistance = function(mesh) {
        return Math.sqrt(Math.pow(mesh.position.x, 2) 
                + Math.pow(mesh.position.y, 2) + Math.pow(mesh.position.z, 2));
    };

    /**
     * Get a Vector3 Object From Mesh Position
     * 
     * @param {THREE.Mesh} mesh
     */
    inst.getVector3 = function(mesh) {
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
    inst.createLine = function(oldVector, newVector) {
        var gLine = new THREE.Geometry();
        gLine.vertices.push(oldVector);
        gLine.vertices.push(newVector);
        var mLine = new THREE.LineBasicMaterial({ color: 0xC93434, linewidth: 1, transparent: true, opacity: 0.9 });
        var line = new THREE.Line(gLine, mLine);
        inst.scene.add(line);
    };
   
  //-----------------------------Loop Program------------------------------------
    
     /**
     * Render Loop
     */
    inst.render = function() {
        requestAnimationFrame(inst.render);
        if (inst.simulation.isActive)
            inst.processSimulation();
            inst.updateStats();
        inst.renderer.render(inst.scene, inst.camera);
    };
    
    /**
     * Pause Simulation
     */
    inst.pause = function() {
        inst.simulation.isActive = false;
    };

    /**
     * Resume Simulation
     */
    inst.resume = function() {
        inst.simulation.isActive = true;
    };
    
  //-----------------------------Data Section------------------------------------  
    
    /**
     * Display Simulation Statistics
     *
     * This method is called when the photon reaces the surface
     * of the sun and it displays the simulation statistics (number
     * of steps, simulation time, photon real time in years etc ...)
     */
    inst.displayStats = function() {
        var html = 
            '<strong>Simulation Results</strong><br>' +
            'Duration: ' + Number(inst.simulation.endTime - inst.simulation.startTime).toFixed(2) + 's<br>' +
            'Total Steps: ' + inst.simulation.steps + '<br>' +
            'Escape Time: ' + Math.round(48.32 * inst.simulation.steps * inst.simulation.l / Math.pow(0, 2)) + ' Years';

        var div = document.createElement('div');
        div.innerHTML = html;
        document.getElementById('statistics').appendChild(div);
    };
    
    /**
     * Update Simulation Statistics
     *
     * This method is called when the simulation renders and it displays the simulation statistics
     */
    inst.updateStats = function() {
        var html = 
            '<strong>Simulation Results</strong><br>' +
            'Duration: ' + Number(inst.simulation.endTime - inst.simulation.startTime).toFixed(2) + 's<br>' +
            'Total Steps: ' + inst.simulation.steps + '<br>' +
            'Escape Time: ' + Math.round(48.32 * inst.simulation.steps * inst.simulation.l / Math.pow(0, 2)) + ' Years';
        document.getElementById('statistics').innerHTML = html;
    };
    
    /**
     * Display Viewport Hint
     */
    inst.displayHint = function() {
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
}