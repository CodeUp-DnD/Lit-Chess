/*//////////////////////////////////////////////////////////////
Original code by David Gail Smith and Aldanis Vigo, October 2022
*/ /////////////////////////////////////////////////////////////
//  Written using THREE r145

let container,
    scene,
    camera,
    renderer,
    ambLt,
    dirLt,
    spotLt,
    material,
    controls;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointedAtObj;
let intersected;
let selectedFrom = null;
let selectedTo = null;
let holderTile;

// shader uniforms
// let uniforms;
// let timeStart;

let models = [];
let aTeam = [];
let bTeam = [];
let board = [];

async function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    setCamera();
    setLights();
    buildRenderer();
    container = renderer.domElement;
    document.body.appendChild(container);
    await loadGLTFAssets();
    buildBoard();
    buildPieces();
    addOrbitControls();
    window.addEventListener("resize", onWindowResize);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('click', idTile);
    window.addEventListener('keydown', keyPressed);
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

    // get or set game-state here

    // update orbit controls (or other)
    if (controls) {
        controls.update();
    }
    // update uniforms if using a shader
    // uniforms['u_time'].value = (timeStart - new Date().getTime())/1000;

    // picker
    // update the picking ray with the camera and pointer position
    raycaster.setFromCamera(pointer, camera);
    // calculate objects intersecting the picking ray
    let intersects = raycaster.intersectObjects(scene.children, false);
    if (intersects.length > 0) {
        if (intersected != intersects[0].object && intersects[0].object.name.includes("panel")) {
            // console.log(intersects[0].object);
            pointedAtObj = intersects[0].object.clone();
            if (intersected) {
                intersected.material.emissive.setHex(intersected.currentHex);
            }
            intersected = intersects[0].object;
            intersected.currentHex = intersected.material.emissive.getHex();
            intersected.material.emissive.setHex(0xff0000);
        } else {
            if (intersected) intersected.material.emissive.setHex(intersected.currentHex);
            intersected = null;
        }
    } else {
        pointedAtObj = null;
    }
}

function idTile() {
    raycaster.setFromCamera(pointer, camera);
    raycaster.setFromCamera(pointer, camera);
    let intersects = raycaster.intersectObjects(scene.children, false);
    if (intersects.length > 0 && intersects[0].object.name.includes("panel")) {
        console.log("You clicked on " + intersects[0].object.name);
    }
    if (selectedFrom === null) {  // also check to be sure a piece is on the location
        selectedFrom = intersects[0].object;
        selectedFrom.material.emissive.setHex(0xff00ff);
        console.log("Selected 'from', waiting for 'to'");
    } else {  // also check to be sure that the destination is a  valid move
        selectedTo = intersects[0].object;
        console.log("moving from " + selectedFrom.name + " to " + selectedTo.name);
        selectedFrom.material.emissive.setHex(holderTile.material.emissive.getHex());
        selectedFrom = null;
        selectedTo = null;
    }
}

function setCamera() {
    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        1,
        1000
    );
    camera.position.x = 17;
    camera.position.y = 7;
    camera.position.z = 17;
    scene.add(camera);
}

function setLights() {
    ambLt = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambLt);
    dirLt = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLt.position.set(0, 15, 0);
    scene.add(dirLt);
    spotLt = new THREE.SpotLight(0xffffff, 0.5);
    spotLt.position.set(0, 4, 0);
    spotLt.decay = 2.0;
    scene.add(spotLt);
}

function onPointerMove(event) {
    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    //   console.log(pointer);
}

function keyPressed(e) {
    console.log(e.which);
    if (e.which == 27) {
        selectedFrom = null;
        selectedFrom.material.emissive.setHex(holderTile.material.emissive.getHex());
        selectedTo = null;
        selectedFrom.material.emissive.setHex(holderTile.material.emissive.getHex());
        console.log("Deselected");
    }
}

function buildRenderer() {
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight, true);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
}

