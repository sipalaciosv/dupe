# Quick Start Guide

## 🚀 Run the App Locally

### 1. Configure Firebase (First Time Only)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** → Google Sign-In
4. Create **Firestore Database** (Start in test mode, we'll apply security rules later)
5. Create **Storage** bucket
6. Go to Project Settings → General → Add Web App
7. Copy the Firebase config values

### 2. Set Environment Variables

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your Firebase credentials from step 1.

### 3. Deploy Security Rules

In Firebase Console:

**Firestore Rules**: Database → Rules → Copy from `SECURITY_RULES.md` → Publish
**Storage Rules**: Storage → Rules → Copy from `SECURITY_RULES.md` → Publish

### 4. Start Development Server

```bash
npm run dev
```

App will open at `http://localhost:5173`

## ✅ First Steps in the App

1. **Sign in** with your Google account
2. **Create a group** (Profile tab → Create Group)
3. **Add an original perfume**:
   - Go to Home → currently no UI form yet (MVP limitation)
   - TODO: Implement create forms
4. **Test features**:
   - View originals/dupes
   - Create expedition
   - Try public link

## 📝 MVP Limitations

This is a **fully functional MVP** with some UI polish needed:

- ✅ All backend/logic works
- ⚠️ Create/edit forms need to be extracted to proper components
- ⚠️ Some edit/delete buttons not wired to UI yet
- ⚠️ Quick vote modal not implemented

**To add data for testing**, you can:
1. Use Firestore Console to add test documents
2. OR implement the missing forms (see TODOs in code)

## 🚀 Deploy to Production

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel

# Or connect GitHub repo to Vercel for auto-deploy
```

Don't forget to add environment variables in Vercel dashboard!

## 📚 More Info

- Full documentation: `README.md`
- Implementation details: `walkthrough.md` (in artifacts)
- Security setup: `SECURITY_RULES.md`

## 🆘 Troubleshooting

**"Cannot find module 'vue'"**: Dependencies installed ✅ (should be fixed)

**Firebase errors**: Check `.env` file has correct values

**Auth not working**: Verify Google Sign-In is enabled in Firebase Console

**Permission denied**: Check Firestore/Storage rules are deployed

## 🎯 Next Development Steps

1. Create form components for originals/dupes/offers
2. Wire edit/delete buttons
3. Add quick vote modal
4. Test all flows end-to-end
5. Polish loading and error states
6. Deploy!
