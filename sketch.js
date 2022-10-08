/*//////////////////////////////////////////////////////////
Original code by David Gail Smith and Aldanis Vigo, October 2022
*/ //////////////////////////////////////////////////////////

let container,
    scene,
    camera,
    renderer,
    ambLt,
    dirLt,
    spotLt,
    geometry,
    material,
    mesh,
    controls;

// shader uniforms
// let uniforms;
// let timeStart;

let models = [];
let aTeam = [];
let bTeam = [];
let board = [];

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    setCamera();
    setLights();
    buildRenderer();
    container = renderer.domElement;
    document.body.appendChild(container);
 // loadAssets();  //  to load a 3d model obj from file or ipfs link
  loadAssets();
      // load glb 3m model
 //   buildIt();
    buildBoard();
    buildPieces();
    addOrbitControls();
    window.addEventListener("resize", onWindowResize);
    console.log(scene);
}

function animate() {  // animation loop
    requestAnimationFrame(animate);
    render();
}

function render() {  // update and render scene each frame
    updateScene();
    renderer.render(scene, camera);
}

function updateScene() {  // scene updates per frame
    // put any scene updates here (rotation of objects for example, etc)

    // update orbit controls (or other)
    controls.update();

    // update uniforms if using a shader
    // uniforms['u_time'].value = (timeStart - new Date().getTime())/1000;

}

function setCamera() {
    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        1,
        1000
    );
    camera.position.x = 5;
    camera.position.y = 3;
    camera.position.z = 5;
    scene.add(camera);
}

function setLights() {
    ambLt = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambLt);
    dirLt = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLt.position.set(0, 15, 0);
    scene.add(dirLt);
    spotLt = new THREE.SpotLight(0xffffff, 0.5);
    spotLt.position.set(5, 1, 2);
    spotLt.decay = 2.0;
    scene.add(spotLt);
}

function buildRenderer() {
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight, true);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
}

function onWindowResize() {  // be sure to resive others along with window
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function loadAssets() {  // load textures / OBJ models
    const loader = new THREE.OBJLoader();
    let material;
    let cubeColor = new THREE.Color(Math.random() * 255, Math.random() * 255, Math.random() * 255);
    // loader.load('https://ipfs.io/ipfs/bafybeihsxmq6fqvjzew7sje5fg5ahtr3rytafzrrsdu3bkwuhbnsxvrcmm', function(object) {
    loader.load('./assets/modelsOBJ/rook.obj', function (object) {
        object.name = "chessBoard";
        object.position = new THREE.Vector3();
        object.position.x = 0;
        object.position.y = 0;
        object.position.z = 0;
        object.rotation.y = 0;
        
        // shader material
        material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader(),//loadedVertexShader,
            fragmentShader: fragmentShader(),//loadedFragmentShader,
            // vertexShader: vertexShader(),
            // fragmentShader: fragmentShader(),
        });
        
        // phong material
        // material = new THREE.MeshPhongMaterial({
        //     side: THREE.DoubleSide,
        //     color: cubeColor,
        //     metalness: 0.8,
        //     roughness: 0.2,
        // });
        
        object.material = material;
        scene.add(object);
//    console.log(object);
    }, function (xhr) {
//    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    }, function (error) {
//    console.log('An error happened with loading:' + error);
    });
}

function loadAssets() {
    material = new THREE.MeshPhongMaterial({
        side: THREE.DoubleSide,
        color: new THREE.Color(.7, .7, .7),
        roughness: 0.2,
    });
    let order = ["pawn", "rook", "bishop", "knight", "queen", "king"];
    for (let i = 0; i < order.length; i ++) {
        let model;
        let url = "./assets/modelsGLB/" + order[i] + ".glb";
        loadSingleGLTFAsset(url).then (gltf => {
            model = gltf.scene;
            model.position.set(0, 0, i*2);
//   gltf.scene.scale.set(0.1, 0.1, 0.1);
  //          scene.add(model);
            model.traverse(function (object) {
                if (object.isMesh) {
                    object.castShadow = true;
                    // non texture
                    object.material = material;
                    // texture
//                object.material.map = texture;
                    console.log("the model - " + model);
                    console.log("the object - " + object);
                    models.push(model);
                }
            });
        }).then(  () => {         console.log("models- " + models); buildPieces(); scene.add(models[0]);}
    );
    }

}

