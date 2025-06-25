import { useState } from "react";
import { Post } from "./PlotCanvas";

const CLOUD_NAME = "didu3zhu4";
const UPLOAD_PRESET = "ml_default";

async function convertToWebP(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  ctx?.drawImage(bitmap, 0, 0);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
    }, "image/webp", 0.9);
  });
}

async function uploadToCloudinary(webpBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("file", webpBlob);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Cloudinary upload failed");

  const data = await res.json();
  return data.secure_url;
}


export default function Posts({ posts }: { posts: Post[] }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const handleImageUpload = async () => {
    if (!image) return null;

    // Convert image to webp format
    const webpBlob = await convertToWebP(image);

    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(webpBlob);
    return imageUrl;
  };

  const handleSubmit = async () => {
    const imageUrl = await handleImageUpload();
    const requestBody = { 
      title, // Title first
      text,  // Text second
      image_url: imageUrl || "" // Image URL last
    };
    console.log("Request Body:", requestBody); // Log the request body
    const response = await fetch("/api/post", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    });
    if (response.ok) {
      alert("Post created successfully!");
    } else {
      alert("Failed to create post. ");
    }
  };

  return (
    <div>
      <h2 style={{ color: "#000" }}>Posts</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        style={{
          marginBottom: "2rem",
          padding: "1rem",
          backgroundColor: "#f9f9f9",
          border: "1px solid #ddd",
          borderRadius: "4px",
          color: "#000", // Ensure form text is black
        }}
      >
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            display: "block",
            marginBottom: "1rem",
            width: "100%",
            color: "#000", // Ensure input text is black
          }}
        />
        <textarea
          placeholder="Text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            display: "block",
            marginBottom: "1rem",
            width: "100%",
            color: "#000", // Ensure textarea text is black
          }}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
          style={{
            display: "block",
            marginBottom: "1rem",
            color: "#000", // Ensure file input text is black
          }}
        />
        <button
          type="submit"
          style={{
            display: "block",
            width: "100%",
            color: "#000", // Ensure button text is black
          }}
        >
          Submit
        </button>
      </form>
      {posts.map((post, i) => (
        <div
          key={i}
          style={{
            marginBottom: "1rem",
            padding: "0.75rem",
            backgroundColor: "#fff",
            border: "1px solid #ddd",
            borderRadius: "4px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            color: "#000", // Ensure post text is black
          }}
        >
          <h3 style={{ color: "#000" }}>{post.title}</h3>
          <p style={{ color: "#000" }}>{post.post_content_text}</p>
          {post.post_content_image && (
            <img src={post.post_content_image} alt={post.title} width="100%" />
          )}
        </div>
      ))}
    </div>
  );
}

