# 🔗 Convex Setup Guide

This guide will help you set up Convex for conversation persistence in your T3 Chat Clone.

## 🚀 Quick Setup

### 1. **Initialize Convex**
```bash
npx convex dev
```

Follow the prompts:
- Sign in to your Convex account (or create one)
- Create a new project or select existing
- Choose deployment name

### 2. **Get Environment Variables**
After initialization, you'll see something like:
```
✓ Configured your Convex app!
  Deployment URL: https://your-deployment.convex.cloud
  Dashboard: https://dashboard.convex.dev/d/your-deployment
```

### 3. **Update Environment File**
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Convex details:
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
CONVEX_DEPLOYMENT=your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### 4. **Start Development**
```bash
npm run dev
```

## ✨ **What You Get**

### **Persistent Conversations**
- ✅ Conversations saved to Convex database
- ✅ Chat history persists between sessions
- ✅ Sidebar shows conversation list
- ✅ Click to switch between conversations

### **Real-time Updates**
- ✅ Messages sync in real-time
- ✅ Multiple tabs stay in sync
- ✅ No data loss on refresh

### **User Management**
- ✅ Simple anonymous user system
- ✅ Each browser gets unique user ID
- ✅ Conversations tied to user

## 🔧 **How It Works**

### **Database Schema**
- **Users**: Anonymous users with generated IDs
- **Conversations**: Chat sessions with titles
- **Messages**: Individual chat messages with metadata

### **Key Features**
- **Auto-conversation creation**: First message creates new conversation
- **Smart titles**: Generated from first message
- **Message persistence**: All messages saved with metadata
- **Conversation management**: Delete, rename (coming soon)

## 🚨 **Troubleshooting**

### **Build Errors**
If you see Convex-related build errors:
1. Make sure `npx convex dev` completed successfully
2. Check that environment variables are set
3. Restart development server

### **Empty Sidebar**
If conversations don't appear:
1. Check browser console for errors
2. Verify Convex URL is accessible
3. Make sure you've sent at least one message

### **Development vs Production**
- Development: Uses Convex dev deployment
- Production: Create separate Convex production deployment

## 📊 **Convex Dashboard**

Visit your dashboard to:
- View database contents
- Monitor function calls
- Check logs and errors
- Manage deployments

## 🎯 **Next Steps**

With Convex working, you can now:
- Chat with AI models
- Switch between conversations
- See persistent chat history
- Everything saves automatically!

---

🎉 **Convex integration complete!** Your chat app now has full conversation persistence.