'use strict';
var scene, camera, renderer;

var CONSTANTS = Object.freeze({
 INNER_RADIUS: 200,
 OUTER_RADIUS: 300,
 BLOCK_HEIGHT: 50,
 SEGMENT_COUNT: 12,
 LINE_HEIGHT: 50
});

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

var model = {
  blocks: [ // A 2D matrix of CONSTANTS.SEGMENT_COUNT long rows
    [
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
    [
      undefined,
      undefined,
      {
        material: MATERIALS.GREEN
      }
    ]
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
      console.warn('DROP not implemented');
      break;
    case 'KeyD':
      rotateBoard('right');
      break;
  }
};


var sliceAngle = Math.PI*2 / CONSTANTS.SEGMENT_COUNT;

function rotateBoard(direction) {
  switch (direction) {
    case 'left':
      scene.rotation.z += sliceAngle;
      break;
    case 'right':
      scene.rotation.z -= sliceAngle;
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

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.z = 1000;

  for(var rowIndex = 0; rowIndex < model.blocks.length; rowIndex++){
    for(var colIndex = 0; colIndex < model.blocks[rowIndex].length; colIndex++){
      var block = model.blocks[rowIndex][colIndex];
      if (block) {
        var geometry = constructSliceGeometry(rowIndex, colIndex);
        var mesh = new THREE.Mesh( geometry, block.material );
        mesh.position.set( 0, 0, 0 );
        scene.add( mesh );
      }
    }
  }

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

  document.getElementById('main-renderer-target').appendChild( renderer.domElement );
}

function animate() {
  requestAnimationFrame( animate );

  scene.rotation.z += 0.001;

  renderer.render( scene, camera );
}

init();
animate();