import React from "react";

interface PostOverlayProps {
    selectedPost: {
        title: string;
        post_content_text: string;
        post_content_image?: string;
    } | null;
    onClose: () => void;
}

const PostOverlay: React.FC<PostOverlayProps> = ({ selectedPost, onClose }) => {
    if (!selectedPost) return null;

    return (
        <div className="fixed inset-5 bg-white bg-opacity-90 border border-gray-300 p-4 overflow-auto text-black">
            <button
                onClick={onClose}
                className="absolute top-2 right-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 rounded"
            >
                Close
            </button>
            <h2 className="text-xl font-bold">{selectedPost.title}</h2>
            <p className="mt-2">{selectedPost.post_content_text}</p>
            {selectedPost.post_content_image && (
                <img
                    src={selectedPost.post_content_image}
                    alt={selectedPost.title}
                    className="mt-4 max-w-full"
                />
            )}
        </div>
    );
};

export default PostOverlay;
