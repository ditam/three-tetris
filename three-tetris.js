'use strict';
var scene, camera, renderer, stats;

var CONSTANTS = Object.freeze({
 INNER_RADIUS: 200,
 OUTER_RADIUS: 300,
 BLOCK_HEIGHT: 50,
 SEGMENT_COUNT: 12,
 NEW_BLOCK_ROW: 9,
 NEW_BLOCK_COL: 0,
 LINE_HEIGHT: 50
});

var baseRotation = 0; // should stay in [0,CONSTANTS.SEGMENT_COUNT]

function getRandomInt(min, max) { // both ends inclusive
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var MATERIALS = Object.freeze({
  RED: new THREE.MeshPhongMaterial({
    color: 0xcc0015,
    emissive: 0x402030,
    side: THREE.DoubleSide,
    shading: THREE.FlatShading
  }),
  BLUE: new THREE.MeshPhongMaterial({
    color: 0x156289,
    emissive: 0x072534,
    side: THREE.DoubleSide,
    shading: THREE.FlatShading
  }),
  GREEN: new THREE.MeshPhongMaterial({
    color: 0x158950,
    emissive: 0x078820,
    side: THREE.DoubleSide,
    shading: THREE.FlatShading
  })
});

function getRandomMaterial(){
  var materialKeys = Object.keys(MATERIALS);
  var randomKey = materialKeys[getRandomInt(0,materialKeys.length-1)];
  return MATERIALS[randomKey];
}

var freeBlockPosition = {
  row: CONSTANTS.NEW_BLOCK_ROW,
  col: CONSTANTS.NEW_BLOCK_COL
};

function addNewBlock(){
  model.freeBlock = {
    row: CONSTANTS.NEW_BLOCK_ROW,
    col: CONSTANTS.NEW_BLOCK_COL,
    material: getRandomMaterial()
  };
  regenerateMeshes();
}

var model = {
  blocks: [ // A 2D matrix of CONSTANTS.SEGMENT_COUNT long rows
    [ // row 0
      undefined,
      undefined,
      {
        material: MATERIALS.RED
      },
      {
        material: MATERIALS.BLUE
      },
      undefined,
      {
        material: MATERIALS.BLUE
      }
    ],
    [ // row 1
      undefined,
      undefined,
      {
        material: MATERIALS.GREEN
      }
    ],
    [], // r2
    [], // r3
    [], // r4
    [], // r5
    [], // r6
    [], // r7
    [], // r8,
    []  // r9
  ]
};

document.onkeypress = function(event) {
  switch (event.code) {
    case 'KeyW':
      console.warn('ROTATE not implemented');
      break;
    case 'KeyA':
      rotateBoard('left');
      break;
    case 'KeyS':
      dropByOne();
      // TODO: add collision detection and merging of freeblock+blocks
      break;
    case 'KeyD':
      rotateBoard('right');
      break;
  }
};

// TODO: clear up terminology (board/blocks mixup, freeblock is actually going to be multiple blocks)
function dropByOne() {
  model.freeBlock.row = Math.max(0, model.freeBlock.row-1);
  // TODO: check collision with fixed blocks, merge if necessary
  regenerateMeshes();
}

var sliceAngle = Math.PI*2 / CONSTANTS.SEGMENT_COUNT;

function rotateBoard(direction) {
  switch (direction) {
    case 'left':
      baseRotation = (baseRotation-1) % CONSTANTS.SEGMENT_COUNT;
      regenerateMeshes();
      break;
    case 'right':
      baseRotation = (baseRotation+1) % CONSTANTS.SEGMENT_COUNT;
      regenerateMeshes();
      break;
    default:
      console.error('unknown direction ',direction);
  }
}
//TODO: describe geometry
// 8 points total, 4-4 on outer and inner rectangular face
function constructSliceGeometry(lineIndex, segmentIndex) {
  var points = [];

  var angle1 = sliceAngle * segmentIndex;
  var angle2 = sliceAngle * (segmentIndex + 1);

  var x0_outer = Math.cos(angle1) * CONSTANTS.OUTER_RADIUS;
  var y0_outer = Math.sin(angle1) * CONSTANTS.OUTER_RADIUS;

  var x1_outer = Math.cos(angle2) * CONSTANTS.OUTER_RADIUS;
  var y1_outer = Math.sin(angle2) * CONSTANTS.OUTER_RADIUS;

  var x0_inner = Math.cos(angle1) * CONSTANTS.INNER_RADIUS;
  var y0_inner = Math.sin(angle1) * CONSTANTS.INNER_RADIUS;

  var x1_inner = Math.cos(angle2) * CONSTANTS.INNER_RADIUS;
  var y1_inner = Math.sin(angle2) * CONSTANTS.INNER_RADIUS;

  var z0 = lineIndex*CONSTANTS.LINE_HEIGHT;
  var z1 = (lineIndex+1)*CONSTANTS.LINE_HEIGHT;

  points.push( new THREE.Vector3(x0_outer, y0_outer, z0) );
  points.push( new THREE.Vector3(x1_outer, y1_outer, z0) );
  points.push( new THREE.Vector3(x0_inner, y0_inner, z0) );
  points.push( new THREE.Vector3(x1_inner, y1_inner, z0) );

  points.push( new THREE.Vector3(x0_outer, y0_outer, z1) );
  points.push( new THREE.Vector3(x1_outer, y1_outer, z1) );
  points.push( new THREE.Vector3(x0_inner, y0_inner, z1) );
  points.push( new THREE.Vector3(x1_inner, y1_inner, z1) );

  return new THREE.ConvexGeometry(points);
}

var currentMeshes = [];

// This is far from optimal (we could probably just move the meshes, or only regenerate those that changed), but it'll do for now.
function regenerateMeshes() {
  console.log('regenerating meshes. Current model:',model.blocks);

  currentMeshes.forEach(function(mesh){
    scene.remove(mesh);
  });
  currentMeshes = [];

  function generateMeshAtPosition(material, row, col, isFree) {
    var geometry = constructSliceGeometry(row, col);
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 0);
    if (!isFree) {
      mesh.rotation.z = baseRotation * sliceAngle;
    }
    return mesh;
  }

  // generate meshes for base blocks
  for(var rowIndex = 0; rowIndex < model.blocks.length; rowIndex++){
    for(var colIndex = 0; colIndex < model.blocks[rowIndex].length; colIndex++){
      var block = model.blocks[rowIndex][colIndex];
      if (block) {
        console.log('adding mesh at ',rowIndex,colIndex);
        var mesh = generateMeshAtPosition(block.material, rowIndex, colIndex)
        currentMeshes.push(mesh);
      }
    }
  }

  // generate mesh for free block
  if (model.freeBlock) {
    var freeBlockMesh = generateMeshAtPosition(model.freeBlock.material, model.freeBlock.row, model.freeBlock.col, true);
    currentMeshes.push(freeBlockMesh);
  }

  currentMeshes.forEach(function(mesh){
    scene.add(mesh);
  });
}

