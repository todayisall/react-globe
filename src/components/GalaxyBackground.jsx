import {
  TextureLoader,
  MeshBasicMaterial,
  BackSide,
  SphereGeometry,
  Mesh,
} from "three";
import GalaxyImg from "../assets/images/galaxy.jpeg";
// 星空背景
export const GalaxyBackground = () => {
  var textureLoader = new TextureLoader();
  var texture = textureLoader.load(GalaxyImg); // 加载纹理贴图
  var material = new MeshBasicMaterial({
    map: texture,
    side: BackSide,
  });
  var geometry = new SphereGeometry(100, 32, 32);
  var mesh = new Mesh(geometry, material);

  return mesh;
};
