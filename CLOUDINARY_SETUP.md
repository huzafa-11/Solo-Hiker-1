# Cloudinary Setup Guide

## ❌ Error: "Invalid Signature - Unauthorized"

This error means your Cloudinary API credentials are missing or incorrect.

## ✅ How to Fix

### Step 1: Create a Cloudinary Account (if you don't have one)
1. Go to https://cloudinary.com
2. Sign up for a free account
3. Verify your email

### Step 2: Get Your API Credentials
1. Log in to https://cloudinary.com/console
2. Look at the dashboard - you'll see:
   - **Cloud Name** (e.g., `d1234567890`)
   - **API Key** (e.g., `1234567890123456`)
   - **API Secret** (click "View API Secret" to reveal it)

### Step 3: Create `.env.local` File
1. In the root of your project (`c:\Users\NexGen\Desktop\dev\solo-hiker`), create a new file called `.env.local`
2. Add these lines (replace with your actual values):

```
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Example:**
```
CLOUDINARY_CLOUD_NAME=d1234567890
CLOUDINARY_API_KEY=1234567890123456
CLOUDINARY_API_SECRET=abc123xyz789def456ghi789
```

### Step 4: Restart Your Development Server
1. Stop the current server (press `Ctrl+C` in terminal)
2. Run: `npm run dev`
3. Try uploading an image again

## 🔒 Security Note
- **NEVER** commit `.env.local` to Git
- It's already listed in `.gitignore`
- Keep your API Secret private!

## 🧪 Testing the Upload
You can test the upload by:
1. Going to http://localhost:3000/createTrip
2. Filling out the form
3. Uploading an image
4. Clicking "Create Trip"

## ❓ Troubleshooting

**Still getting "Invalid Signature"?**
- Double-check that you copied the credentials correctly
- Make sure there are no extra spaces in your `.env.local`
- Verify your Cloud Name is correct
- Switch quotes (use double quotes if using single, or vice versa)

**Getting "Credentials not configured"?**
- Your `.env.local` file isn't in the correct location
- The filename must be exactly `.env.local`
- Restart the development server after creating/editing `.env.local`

**Cloudinary dashboard shows limits reached?**
- Free accounts have upload limits
- Check your Cloudinary console for usage stats
- Consider upgrading or using a different account

## 📚 More Information
- Cloudinary Docs: https://cloudinary.com/documentation
- API Reference: https://cloudinary.com/documentation/image_upload_api
