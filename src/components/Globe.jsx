import { Component } from "react";
import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { buildGlobe } from "../utils/utils";
import { circleInstance, getCoordinates } from "./instancing.js";
import { GalaxyBackground } from "./GalaxyBackground";
import Curve from "./curve.js";

class Globe extends Component {
  constructor() {
    super();
    this.canvas = null;
    this.points = null; // coordinates of continents except for artic & antarctic
    this.spikes = []; // array of tower & top
    this.curves = [];
  }
  componentDidMount() {
    this.init();
  }

  componentWillUnmount() {
    this.removeEventListener();
  }

  removeEventListener() {
    window.removeEventListener("resize", this.handleResize.bind(this), false);
    window.removeEventListener(
      "mousemove",
      this.handleMouseMove.bind(this),
      false
    );
  }

  handleResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  handleMouseMove = (e) => {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    document.getElementById("description").style.left = e.clientX - 150 + "px";
    document.getElementById("description").style.top = e.clientY - 47 + "px";
    document.getElementById("description").style.display = "none";
  };

  init() {
    console.log("init");
    this.canvas = document.querySelector(".globe");

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机设置
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.canvas.offsetWidth / this.canvas.offsetHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0.5, 90);
    this.scene.add(this.camera);

    // 点光源
    var pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(-300, 500, 0);
    this.camera.add(pointLight);