function loadSingleGLTFAsset(url) {  // load GLB model(s)
   // textureLoader = new THREE.TextureLoader();

    // let texture;
    // texture = textureLoader.load('./assets/textures/fire.png');

    // shader material
    // material = new THREE.ShaderMaterial({
    //     uniforms: uniforms,
    //     vertexShader: vertexShader(),//loadedVertexShader,
    //     fragmentShader: fragmentShader(),//loadedFragmentShader,
    //     // vertexShader: vertexShader(),
    //     // fragmentShader: fragmentShader(),
    // });

    // phong material
//    material = new THREE.MeshPhongMaterial({
//        side: THREE.DoubleSide,
 //       color: new THREE.Color(.7, .7, .7),
//        roughness: 0.2,
//    });

//    let order = ["pawn", "rook", "bishop", "knight", "queen", "king"];
    return new Promise(resolve => {
        new THREE.GLTFLoader().load(url, resolve);
    });
}

function buildBoard() {
    let tempTilePositRef = {};
    let geom;
    let mat;
    let mesh;
    for (let i = 0; i < 64; i++) {
        tempTilePositRef = {x: ((i) % 8), y: Math.floor((i) / 8)};
        geom = new THREE.BoxGeometry(1.9,1.9,0.1);
        mat = new THREE.MeshPhongMaterial({
            color: "purple",
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
        });
        mesh = new THREE.Mesh(geom, mat);
        let posit = new THREE.Vector3(tempTilePositRef.x * 2 - 4, 0, tempTilePositRef.y *2 - 4);
        mesh.position.set(posit.x, posit.y, posit.z);
        mesh.rotateX(Math.PI/2);
        board.push({tempTilePositRef, mesh});
        scene.add(mesh);
    }
}

function buildPieces() {  // models array not poulating - fix glb asset loader
    console.log("All - " + models);
    let order = [1, 2, 3, 4, 5, 3, 2, 1, 0, 0, 0, 0 ,0 ,0 ,0 ,0];
    for (let i = 0; i < order.length; i++) {
        let temp1 = models[order[i]];
        let temp2 = models[order[i]];
        console.log(temp1, temp2);
//        temp1.material.color = new THREE.Color("black");
//        temp1.position.set(((i) % 8) * 2 - 4, 0, ((i) / 8) * 2 - 4);
        aTeam.push(temp1)
        scene.add(temp1);
//        temp2.material.color = new THREE.Color("white");
//        temp2.position.set(((i) % 8) * 2 - 4, 0, ((i) / 8) * 2 + 3);
        bTeam.push(temp2);
        scene.add(temp2);
    }
}

function buildIt() {
    //  put all of your geometry and materials in here

    // draw the board

    // build a cube;
    geometry = new THREE.BoxGeometry(2, 2, 2);

    // shader stuff
    // timeStart = new Date().getTime();
    // uniforms = {
    //     u_time: {value: 1.0},
    //     u_resolution: {value: {x: 512, y: 512}},
    // };
    // material = new THREE.ShaderMaterial({
    //     uniforms: uniforms,
    //     vertexShader: vertexShader(),//loadedVertexShader,
    //     fragmentShader: fragmentShader(),//loadedFragmentShader,
    //     // vertexShader: vertexShader(),
    //     // fragmentShader: fragmentShader(),
    // });

    material = new THREE.MeshPhongMaterial({
        color: "purple",
        side: THREE.DoubleSide,
    });
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
//  console.log(scene);
}

function addOrbitControls() {
    controls = new THREE.OrbitControls(camera, container);
    controls.minDistance = 5;
    controls.maxDistance = 500;
//  controls.autoRotate = true;
}

init();
animate();
