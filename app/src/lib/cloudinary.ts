// src/lib/cloudinary.ts
// This file handles uploading images to Cloudinary

import { v2 as cloudinary } from 'cloudinary';

// ============================================
// CLOUDINARY CONFIGURATION
// ============================================
// This configures Cloudinary with your credentials from .env.local
// Make sure you have these in your .env.local file:
// CLOUDINARY_CLOUD_NAME=your_cloud_name
// CLOUDINARY_API_KEY=your_api_key
// CLOUDINARY_API_SECRET=your_api_secret

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ============================================
// UPLOAD SINGLE IMAGE
// ============================================
// This function takes a base64 image string and uploads it to Cloudinary
// Returns the secure URL of the uploaded image

export async function uploadImage(base64Image: string): Promise<string> {
  try {
    // Validate environment variables
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary credentials are not configured. Please check your .env.local file.');
    }

    console.log('📤 Uploading image to Cloudinary...');
    console.log('🔧 Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);

    // Upload the image to Cloudinary
    // Note: Using eager transformations to optimize on upload
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'solo-hiker/trips',
      resource_type: 'auto',
      eager: [
        {
          width: 1200,
          height: 800,
          crop: 'limit',
          quality: 'auto',
        },
      ],
      eager_async: false,
    });

    console.log('✅ Image uploaded successfully:', result.secure_url);

    // Return the secure HTTPS URL
    return result.secure_url;
  } catch (error: any) {
    console.error('❌ Cloudinary upload failed:', error);
    console.error('📋 Error Details:', {
      message: error.message,
      http_code: error.http_code,
      status: error.status,
    });
    throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
  }
}

// ============================================
// UPLOAD MULTIPLE IMAGES
// ============================================
// This function uploads multiple images in parallel
// Returns an array of secure URLs

export async function uploadMultipleImages(
  base64Images: string[]
): Promise<string[]> {
  try {
    console.log(`📤 Uploading ${base64Images.length} images to Cloudinary...`);

    // Upload all images in parallel for better performance
    const uploadPromises = base64Images.map((image) => uploadImage(image));

    // Wait for all uploads to complete
    const imageUrls = await Promise.all(uploadPromises);

    console.log(`✅ All ${imageUrls.length} images uploaded successfully`);

    return imageUrls;
  } catch (error: any) {
    console.error('❌ Failed to upload multiple images:', error);
    throw new Error('Failed to upload images');
  }
}

// ============================================
// DELETE IMAGE
// ============================================
// This function deletes an image from Cloudinary
// Useful when user removes an image from their trip

export async function deleteImage(imageUrl: string): Promise<boolean> {
  try {
    // Extract public_id from the URL
    // Example URL: https://res.cloudinary.com/your-cloud/image/upload/v123/solo-hiker/trips/abc.jpg
    // Public ID: solo-hiker/trips/abc
    const publicId = imageUrl
      .split('/')
      .slice(-3) // Get last 3 parts: ['solo-hiker', 'trips', 'abc.jpg']
      .join('/')
      .replace(/\.[^/.]+$/, ''); // Remove file extension

    console.log('🗑️ Deleting image from Cloudinary:', publicId);

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      console.log('✅ Image deleted successfully');
      return true;
    }

    console.log('⚠️ Image deletion failed:', result);
    return false;
  } catch (error: any) {
    console.error('❌ Failed to delete image:', error);
    return false;
  }
}

// ============================================
// HELPER: CONVERT FILE TO BASE64
// ============================================
// This is a client-side helper to convert a File object to base64
// Used in the frontend before uploading

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/*
===========================================
HOW TO USE THIS IN YOUR API ROUTE:
===========================================

import { uploadMultipleImages } from '@/lib/cloudinary';

// In your API route:
export async function POST(req: Request) {
  const body = await req.json();
  
  // body.images = array of base64 strings from frontend
  const imageUrls = await uploadMultipleImages(body.images);
  
  // Now save imageUrls to database
  await prisma.trip.create({
    data: {
      images: imageUrls, // Array of Cloudinary URLs
      // ... other fields
    }
  });
}

===========================================
HOW TO USE IN FRONTEND:
===========================================

import { fileToBase64 } from '@/lib/cloudinary';

const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  
  // Convert all files to base64
  const base64Images = await Promise.all(
    files.map(file => fileToBase64(file))
  );
  
  // Now send to API
  await fetch('/api/trips/create', {
    method: 'POST',
    body: JSON.stringify({ images: base64Images })
  });
};

===========================================
*/