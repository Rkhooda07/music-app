# Music App - Network Configuration & Troubleshooting Guide

## Quick Setup

### Step 1: Find Your Machine's Local IP Address

**macOS:**
```bash
ipconfig getifaddr en0
```
Output example: `192.168.0.207`

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your network adapter (usually 192.168.x.x)

**Linux:**
```bash
hostname -I
```

### Step 2: Update Frontend Configuration

Edit `frontend/.env`:
```
EXPO_PUBLIC_API_URL=http://YOUR_IP_HERE:3000
```

Example:
```
EXPO_PUBLIC_API_URL=http://192.168.0.207:3000
```

**IMPORTANT:** 
- ✅ Use `http://` (not https)
- ✅ Use port `3000` (not 8081)
- ✅ Do NOT include `/api/music` in the URL
- ✅ Use your machine's LOCAL IP, not public IP

### Step 3: Start Backend

```bash
cd backend
npm run dev
```

You should see: `Server is running in development mode on 0.0.0.0:3000`

### Step 4: Start Frontend (on Phone or Emulator)

```bash
cd frontend
npx expo start
```

Then:
- **Physical Phone**: Scan QR code with Expo app
- **Android Emulator**: Press `a`
- **iOS Simulator**: Press `i`

---

## Verification Checklist

Before testing, verify:

- [ ] Backend is running on `0.0.0.0:3000`
- [ ] Phone is on same WiFi as your machine
- [ ] Frontend `.env` has correct IP address
- [ ] No typos in `EXPO_PUBLIC_API_URL`
- [ ] Port 3000 is not blocked by firewall

### Network Verification Command

On your machine, test if the backend is accessible:
```bash
curl http://localhost:3000/api/music/search?q=test
```

Should return JSON data, not a connection error.

---

## Common Issues & Solutions

### ❌ "Backend unreachable from this device"

**Cause 1: Wrong IP Address**
- Run `ipconfig getifaddr en0` again to get correct IP
- Update `.env` file

**Cause 2: Phone on Different Network**
- Make sure phone and backend are on same WiFi
- Check phone WiFi settings → note the network name
- Your machine should be on same WiFi

**Cause 3: Firewall Blocking**
- **macOS**: System Preferences → Security & Privacy → Firewall
  - Click "Firewall Options"
  - Uncheck "Block all incoming connections"
- **Windows**: Windows Defender Firewall
  - Allow Node.js through firewall
- **Linux**: `sudo ufw allow 3000`

**Cause 4: Wrong Port**
- Backend MUST run on port 3000
- Check backend terminal shows `0.0.0.0:3000`
- If using different port, update `.env` accordingly

### ❌ Phone Can't Find Backend (DNS/Connection)

**Solution**: Use IP address instead of hostname
- Don't use: `http://machine-name.local:3000`
- Use: `http://192.168.0.207:3000` (your actual IP)

### ✅ Shows Fallback Tracks Instead of Real Ones

This is expected when:
- Backend is not reachable (connection error)
- API returns no results
- Network is slow

**To verify fallback is working:**
- Try "Retry" button to re-attempt connection
- Check backend logs for errors
- Verify backend is actually running

---

## Debug Logging

The app logs all API calls in development. Open console to see:

```
[API Config] Base URL: http://192.168.0.207:3000/api/music
[API Config] Platform: android
[API] Searching for: "test"
[API] Found 5 results
```

---

## For Emulator/Simulator

### Android Emulator
```
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```
(10.0.2.2 is the special Android emulator host alias)

### iOS Simulator
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```
(iOS simulator shares your machine's localhost)

---

## Backend Requirements

1. **Node.js**: v14 or higher
2. **Port 3000**: Must be available and open
3. **Running**: Backend must be started with `npm run dev`
4. **API Endpoints**:
   - `GET /api/music/search?q=<query>` - Search for songs
   - `GET /api/music/url/<videoId>` - Get stream URL

---

## Testing Connection

### From Your Machine

```bash
# Test backend is running
curl http://localhost:3000/api/music/search?q=test

# Should return:
# {"data":[{"id":"...", "title":"...", ...}]}
```

### From Phone

If backend is on `192.168.0.207`:
- Open browser on phone
- Navigate to: `http://192.168.0.207:3000/api/music/search?q=test`
- Should see JSON response

If you see connection error, backend is not reachable from phone.

---

## Helpful Debugging Tips

1. **Check Logs**: 
   - Backend: Terminal running `npm run dev`
   - Frontend: Expo console in terminal

2. **Verify Network**:
   - `ping 192.168.0.207` from phone's browser
   - Try accessing backend URL directly in phone browser

3. **Try Restart**:
   - Stop backend: `Ctrl+C`
   - Stop frontend: `Ctrl+C`
   - Start backend again
   - Start frontend again

4. **Clear Cache**:
   - Android: Settings → Apps → Music App → Storage → Clear Cache
   - iOS: Offload app, then reinstall

---

## API Response Format

### Search Endpoint
```
GET /api/music/search?q=jazz
```
Expected response:
```json
{
  "data": [
    {
      "id": "xyz123",
      "title": "Jazz Song",
      "artist": "Artist Name",
      "duration": 240,
      "thumbnail": "https://...",
      "url": "https://stream-url"
    }
  ]
}
```

### Stream URL Endpoint
```
GET /api/music/url/videoId
```
Expected response:
```json
{
  "url": "https://stream-url.mp3"
}
```

---

## Still Not Working?

1. Share backend console output
2. Share frontend console output
3. Confirm IP address and port
4. Verify `frontend/.env` content
5. Try direct browser test from phone

All these files are robust with retry logic, timeouts, and better error messages!
