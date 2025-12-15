# Steps to Access the Interface

## ✅ Step 1: Database Started (You just did this!)
Your database is starting. Wait 20 seconds, then continue.

## ✅ Step 2: Initialize Database
In the same terminal, run:
```bash
./init-db.sh
```

You should see: `✓ Database initialized successfully` or similar.

---

## ✅ Step 3: Start Backend Server
**Open a NEW Terminal window** (keep the first one open), then run:

```bash
cd "/Users/OlegLebedev/Documents/My Cursor/SM/cvpa-backend"
npm install
```

Wait 1-2 minutes for installation to finish, then run:
```bash
npm run dev
```

**Keep this terminal open!** You should see:
```
✓ Server running on port 3001
```

---

## ✅ Step 4: Start Frontend Server (The Interface)
**Open ANOTHER NEW Terminal window**, then run:

```bash
cd "/Users/OlegLebedev/Documents/My Cursor/SM/cvpa-frontend"
npm install
```

Wait 1-2 minutes for installation to finish, then run:
```bash
npm run dev
```

**Keep this terminal open!** You should see:
```
Local:   http://localhost:3000/
```

---

## 🎯 Step 5: Open the Interface!

Open your web browser (Safari, Chrome, etc.) and go to:

### **http://localhost:3000**

You should see the **CVPA Login Page**! 🎉

---

## 📋 Quick Checklist

- [ ] Database is running (Step 1 - done!)
- [ ] Database initialized (`./init-db.sh`)
- [ ] Backend server running (Terminal 2 shows "port 3001")
- [ ] Frontend server running (Terminal 3 shows "port 3000")
- [ ] Browser opened to http://localhost:3000

---

## 🆘 If Something Doesn't Work

**"npm: command not found"**
→ You need to install Node.js first (see `INSTALL_NODEJS.md`)

**"Cannot connect to database"**
→ Wait 30 seconds and try running `./init-db.sh` again

**Port 3000 or 3001 already in use**
→ Close other applications using those ports

**Blank page or errors in browser**
→ Make sure both backend AND frontend terminals are running

---

**Once you see the login page at http://localhost:3000, you're all set!**

