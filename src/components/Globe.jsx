import { Component } from "react";
import * as THREE from "three";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { buildGlobe } from "../utils/utils";
import { circleInstance, getCoordinates, getMesh } from "./instancing.js";
import { GalaxyBackground } from "./GalaxyBackground";

class Globe extends Component {
  constructor() {
    super();
    this.canvas = null;
    this.continents = null;
    this.points = null; // coordinates of continents except for artic & antarctic
    this.spikes = []; // array of tower & top
    this.curves = [];
    this.circles = [];
  }
  componentDidMount() {
    this.init();
  }

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

    Promise.all([
      this.loadModel("/tower.glb").then((result) => {
        console.log(result);
      }),
      new Promise((resolve) => {
        circleInstance(this.scene, resolve);
      }).then(() => {
        // this.points = getCoordinates().coordinates; // continents except for artic & antartic
        // this.pixels = getCoordinates().pixels; // continents including artic & antartic
        // this.continents = getMesh(); // instanced mesh that holds continents
      }),
    ]).then(() => {
      this.start();
    });
  }

  loadModel(url) {
    return new Promise((resolve) => {
      new GLTFLoader().load(url, resolve);
    });
  }

  start() {
    console.log("start");
    buildGlobe(this.scene);
    this.animate();
  }

  animate() {
    console.log("animate");
    const renderUI = () => {
      this.renderer.render(this.scene, this.camera);
      this.controls.update();
      requestAnimationFrame(renderUI);
    };
    renderUI();
  }

  render() {
    return <div className="globe" style={{ height: "100%" }}></div>;
  }
}

export default Globe;
