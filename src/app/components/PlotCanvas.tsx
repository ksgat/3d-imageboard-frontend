import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import PostView from './PostView';

interface Post {
    title: string;
    point_x: number;
    point_y: number;
    point_z: number;
    post_content_text: string;
    post_content_image?: string;
}

interface PlotCanvasProps {
    posts: Post[];
    width: number;
    height: number;
}

const PlotCanvas: React.FC<PlotCanvasProps> = ({ posts, width, height }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#f5f5dc');
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(Math.max(width, 300), Math.max(height, 300)); // Ensure minimum size

        mountRef.current.appendChild(renderer.domElement);

        // Orbit controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 1;
        controls.maxDistance = 10;
        controls.target.set(0, 0, 0);
        camera.position.set(3, 3, 3);
        controls.enablePan = true;
        controls.panSpeed = 0.5;
        controls.update();

        // Lights
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        // Grid
        const gridSize = 10;
        const gridDivisions = 20;
        const gridColor = '#d3d3d3';

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

        // Render posts
        const spheres: THREE.Mesh[] = [];

        posts.forEach((post, index) => {
            const geometry = new THREE.SphereGeometry(0.05, 16, 16);
            const material = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(index / posts.length, 0.7, 0.5),
                shininess: 30
            });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(post.point_x, post.point_y, post.point_z);
            sphere.userData = { post };
            spheres.push(sphere);

            // Add label
            const label = createTextLabel(post.title, sphere);
            scene.add(label);

            scene.add(sphere);
        });

        // Raycasting and Hover/Click Effects
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        let hoveredSphere: THREE.Mesh | null = null;

        const onMouseMove = (event: MouseEvent) => {
            if (!mountRef.current) return;
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = -(((event.clientX - rect.left) / rect.width) * 2 - 1); // Invert X-axis
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 - 1; // Invert Y-axis

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
        };

        const onMouseClick = (event: MouseEvent) => {
            if (!mountRef.current) return;
            const rect = renderer.domElement.getBoundingClientRect();
            const mouseClick = new THREE.Vector2();
            mouseClick.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouseClick.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouseClick, camera);
            const intersects = raycaster.intersectObjects(spheres);
            
            if (intersects.length > 0) {
                const sphere = intersects[0].object as THREE.Mesh;
                (sphere.material as THREE.MeshPhongMaterial).emissive.setHex(0x888800);
                displayPointInfo(sphere.userData.post);
            }
        };

        mountRef.current.addEventListener('mousemove', onMouseMove, false);
        mountRef.current.addEventListener('click', onMouseClick, false);

        // Text Label Function
        function createTextLabel(text: string, parent: THREE.Mesh): THREE.Sprite {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 128;
            const context = canvas.getContext('2d') as CanvasRenderingContext2D;
            context.fillStyle = 'rgba(0, 0, 0, 0.7)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.font = 'Bold 20px Arial';
            context.fillStyle = 'white';
            context.textAlign = 'center';
            context.fillText(text, canvas.width / 2, canvas.height / 2);

            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(0.5, 0.25, 1);
            sprite.position.copy(parent.position);
            sprite.position.y += 0.15;
            sprite.userData = { isLabel: true };

            return sprite;
        }

        // Point Info Display
        function displayPointInfo(post: Post) {
            console.log("Clicked Post:", post);
            setSelectedPost(post);
        }

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };

        animate();

        const handleResize = () => {
            if (!mountRef.current) return;
            const containerWidth = mountRef.current.clientWidth;
            const containerHeight = mountRef.current.clientHeight;
        
            camera.aspect = containerWidth / containerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(containerWidth, containerHeight);
        };


        window.addEventListener('resize', handleResize);
        handleResize(); // Initial adjustment

        // Cleanup
        return () => {
            if (!mountRef.current) return;
            
            // Remove all scene children
            while(scene.children.length > 0) {
                const child = scene.children[0];
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
                scene.remove(child);
            }
        
            mountRef.current.removeChild(renderer.domElement);
            window.removeEventListener('resize', handleResize);
            mountRef.current.removeEventListener('mousemove', onMouseMove);
            mountRef.current.removeEventListener('click', onMouseClick);
            renderer.dispose();
        };
    }, [posts, width, height]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
            {selectedPost && (
                <PostView selectedPost={selectedPost} onClose={() => setSelectedPost(null)} />
            )}
        </div>
    );
};

export default PlotCanvas;
export type { Post };

