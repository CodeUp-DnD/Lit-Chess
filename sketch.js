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
const pointer = new THREE.Vector2(1,1);
let intersected;
let selectedFrom = null;
let selectedTo = null;
let dimTile;
let litTile;
let intersects = null;

// shader uniforms
// let uniforms;
// let timeStart;

let models = [];
let aTeam = [];
let bTeam = [];
let board = [];
let pickableObjects = [];
let moused = null;

async function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x777777);
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
    checkForMouseOver();
}

function checkForMouseOver() {

    // ensure intersects array is clear;
    intersects = [];
    // update the picking ray with the camera and pointer position
    raycaster.setFromCamera(pointer, camera);
    // calculate objects intersecting the picking ray
    intersects = raycaster.intersectObjects(pickableObjects, false);  // see if mousing over pickable object
    if (intersects.length > 0) {  //  the ray hit a pickable object
        if (intersected !== intersects[0].object) {  // if not on the previously seen object
            // console.log(intersects[0].object);
            if (intersected) moused = intersects[0].object.name;//intersected.material.emissive.setHex(intersected.currentHex); // turn previously moused object backed to its color
            intersected = intersects[0].object;  // set intersected to newly moused object
            intersected.currentHex = intersected.material.emissive.getHex();  //reset
            intersected.material.emissive.setHex(0x0000ff);  // set to red
        }
        cleanUpBoardSelections();

    } else {
        cleanUpBoardSelections();
        intersected = null;
    }
}

function idTile() {
    if (intersects.length > 0) {
        if (selectedFrom === null) {
            // also add a check to be sure a piece is on the location
            console.log("The 'from' piece is " + intersects[0].object.name);
            selectedFrom = Number(intersects[0].object.name);
             console.log("Selected 'from' index " + selectedFrom + " - board: " + board[selectedFrom].notation + ", waiting for 'to'.");
        } else {
            // also add a check to be sure that the destination is a valid move
                 selectedTo = Number(intersects[0].object.name);
                 console.log("Selected 'to' index " + selectedTo + " - board: " + board[selectedTo].notation);
            // check to see if move is valid here
                 console.log("If move is valid, moving from " + board[selectedFrom].notation + " to " + board[selectedTo].notation);
            // deselect
            selectedFrom = null;//dimTile.clone();
            selectedTo = null;//dimTile.clone();
            moused = null;

        }
    }
    cleanUpBoardSelections();
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
        selectedFrom = null;//dimTile.clone();
        selectedTo = null;//dimTile.clone();
        moused = null;
  //      board.forEach(element => {element.mesh.material.emissive.setHex(dimTile.material.emissive.getHex)})
        console.log("Deselected move.");
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
    let notation;
    let currentPiece;
    let geom;
    let mat;
    let mesh;
    for (let i = 0; i < 64; i++) {
        tempTilePositRef = {x: (i % 8), y: Math.floor(i / 8)};
        notation = "ABCDEFGH".charAt(i%8) + (Math.floor(i / 8) + 1);
        currentPiece = "";
        console.log(notation);
        geom = new THREE.BoxGeometry(1.9, 1.9, 0.1);
        mat = new THREE.MeshLambertMaterial({
            color: (((Math.floor(i / 8)%2!=0) && (i%2!=0)) || ((Math.floor(i / 8)%2==0) && (i%2==0)))?0x444444:0x888888,
            //((Math.floor(i / 8)%2==0) && (i%2==0))
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
        });
        // if ((i%2) == 0) {
        //     mat.color = 0x00ff00;
        // }
        mesh = new THREE.Mesh(geom, mat);
        let posit = new THREE.Vector3(tempTilePositRef.x * 2 - 7, 0, tempTilePositRef.y * 2 - 7);
        mesh.position.set(posit.x, posit.y, posit.z);
        mesh.name = i;
        mesh.rotateX(Math.PI / 2);
        pickableObjects.push(mesh);
        board.push({tempTilePositRef, mesh, notation, currentPiece});
        scene.add(mesh);
    }
    console.log(board);
    dimTile = mesh.clone();
    selectedFrom = null;
    selectedTo = null;
    moused = null;
    litTile = mesh.clone();
    litTile.material.emissive.setHex(0xff0000);
    cleanUpBoardSelections();
}

function cleanUpBoardSelections() {
    board.forEach(element => {element.mesh.material.emissive.setHex(dimTile.material.emissive.getHex)});
    if (selectedFrom) board[selectedFrom].mesh.material.emissive.setHex(0x0000ff);
    if (selectedTo) board[selectedTo].mesh.material.emissive.setHex(0x0000ff);
    if (moused) board[moused].mesh.material.emissive.setHex(0x0000ff);
}

function buildPieces() {
    // build two full sets of pieces, each set a different color
    let names = "prnbqk";
    let orderW = [1, 2, 3, 5, 4, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0]; // rook, knight, bishop, etc. (models array indices)
    let orderB = [0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 5, 4, 3, 2, 1]; // rook, knight, bishop, etc. (models array indices)
    for (let i = 0; i < orderW.length; i++) {
        // team 1
        let temp1 = models[orderW[i]].clone();
        // this is phong, but could use shader material here if we get fancy (and below for tm 2
        temp1.material = new THREE.MeshPhongMaterial({
            color: 0xdddddd,
            side: THREE.DoubleSide,
        });
        temp1.position.set(Math.floor(i / 8) * 2 - 7, 0, ((i % 8)) * 2 - 7);
        temp1.name = names.charAt(orderW[i]).toUpperCase();
        temp1.index = Math.floor(i / 8) + ((i % 8) * 8); //console.log(temp1.index);
        aTeam.push(temp1);
        scene.add(temp1);

        // team 2
        let temp2 = models[orderB[i]].clone();
        temp2.material = new THREE.MeshPhongMaterial({
            color: 0x444444,
            side: THREE.DoubleSide,
        });
        temp2.position.set(Math.floor((i + 48) / 8) * 2 - 7, 0, ((i + 48) % 8) * 2 - 7);
        temp2.name = names.charAt(orderB[i]);
        temp2.index = Math.floor((i+48) / 8) + (((i+48) % 8) * 8);// console.log(temp2.index);
        temp2.rotateZ(Math.PI);
        bTeam.push(temp2);
        scene.add(temp2);
    }
    updateBoardFromLocations();
}

function updateBoardFromLocations() {
        for (let j = 0; j < 16; j++) {
           board[aTeam[j].index].currentPiece = aTeam[j].name;
           board[bTeam[j].index].currentPiece = bTeam[j].name;
        }
        //console.log(board);
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