function init() { // TODO: extract constants
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.z = 500;
  camera.position.y = -1000;

  regenerateMeshes();

  var lights = [];
  lights[ 0 ] = new THREE.PointLight( 0xffffff );
  lights[ 1 ] = new THREE.PointLight( 0xffffff );
  lights[ 2 ] = new THREE.PointLight( 0xffffff );

  lights[ 0 ].position.set( 0, 500, 0 );
  lights[ 1 ].position.set( 200, 500, 200 );
  lights[ 2 ].position.set( -200, -500, -200 );

  scene.add( lights[ 0 ] );
  scene.add( lights[ 1 ] );
  scene.add( lights[ 2 ] );

  // X red, Y green, Z blue
  scene.add( new THREE.AxisHelper( 150 ) );

  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );

  var orbit = new THREE.OrbitControls( camera, renderer.domElement );
	orbit.enableZoom = false;

  // rotate to bring the free block to front
  // TODO: technically, this should be based on CONSTANTS.NEW_BLOCK_COL
  scene.rotation.z = -Math.PI/2-sliceAngle/2;

  stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild( stats.dom );

  document.getElementById('main-renderer-target').appendChild( renderer.domElement );
}

var gameTime = 0;
function animate() {
  stats.begin();

  // TODO: should this be tied to animation frames or real time instead?
  gameTime++;
  if ( !(gameTime%300) ) {
    dropByOne();
  }

  // auto-rotation
  // scene.rotation.z += 0.001;

  renderer.render(scene, camera);

  stats.end();

  requestAnimationFrame(animate);
}

init();
animate();
addNewBlock();
