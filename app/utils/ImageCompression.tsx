// app/utils/ImageCompression.ts

export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Configuration
    const maxWidth = 1200; // Resize huge 4K images to 1200px width
    const quality = 0.8;   // 80% JPEG quality (great balance)
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions (Maintain Aspect Ratio)
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Browser does not support canvas image compression"));
          return;
        }

        // Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Export compressed JPEG as Base64 string
        // 'image/jpeg' format is much smaller than PNG for photos
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.onerror = (err) => reject(new Error("Failed to load image for compression"));
    };
    
    reader.onerror = (err) => reject(new Error("Failed to read file"));
  });
};