    // 半球光
    var hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.4);
    this.scene.add(hemiLight);

    // 渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    const DPR = window.devicePixelRatio ? window.devicePixelRatio : 1;
    this.renderer.setPixelRatio(DPR);
    this.renderer.setSize(this.canvas.offsetWidth, this.canvas.offsetHeight);
    this.renderer.shadowMap.enabled = true;
    this.canvas.appendChild(this.renderer.domElement);

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enableZoom = false;
    this.controls.autoRotate = true;
    this.controls.update();
    this.controls.autoRotateSpeed = 0.5;

    // 星空背景
    this.scene.add(GalaxyBackground());

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    window.addEventListener("resize", this.handleResize.bind(this), false);

    window.addEventListener(
      "mousemove",
      this.handleMouseMove.bind(this),
      false
    );

    Promise.all([
      new Promise((resolve) => {
        circleInstance(this.scene, resolve);
      }).then(() => {
        this.points = getCoordinates().coordinates;
        console.log("points", this.points);
      }),
    ]).then(() => {
      this.start();
    });
  }

  start() {
    console.log("start");
    buildGlobe(this.scene);
    this.animate();
  }
  /*  
        param:      mesh
        function:   removes mesh from scene
    */
  remove(m) {
    m.geometry.dispose();
    m.material.dispose();
    this.scene.remove(m);
  }

  top(point) {
    const phi = Math.acos(point.z / 25);
    const theta = Math.atan(point.y / point.x);
    const length = 27.2;
    if (point.x > 0) {
      return new THREE.Vector3(
        length * Math.sin(phi) * Math.cos(theta),
        length * Math.sin(phi) * Math.sin(theta),
        length * Math.cos(phi)
      );
    } else {
      return new THREE.Vector3(
        -length * Math.sin(phi) * Math.cos(theta),
        -length * Math.sin(phi) * Math.sin(theta),
        length * Math.cos(phi)
      );
    }
  }

  animate() {
    console.log("animate");
    // 初始化空的数据
    const delays = [];
    const timers = [];
    for (let i = 0; i < 200; i++) {
      delays.push(parseInt(Math.random() * 2000));
      timers.push(0);
      this.spikes.push({ tower: null, top: null });
      this.spikes.push({ tower: null, top: null });
      this.curves.push(null);
    }

    let startPoint = null;

    // makes spike geometry & material
    const spikeGeo = new THREE.CylinderBufferGeometry(0.1, 0.1, 5, 32)
      .rotateX(Math.PI / 2)
      .translate(0.1, 0.1, 2.5);
    const spikeMat = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.7,
    });
    // makes spike top geometry & material
    var topGeo = new THREE.SphereGeometry(0.25, 2, 2);
    var topMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    delays[0] = 0;

    const renderUI = () => {
      // Todo 控制显示数据& 停止球体的转动
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(
        this.scene.children,
        false
      );
      if (intersects.length > 0 && intersects[0].object.name === "point") {
        console.log("鼠标选中");

        document.getElementById("description").style.display = "block";
        this.controls.autoRotate = false;
        this.controls.update();
      } else {
        this.controls.autoRotate = true;
        this.controls.update();
      }

      for (let i = 0; i < 20; i++) {
        timers[i]++;
        if (this.curves[i] == null) {
          if (timers[i] > delays[i] && i !== 0) {
            // initialises start & end spikes and tops
            this.spikes[2 * i] = { tower: null, top: null };
            this.spikes[2 * i + 1] = { tower: null, top: null };

            // chooses a random start point on continents
            startPoint =
              this.points[parseInt(this.points.length * Math.random())];

            // makes start spike & top
            this.spikes[2 * i].tower = new THREE.Mesh(spikeGeo, spikeMat);
            this.spikes[2 * i].tower.name = "point";
            this.spikes[2 * i].tower.position.copy(startPoint);
            this.spikes[2 * i].tower.lookAt(new THREE.Vector3(0, 0, 0));
            this.spikes[2 * i].tower.scale.z = 0;
            this.spikes[2 * i].top = new THREE.Mesh(topGeo, topMat);
            this.spikes[2 * i].top.position.copy(this.top(startPoint));
            this.spikes[2 * i].top.lookAt(new THREE.Vector3(0, 0, 0));

            // chooses a random end point with distance to start point smaller than 40
            var endPoint =
              this.points[parseInt(this.points.length * Math.random())];
            while (endPoint.distanceTo(startPoint) > 40) {
              endPoint =
                this.points[parseInt(this.points.length * Math.random())];
            }

            // makes end spike & top
            this.spikes[2 * i + 1].tower = this.spikes[2 * i].tower.clone();
            this.spikes[2 * i + 1].tower.name = "point";
            this.spikes[2 * i + 1].tower.position.copy(endPoint);
            this.spikes[2 * i + 1].tower.lookAt(new THREE.Vector3(0, 0, 0));
            this.spikes[2 * i + 1].tower.scale.z = 0;
            this.spikes[2 * i + 1].top = this.spikes[2 * i].top.clone();
            this.spikes[2 * i + 1].top.position.copy(this.top(endPoint));
            this.spikes[2 * i + 1].top.lookAt(new THREE.Vector3(0, 0, 0));

            // makes a curve
            const line = new Curve(this.scene, startPoint, endPoint);
            line.name = "line";
            this.curves[i] = line;

            this.scene.add(this.spikes[2 * i].tower);
            this.scene.add(this.spikes[2 * i + 1].tower);
            this.scene.add(this.spikes[2 * i].top);
            this.scene.add(this.spikes[2 * i + 1].top);
          }
        } else {
          // destroy curve & towers
          if (!this.curves[i].animation) {
            this.curves[i] = null;
            this.remove(this.spikes[2 * i].tower);
            this.remove(this.spikes[2 * i + 1].tower);
            this.remove(this.spikes[2 * i].top);
            this.remove(this.spikes[2 * i + 1].top);
            this.spikes[2 * i] = null;
            this.spikes[2 * i + 1] = null;
            timers[i] = 0;
          } else {
            if (this.curves[i].dir === 1) {
              if (this.curves[i].drawCounts < 3600) {
                this.spikes[2 * i].tower.scale.z -= 0.004;
                this.spikes[2 * i + 1].tower.scale.z -= 0.004;
              }
            } else {
              if (this.curves[i].drawCounts < 3600) {
                this.spikes[2 * i].tower.scale.z += 0.004;
                this.spikes[2 * i + 1].tower.scale.z += 0.004;
              }
            }
          }
        }
      }

      this.renderer.render(this.scene, this.camera);
      this.controls.update();
      requestAnimationFrame(renderUI);
    };
    renderUI();
  }

  render() {
    return (
      <>
        <div className="globe" style={{ height: "100%" }}></div>
        <div id="description" style={{ display: "none" }}>
          发货物流数据～
        </div>
      </>
    );
  }
}

export default Globe;
