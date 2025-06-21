# T3 Chat Clone - Setup Guide

A premium chat application built for the T3 Chat Cloneathon with multi-provider AI support, BYOK, and beautiful UI.

## ✨ Features

- 🤖 **Multi-Provider AI**: OpenAI, Anthropic, Google, OpenRouter
- 🔑 **BYOK Support**: Bring Your Own Key - API keys stored locally
- 💬 **Real-time Chat**: Streaming responses with beautiful UI
- 🎨 **Modern Design**: Dark/light mode, responsive layout
- 📱 **Mobile Friendly**: Works great on all devices
- 🔧 **Type Safe**: Full TypeScript support

## 🚀 Quick Start

1. **Clone and Install**
   ```bash
   git clone <your-repo>
   cd bosschat
   npm install --legacy-peer-deps
   ```

2. **Set up Environment**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your settings
   ```

3. **Start Development**
   ```bash
   npm run dev
   ```
   The app will run on http://localhost:3000 (or the next available port)

4. **Configure API Keys**
   - Open the app in your browser
   - Click "API Keys" in the header
   - Add your API keys for the providers you want to use

5. **Start Chatting!**
   - Select a model from the dropdown
   - Start typing and enjoy premium AI chat!

## 🔑 Getting API Keys

### OpenAI
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new secret key
3. Add it to the app (starts with `sk-`)

### Anthropic
1. Go to [Anthropic Console](https://console.anthropic.com/settings/keys)
2. Create a new API key
3. Add it to the app (starts with `sk-ant-`)

### Google AI
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to the app

### OpenRouter
1. Go to [OpenRouter Keys](https://openrouter.ai/keys)
2. Create a new API key
3. Add it to the app (starts with `sk-or-`)

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4 + Radix UI
- **AI**: Vercel AI SDK with multiple providers
- **Backend**: Convex (optional, for persistence)
- **Type Safety**: TypeScript
- **Markdown**: React Markdown with Tailwind Typography

## 📁 Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── api/chat/       # Chat API endpoint
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
│   ├── ui/            # Base UI components
│   ├── chat-container.tsx
│   ├── chat-input.tsx
│   ├── chat-message.tsx
│   ├── header.tsx
│   ├── model-picker.tsx
│   └── api-key-dialog.tsx
├── hooks/             # Custom React hooks
│   └── use-chat.ts    # Chat logic
├── lib/               # Utilities
│   ├── api-keys.ts    # BYOK management
│   ├── providers.ts   # AI provider configs
│   └── utils.ts       # Common utilities
├── providers/         # React providers
│   └── theme-provider.tsx
└── types/             # TypeScript types
    └── index.ts
```

## 🎯 Key Features Implemented

### ✅ Core Features
- Multi-provider AI chat with streaming
- BYOK API key management (localStorage)
- Beautiful chat interface
- Dark/light mode toggle
- Model picker with provider info
- Responsive design

### 🚧 In Progress
- File upload support (images/PDFs)
- Message branching
- Conversation sharing
- Web search integration
- Convex integration for persistence

## 🔧 Configuration

The app uses local storage for API key management. No server-side storage of keys ensures privacy and security.

### Environment Variables
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Customization
- Modify `src/lib/providers.ts` to add more AI models
- Update `src/components/ui/` for design changes
- Extend `src/types/index.ts` for new features

## 🚀 Deployment

1. **Build the app**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   npx vercel
   ```

3. **Set environment variables** in your deployment platform

## 🤝 Contributing

This project was built for the T3 Chat Cloneathon. Feel free to:
- Report issues
- Suggest improvements
- Submit pull requests

## 📄 License

MIT License - see LICENSE file for details.

---

Built with ❤️ for the T3 Chat Cloneathon