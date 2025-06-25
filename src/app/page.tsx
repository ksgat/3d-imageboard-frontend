"use client";
import { useEffect, useState, useRef } from "react";
import PlotCanvas, { Post } from "./components/PlotCanvas";
import Sidebar from "./components/Sidebar";

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef(false);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });

  // Fetch posts on mount
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch("/api/posts");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error("Could not fetch posts:", error);
      }
    };
    fetchPosts();
  }, []);

  // Resize canvas when sidebar resizes or window resizes
  const updateCanvasDimensions = () => {
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const calculatedWidth = containerRect.width - sidebarWidth - 6; // Subtract handle width
      setCanvasDimensions({
        width: Math.max(calculatedWidth, 100),
        height: containerRect.height,
      });
    }
  };

  useEffect(() => {
    updateCanvasDimensions(); // Initial call
    window.addEventListener("resize", updateCanvasDimensions);

    return () => {
      window.removeEventListener("resize", updateCanvasDimensions);
    };
  }, [sidebarWidth, containerRef.current]); // Add dependency array to prevent unnecessary calls

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newWidth = Math.min(Math.max(window.innerWidth - e.clientX, 150), window.innerWidth - 100);
      setSidebarWidth(newWidth);
    };

    const stopDragging = () => {
      isDragging.current = false;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopDragging);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", stopDragging);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden" }}
    >
      {/* Canvas area */}
      <div style={{ flexGrow: 1 }}>
        <PlotCanvas posts={posts} width={canvasDimensions.width} height={canvasDimensions.height} />
      </div>

      {/* Drag handle */}
      <div
        onMouseDown={() => (isDragging.current = true)}
        style={{
          width: "6px",
          cursor: "col-resize",
          backgroundColor: "#ccc",
        }}
      />

      {/* Sidebar */}
      <Sidebar width={sidebarWidth} posts={posts} />
    </div>
  );
}
