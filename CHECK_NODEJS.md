# How to Check if You Have Node.js Installed

## What is Node.js?

**Node.js** is a program that lets your computer run JavaScript code (the same language websites use) outside of a web browser. Think of it as the "engine" that powers the backend server and build tools for this application.

**You need it to run the CVPA application.**

## How to Check if You Have It

### Method 1: Check in Terminal (Easiest)

1. Open Terminal on your Mac:
   - Press `Cmd + Space` (Command key + Spacebar)
   - Type "Terminal"
   - Press Enter

2. Copy and paste this command, then press Enter:
   ```bash
   node --version
   ```

3. Look at the result:
   - ✅ **If you see a version number** (like `v18.17.0` or `v20.10.0`):
     - **You have Node.js installed!** You can skip to the next step.
   - ❌ **If you see `command not found` or `zsh: command not found`**:
     - **You don't have Node.js.** You need to install it (see below).

### Method 2: Check if npm exists

Try this command in Terminal:
```bash
npm --version
```

- ✅ **If you see a version number** (like `9.8.1`):
  - **You have Node.js!** (npm comes with Node.js)
- ❌ **If you see `command not found`**:
  - **You need to install Node.js**

## How to Install Node.js (If You Don't Have It)

### Step 1: Download Node.js

1. Go to this website in your web browser:
   ```
   https://nodejs.org/
   ```

2. You'll see two big green buttons:
   - **LTS** (Recommended) - This is the stable, long-term support version
   - **Current** - Latest version (may have newer features but less stable)

3. **Click the LTS button** to download

### Step 2: Install Node.js

1. Find the downloaded file in your Downloads folder (it will be named something like `node-v20.x.x.pkg`)

2. Double-click the `.pkg` file to open the installer

3. Follow the installation wizard:
   - Click "Continue" through the screens
   - Accept the license agreement
   - Click "Install"
   - Enter your Mac password when prompted
   - Wait for installation to complete

4. Click "Close" when installation finishes

### Step 3: Verify Installation

1. **Close and reopen Terminal** (important - you need to restart Terminal for it to recognize Node.js)

2. Run these commands:
   ```bash
   node --version
   npm --version
   ```

3. Both should show version numbers now!

## Next Steps

Once you have Node.js installed, you can proceed with starting the CVPA application. Go back to `SETUP_INSTRUCTIONS.md` and continue from there.

## Still Having Issues?

If you're still not sure:
1. Open Terminal
2. Run: `which node`
3. If it shows a path (like `/usr/local/bin/node`), you have it!
4. If it shows nothing, you need to install it.

---

**TL;DR**: Open Terminal, type `node --version`. If you see a number, you're good! If not, download from nodejs.org and install it.

