"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
interface Post {
  id: number;
  title: string;
  point_x: number;
  point_y: number;
  point_z: number;
  post_content_text: string;
  post_content_image?: string;
}

export default function Home() {
  const plotRef = useRef<HTMLDivElement>(null);
  const sidePanelRef = useRef<HTMLDivElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);

  const [, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const resizing = useRef(false);
  const originalWidth = useRef(300);
  const originalMouseX = useRef(0);

  useEffect(() => {
    if (!plotRef.current || !sidePanelRef.current) return;

    const plot = plotRef.current;
    const sidePanel = sidePanelRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f5f5dc");

    const camera = new THREE.PerspectiveCamera(
      75,
      (window.innerWidth - sidePanel.offsetWidth) / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(3, 3, 3);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth - sidePanel.offsetWidth, window.innerHeight);
    plot.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1;
    controls.maxDistance = 10;
    controls.target.set(0, 0, 0);
    controls.enablePan = true;
    controls.panSpeed = 0.5;
    controls.update();

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Helpers
    const gridSize = 10;
    const gridDivisions = 20;
    const gridColor = "#d3d3d3";

    const gridHelperXZ = new THREE.GridHelper(gridSize, gridDivisions, gridColor, gridColor);
    scene.add(gridHelperXZ);

    const gridHelperXY = new THREE.GridHelper(gridSize, gridDivisions, gridColor, gridColor);
    gridHelperXY.rotation.x = Math.PI / 2;
    scene.add(gridHelperXY);

    const gridHelperYZ = new THREE.GridHelper(gridSize, gridDivisions, gridColor, gridColor);
    gridHelperYZ.rotation.z = Math.PI / 2;
    scene.add(gridHelperYZ);

    const axesHelper = new THREE.AxesHelper(2);
    scene.add(axesHelper);

    // Resize handler
    function onWindowResize() {
      const sidePanelWidth = sidePanel.offsetWidth;
      camera.aspect = (window.innerWidth - sidePanelWidth) / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth - sidePanelWidth, window.innerHeight);
      plot.style.width = `${window.innerWidth - sidePanelWidth}px`;
    }
    window.addEventListener("resize", onWindowResize);

    // Resizer drag handlers
    function onMouseDown(e: MouseEvent) {
      resizing.current = true;
      originalWidth.current = sidePanel.offsetWidth;
      originalMouseX.current = e.pageX;
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      e.preventDefault();
    }

    function onMouseMove(e: MouseEvent) {
      if (!resizing.current) return;
      let newWidth = originalWidth.current - (e.pageX - originalMouseX.current);
      if (newWidth < 150) newWidth = 150;
      if (newWidth > window.innerWidth - 100) newWidth = window.innerWidth - 100;

      sidePanel.style.width = `${newWidth}px`;
      plot.style.width = `${window.innerWidth - newWidth}px`;
      camera.aspect = (window.innerWidth - newWidth) / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth - newWidth, window.innerHeight);
    }

    function onMouseUp() {
      resizing.current = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }

    resizerRef.current?.addEventListener("mousedown", onMouseDown);

    // Raycasting setup
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredSphere: THREE.Mesh | null = null;

    // Store spheres here
    const spheres: THREE.Mesh[] = [];

    // Mouse events for hover and click
    function onMouseMovePlot(event: MouseEvent) {
      const rect = plot.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(spheres);

      if (intersects.length > 0) {
        const sphere = intersects[0].object as THREE.Mesh;
        if (hoveredSphere !== sphere) {
          if (hoveredSphere) {
            (hoveredSphere.material as THREE.MeshPhongMaterial).emissive.setHex(0x000000);
          }
          (sphere.material as THREE.MeshPhongMaterial).emissive.setHex(0x444444);
          hoveredSphere = sphere;
        }
      } else if (hoveredSphere) {
        (hoveredSphere.material as THREE.MeshPhongMaterial).emissive.setHex(0x000000);
        hoveredSphere = null;
      }
    }

    function onClickPlot() {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(spheres);
      if (intersects.length > 0) {
        const sphere = intersects[0].object as THREE.Mesh;
        (sphere.material as THREE.MeshPhongMaterial).emissive.setHex(0x888800);
        displayPointInfo(sphere.userData.post as Post);
      }
    }

    plot.addEventListener("mousemove", onMouseMovePlot);
    plot.addEventListener("click", onClickPlot);

    function displayPointInfo(post: Post) {
      if (!sidePanel) return;
      sidePanel.innerHTML = `
        <h2>${post.title}</h2>
        <p><strong>Position:</strong> X: ${post.point_x.toFixed(3)}, Y: ${post.point_y.toFixed(3)}, Z: ${post.point_z.toFixed(3)}</p>
        <p><strong>Content:</strong> ${post.post_content_text}</p>
        ${
          post.post_content_image
            ? `<img src="${post.post_content_image}" width="100%" />`
            : ""
        }
      `;
    }

    // Create sprite labels like your raw example
    function createTextLabel(text: string, parentPos: THREE.Vector3) {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = "Bold 20px Arial";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(0.5, 0.25, 1);
      sprite.position.copy(parentPos);
      sprite.position.y += 0.15;
      sprite.userData = { isLabel: true };
      return sprite;
    }

    async function fetchPosts() {
      try {
        const res = await fetch("http://127.0.0.1:8000/posts");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const posts: Post[] = await res.json();
        setPosts(posts);
        setLoading(false);

        sidePanel.textContent = "Click on a point to see details";

        posts.forEach((post, i) => {
          const geometry = new THREE.SphereGeometry(0.05, 16, 16);
          const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(i / posts.length, 0.7, 0.5),
            shininess: 30,
          });
          const sphere = new THREE.Mesh(geometry, material);
          sphere.position.set(post.point_x, post.point_y, post.point_z);
          sphere.userData = { post };
          spheres.push(sphere);
          scene.add(sphere);

          // Add label sprite
          const label = createTextLabel(post.title, sphere.position);
          scene.add(label);
        });
      } catch (error) {
        console.error("Error fetching posts:", error);
        sidePanel.textContent = "Error loading data";
      }
    }

    fetchPosts();

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      window.removeEventListener("resize", onWindowResize);
      resizerRef.current?.removeEventListener("mousedown", onMouseDown);
      plot.removeEventListener("mousemove", onMouseMovePlot);
      plot.removeEventListener("click", onClickPlot);
      controls.dispose();
      renderer.dispose();
      // Optionally clear scene and dispose geometries/materials for cleanup
    };
  }, []);

  return (
    <div
      style={{ display: "flex", height: "100vh", margin: 0, overflow: "hidden" }}
    >
      <div ref={plotRef} style={{ width: "calc(100vw - 300px)", height: "100vh" }} />
      <div
        ref={resizerRef}
        style={{
          width: 5,
          background: "#ccc",
          cursor: "ew-resize",
          height: "100vh",
          userSelect: "none",
        }}
      />
      <div
        ref={sidePanelRef}
        style={{
          width: 300,
          height: "100vh",
          background: "rgba(255, 255, 255, 0.8)",
          borderLeft: "1px solid #ccc",
          overflowY: "auto",
          padding: 10,
          boxSizing: "border-box",
        }}
      >
        {loading && "Loading data..."}
      </div>
    </div>
  );
}
