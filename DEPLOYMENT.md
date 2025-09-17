# 🚀 Vercel Deployment Guide for MealBox

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Firebase Project**: Your Firebase project should be configured

## 🔧 Deployment Steps

### 1. Push Your Code to GitHub

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Select "tiffin-admin-panel" folder if it's in a subfolder

### 3. Configure Build Settings

Vercel should auto-detect your Vite project, but verify these settings:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. Set Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables, add:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

**⚠️ Important**: Set all environments to "Production", "Preview", and "Development"

### 5. Update Firebase Configuration

In your Firebase Console:

1. Go to **Authentication** → **Settings** → **Authorized Domains**
2. Add your Vercel domain: `your-app-name.vercel.app`
3. Go to **Project Settings** → **General**
4. Add your Vercel domain to authorized domains

### 6. Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete
3. Your app will be available at `https://your-app-name.vercel.app`

## 🔍 Troubleshooting

### Build Errors

If you get build errors:

1. Check that all dependencies are in `package.json`
2. Ensure environment variables are set correctly
3. Check the build logs in Vercel dashboard

### Authentication Issues

If Firebase auth doesn't work:

1. Verify authorized domains in Firebase Console
2. Check environment variables are correct
3. Ensure CORS settings are configured

### Routing Issues

If routes don't work:

1. Verify `vercel.json` is in root directory
2. Check that all routes redirect to `index.html`

## 📱 Testing Your Deployment

1. Visit your Vercel URL
2. Test authentication (email/password and social login)
3. Navigate through different pages
4. Check all features work correctly

## 🔄 Automatic Deployments

Once connected, Vercel will automatically deploy when you push to your main branch:

```bash
git add .
git commit -m "Update feature"
git push origin main
# Vercel will automatically deploy
```

## 🌐 Custom Domain (Optional)

To use a custom domain:

1. Go to Vercel Dashboard → Project → Domains
2. Add your custom domain
3. Configure DNS records as shown
4. Update Firebase authorized domains

## 📊 Performance Optimization

Your Vercel deployment includes:

- ✅ Automatic CDN
- ✅ Image optimization
- ✅ Static file caching
- ✅ Gzip compression
- ✅ HTTP/2 support

## 🎯 Next Steps

After deployment:

1. Test all functionality
2. Monitor performance in Vercel Analytics
3. Set up error monitoring (optional)
4. Configure custom domain (optional)
5. Set up staging environment (optional)

## 📞 Support

If you encounter issues:

1. Check Vercel documentation
2. Review build logs
3. Test locally with `npm run build && npm run preview`
4. Check Firebase Console for any errors

---

🎉 **Congratulations!** Your MealBox admin panel is now live on Vercel!