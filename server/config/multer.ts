import multer from "multer";

// Configure multer storage
const storage = multer.memoryStorage(); // Store files in memory for further processing

// Create multer instance with storage configuration
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },    // Limit file size to 5MB
}); 

export default upload;
