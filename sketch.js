/*//////////////////////////////////////////////////////////
"1ofX Simple ThreeJS template" 
Original code by David Gail Smith, February 2022
Twitter: @davidgailsmith
http://baconbitscollective.org
A simple JS starter template for THREE js projects on 1ofX
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
let screenShotDone = false;

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  setCamera();
  setLights();
  buildRenderer();
  container = renderer.domElement;
  document.body.appendChild(container);
  loadAssets();  //  to load a 3d model from ipfs link
  buildIt();
  addOrbitControls();
  window.addEventListener("resize", onWindowResize);
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  updateScene();
  renderer.render(scene, camera);
}

function updateScene() {
  if (screenShotDone == false) {
    // waits for first frame to take screenshot and send features
    //  add features on next line if desired
    //  window.OneOfX.save({Hubs: 6, Stages: 3, Gears: 26, Rods: 29, Color_Schemes: 12, Palettes: 130});
    screenShotDone = true;
  }
  // put any scene updates here (rotation of objects for example, etc)
  controls.update();
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
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight, true);
  renderer.setPixelRatio(window.devicePixelRatio || 1);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function loadAssets() {
  const loader = new THREE.OBJLoader();
  let material;
  let cubeColor = new THREE.Color(Math.random()*255, Math.random()*255, Math.random()*255);
  // Texture cubes as background
 // loader.load('https://ipfs.io/ipfs/bafybeihsxmq6fqvjzew7sje5fg5ahtr3rytafzrrsdu3bkwuhbnsxvrcmm', function(object) {
    loader.load('./assets/rook.obj', function(object) {
    object.name = "chessBoard";
    object.position = new THREE.Vector3();
    object.position.x = 0;
    object.position.y = 0;
    object.position.z = 0;
    object.rotation.y = 0;
    material = new THREE.MeshStandardMaterial({
      color: cubeColor,
      metalness: 0.8,
      roughness: 0.2,
    });
object.material = material;
   scene.add(object);
//    console.log("Spinner - ", object);
  }, function(xhr) {
//    console.log((xhr.loaded / xhr.total * 100) + '% of SPinner loaded');
  }, function(error) {
//    console.log('An error happened with Spinner:' + error);
  });
}

function buildIt() {
  //  put all of your geometry and materials in here
  geometry = new THREE.BoxGeometry(2, 2, 2);
  material = new THREE.MeshPhongMaterial({
    color: "purple",
    side: THREE.DoubleSide,
  });
  mesh = new THREE.Mesh(geometry, material);
//  scene.add(mesh);
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
