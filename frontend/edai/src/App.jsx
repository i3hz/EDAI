// src/App.jsx
import { useState, useEffect } from 'react';
import './App.css'; // We will create this file next

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [annotatedImage, setAnnotatedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (originalImage) URL.revokeObjectURL(originalImage);
      if (annotatedImage) URL.revokeObjectURL(annotatedImage);
    };
  }, [originalImage, annotatedImage]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);

      // Clear previous results
      if (annotatedImage) {
        URL.revokeObjectURL(annotatedImage);
        setAnnotatedImage(null);
      }
      
      // Create a local preview of the original image
      if (originalImage) {
        URL.revokeObjectURL(originalImage);
      }
      setOriginalImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError("Please select an image file first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    // Clear previous annotated image
    if (annotatedImage) {
        URL.revokeObjectURL(annotatedImage);
        setAnnotatedImage(null);
    }

    const formData = new FormData();
    // The key "file" MUST match the name of the parameter in your FastAPI function
    formData.append("file", selectedFile); 

    try {
      // Make sure your FastAPI server is running on http://localhost:8000
      const response = await fetch("http://localhost:8000/detect/", {
        method: "POST",
        body: formData,

      });

      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setAnnotatedImage(imageUrl);
      } else {
        try {
          const errData = await response.json();
          setError(errData.detail || "An unknown error occurred.");
        } catch (jsonError) {
          setError(`HTTP Error: ${response.status} ${response.statusText}`);
        }
      }
    } catch (err) {
      setError(`Network error: ${err.message}. Is the backend server running?`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <header>
        <h1>🌊 Ocean Waste Detection</h1>
        <p>Upload an image to detect waste using your YOLOv8-OBB model.</p>
      </header>
      
      <div className="controls">
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          disabled={isLoading}
        />
        <button 
          onClick={handleSubmit} 
          disabled={!selectedFile || isLoading}
        >
          {isLoading ? "Detecting..." : "Detect Waste"}
        </button>
      </div>

      {error && <p className="error">Error: {error}</p>}

      <div className="image-container">
        {originalImage && (
          <div className="image-box">
            <h3>Original Image</h3>
            <img src={originalImage} alt="Your upload" />
          </div>
        )}
        {annotatedImage && (
          <div className="image-box">
            <h3>Detected Waste</h3>
            <img src={annotatedImage} alt="Annotated with waste detections" />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;