function onWindowResize() {  // needed to resize others along with window
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

const loadModel = async url => {
    const loader = new THREE.GLTFLoader();
    let gltf = await loader.loadAsync(url);
    return gltf;
}

function loadGLTFAssets() {  // load GLB model(s)
    return new Promise(async (resolve, reject) => {
        try {
            // if using texture, load here
            // const textureLoader = new THREE.TextureLoader();
            // let texture = textureLoader.load('texturefile.png');
            // initial material for pieces colored red
            material = new THREE.MeshPhongMaterial({
                side: THREE.DoubleSide,
                color: "red",
            });
            // load each 3d model into a model array for later use in building teams
            let order = ["pawn", "rook", "bishop", "knight", "queen", "king"];
            let gltfs = [];
            for (let i = 0; i < order.length; i++) {
                let url = "./assets/modelsGLB/" + order[i] + ".glb";
                gltfs.push(await loadModel(url))
            }
            // get the meshes out of the scene in glb file and assign materials and push to array
            gltfs.forEach(item => {
                item.scene.traverse(function (object) {
                    if (object.isMesh) {
                        object.castShadow = true;
                        // for non texture
                        object.material = material;
                        // for texture
                        // object.material.map = texture;
                        models.push(object);
                    }
                });
            })
            await Promise.all(gltfs)
            resolve(true)
        } catch (err) {
            reject(err)
        }
    })
}

function buildBoard() {
    let tempTilePositRef = {};
    let geom;
    let mat;
    let mesh;
    for (let i = 0; i < 64; i++) {
        tempTilePositRef = {x: (i % 8), y: Math.floor(i / 8)};
        geom = new THREE.BoxGeometry(1.9, 1.9, 0.1);
        mat = new THREE.MeshLambertMaterial({
            color: 0x800080,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
        });
        mesh = new THREE.Mesh(geom, mat);
        let posit = new THREE.Vector3(tempTilePositRef.x * 2 - 7, 0, tempTilePositRef.y * 2 - 7);
        mesh.position.set(posit.x, posit.y, posit.z);
        mesh.name = "panel-" + i;
        mesh.rotateX(Math.PI / 2);
        board.push({tempTilePositRef, mesh});
        scene.add(mesh);
    }
    holderTile = mesh.clone();
}

function buildPieces() {
    // build two full sets of pieces, each set a different color
    let order = [1, 2, 3, 4, 5, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0]; // rook, knight, bishop, etc. (models array indices)
    for (let i = 0; i < order.length; i++) {
        // team 1
        let temp1 = models[order[i]].clone();
        // this is phong, but could use shader material here if we get fancy (and below for tm 2
        temp1.material = new THREE.MeshPhongMaterial({
            color: "grey",
            side: THREE.DoubleSide,
        });
        temp1.position.set((i % 8) * 2 - 7, 0, Math.floor((i / 8)) * 2 - 7);
        aTeam.push(temp1)
        scene.add(temp1);

        // team 2
        let temp2 = models[order[i]].clone();
        temp2.material = new THREE.MeshPhongMaterial({
            color: "white",
            side: THREE.DoubleSide,
        });
        temp2.position.set(((i + 48) % 8) * 2 - 7, 0, Math.floor((i + 48) / 8) * 2 - 7);
        temp2.rotateZ(Math.PI);
        bTeam.push(temp2);
        scene.add(temp2);
    }
}

// function utilShowOrigin() {
//     let geom = new THREE.SphereGeometry(.5);
//     let mat = new THREE.MeshBasicMaterial({color:"red"});
//     let mesh = new THREE.Mesh(geom, mat);
//     scene.add(mesh);
// }

// function initShaderMat() {
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
// return material;
// }

function addOrbitControls() {
    controls = new THREE.OrbitControls(camera, container);
    controls.minDistance = 5;
    controls.maxDistance = 500;
//    controls.autoRotate = true;
}

init();
animate();

const initiateChessEngineGame = () => {

    ///   DGS - maybe this part goes in init function
    //Creating game using the js chess game engine
    let game_engine = new jsChessEngine.Game()
    game_engine.printToConsole()

    ///   DGS - maybe this part also goes in init function
    //From examples folder
    play()

    ///   DGS - then since animate/update/render are the game loop then somehow pass state in the update function?
    function play() {
        const status = game_engine.exportJson()
        if (status.isFinished) {
            console.log(`${status.turn} is in ${status.checkMate ? 'checkmate' : 'draw'}`)
        } else {
            console.time('Calculated in')
            const move = game_engine.aiMove(status.turn === 'black' ? blackAiLevel : whiteAiLevel)
            console.log(`${status.turn.toUpperCase()} move ${JSON.stringify(move)}`)
            console.timeEnd('Calculated in')
            game_engine.printToConsole()
            play()
        }
    }
}
