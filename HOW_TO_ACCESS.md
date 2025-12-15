# How to Access the CVPA Interface

## 🎯 The Interface is a Website

The CVPA interface runs in your web browser. Once everything is started, you'll access it at:

### **http://localhost:3000**

---

## 📋 Complete Setup Steps (Do These First)

### Step 1: Make Sure Node.js is Installed

1. Open Terminal (Cmd+Space, type "Terminal")
2. Type: `node --version` and press Enter
3. If you see a version number → ✅ Good! Skip to Step 2
4. If you see "command not found" → ❌ Install Node.js first (see `INSTALL_NODEJS.md`)

### Step 2: Start the Database

1. Open Terminal
2. Run these commands:
   ```bash
   cd "/Users/OlegLebedev/Documents/My Cursor/SM"
   docker-compose up -d
   ```
3. Wait 20 seconds, then run:
   ```bash
   ./init-db.sh
   ```

### Step 3: Start the Backend Server

1. Open a **NEW Terminal window** (keep the first one open)
2. Run:
   ```bash
   cd "/Users/OlegLebedev/Documents/My Cursor/SM/cvpa-backend"
   npm install
   ```
   (Wait for this to finish - takes 1-2 minutes)
3. Then run:
   ```bash
   npm run dev
   ```
4. **Keep this terminal open!** You should see:
   ```
   ✓ Server running on port 3001
   ```

### Step 4: Start the Frontend (The Interface)

1. Open **ANOTHER NEW Terminal window**
2. Run:
   ```bash
   cd "/Users/OlegLebedev/Documents/My Cursor/SM/cvpa-frontend"
   npm install
   ```
   (Wait for this to finish - takes 1-2 minutes)
3. Then run:
   ```bash
   npm run dev
   ```
4. **Keep this terminal open!** You should see:
   ```
   Local:   http://localhost:3000/
   ```

### Step 5: Open the Interface in Your Browser

1. Open any web browser (Safari, Chrome, Firefox, etc.)
2. In the address bar, type:
   ```
   http://localhost:3000
   ```
3. Press Enter

You should see the **CVPA Login Page**! 🎉

---

## 🔍 Quick Checklist - Is Everything Running?

You need **3 terminal windows open**:

1. ✅ **Terminal 1**: Database (you ran `docker-compose up -d`)
2. ✅ **Terminal 2**: Backend server (you ran `npm run dev` in cvpa-backend, shows "port 3001")
3. ✅ **Terminal 3**: Frontend server (you ran `npm run dev` in cvpa-frontend, shows "port 3000")

Then open browser to: **http://localhost:3000**

---

## 🚨 Troubleshooting

### "Cannot GET /" or "This site can't be reached"
→ The frontend server isn't running. Go to Terminal 3 and make sure you ran `npm run dev`

### "Network Error" or blank page
→ The backend server isn't running. Go to Terminal 2 and make sure you ran `npm run dev`

### The page loads but shows errors
→ Make sure the database is running. Go to Terminal 1 and run `docker-compose up -d` again

### Port 3000 is already in use
→ Something else is using that port. Stop other applications or change the port in `cvpa-frontend/vite.config.ts`

---

## 🎯 Quick Access (Once Everything is Running)

**Just open your browser and go to:**
```
http://localhost:3000
```

That's it! If you see the login page, everything is working!

---

## 📝 First Time Using the Interface?

1. Click "Register" to create an account
2. Enter your name, email, and password
3. Click "Register"
4. You'll be logged in automatically
5. Click "Add Company" to create your first company
6. Click "Start Audit" to run your first audit!

---

**Remember**: The interface is a website at http://localhost:3000 - but you need all the servers running first!

