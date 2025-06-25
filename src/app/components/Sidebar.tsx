import { Post } from "./PlotCanvas";
import { useState } from "react";
import Posts from "./Post";
import Settings from "./Settings";

export default function Sidebar({ width, posts }: { width: number; posts: Post[] }) {
  const [activeTab, setActiveTab] = useState("Posts");

  return (
    <div
      style={{
        width,
        height: "100%",
        backgroundColor: "#f4f4f4",
        padding: "1rem",
        boxSizing: "border-box",
        overflowY: "auto",
      }}
    >
      {/* Tabs */}
      <div style={{ display: "flex", marginBottom: "1rem" }}>
        {["Posts", "Settings"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: "0.5rem",
              backgroundColor: activeTab === tab ? "#ddd" : "#fff",
              border: "1px solid #ccc",
              cursor: "pointer",
              color: "#000",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ marginTop: "1rem" }}>
        {activeTab === "Posts" && <Posts posts={posts} />}
        {activeTab === "Settings" && <Settings />}
      </div>
    </div>
  );
}
