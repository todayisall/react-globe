import * as THREE from "three";

const GLOBE_RADIUS = 25;

var mesh = null;
var coordinates = [];
var pixels = [];

const circleInstance = (scene, callback) => {
  const map = document.getElementById("map").getContext("2d");

  var img = new window.Image();
  img.setAttribute("crossOrigin", "");
  img.addEventListener("load", function () {
    map.drawImage(img, 0, 0);
    const image_data = map.getImageData(0, 0, 400, 200);

    for (var lat = -90; lat < 90; lat += 1.2) {
      for (var lng = -180; lng < 180; lng += 1.2) {
        var row = 400 - parseInt((lng * 400) / 360 + 200);
        var col = parseInt((lat * 200) / 180 + 100);
        if (image_data.data[1600 * col + row * 4 + 3] > 90) {
          var x =
            GLOBE_RADIUS *
            Math.cos((lat * Math.PI) / 180) *
            Math.cos((lng * Math.PI) / 180);
          var y =
            GLOBE_RADIUS *
            Math.cos((lat * Math.PI) / 180) *
            Math.sin((lng * Math.PI) / 180);
          var z = GLOBE_RADIUS * Math.sin((lat * Math.PI) / 180);
          pixels.push([x, y, z]);
          if (lat > -65 && lat < 65) {
            coordinates.push(
              new THREE.Vector3(
                x,
                y * Math.cos(Math.PI / 2) - z * Math.sin(Math.PI / 2),
                y * Math.sin(Math.PI / 2) + z * Math.cos(Math.PI / 2)
              )
            );
          }
        }
      }
    }

    const geometry = new THREE.CircleBufferGeometry(0.095, 5);
    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });
    mesh = new THREE.InstancedMesh(geometry, material, pixels.length, true);
    const matrix = new THREE.Matrix4();

    for (let i = 0; i < pixels.length; i++) {
      matrix.setPosition(pixels[i][0], pixels[i][1], pixels[i][2]);
      var up = new THREE.Vector3(pixels[i][0], pixels[i][1], pixels[i][2]);
      matrix.lookAt(up, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0));
      mesh.setMatrixAt(i, matrix);
    }
    mesh.lookAt(new THREE.Vector3(0, 0, 0));
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.rotation.x = Math.PI / 2;
    scene.add(mesh);

    callback();
  });
  img.setAttribute("src", "/map.png");
};

const getCoordinates = () => {
  return { pixels: pixels, coordinates: coordinates };
};

const getMesh = () => {
  return mesh;
};
export { circleInstance, getCoordinates, getMesh };
