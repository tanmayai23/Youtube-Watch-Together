# YouTube Watch Together 🎬

A real-time synchronized YouTube video watching application built with Next.js, Socket.IO, and WebRTC.

## Features ✨

- 🏠 **Room-based watching**: Create or join rooms with unique IDs
- 🔄 **Real-time sync**: Video playback synchronized across all participants
- 💬 **Live chat**: Chat with other viewers in real-time
- 🎯 **YouTube URL support**: Paste any YouTube URL to load videos
- 👥 **Multi-user support**: Multiple people can join the same room
- 🎮 **Synchronized controls**: Play, pause, and seek synchronized for everyone

## Quick Start 🚀

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the WebSocket Server
```bash
# Option 1: Use the batch file (Windows)
start-server.bat

# Option 2: Manual start
node scripts/server.js
```

### 3. Start the Web Application
```bash
npm run dev
```

### 4. Open in Browser
Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use 🎯

### Creating/Joining a Room
1. Enter your name
2. Enter a Room ID (create a new one or use an existing one)
3. Click "Join the Fun!"

### Sharing with Friends
1. Share the **Room ID** with your friends
2. Make sure they also have the server running (see Server Setup below)
3. Both users open the application and enter the same Room ID

### Loading YouTube Videos
1. Copy any YouTube URL (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
2. Paste it in the "Paste YouTube URL here..." field
3. Click "Load Video"
4. The video will be synchronized for all room participants

## Important Notes for Room Sharing 📝

### For Local Development
- **Both users need to run the server**: Each person needs to start the WebSocket server locally
- **Same network**: Works best when both users are on the same network
- **Port 4000**: Make sure port 4000 is available and not blocked by firewall

### Server Setup for Each User
1. Clone/download the project
2. Run `npm install`
3. Start the server with `node scripts/server.js` or `start-server.bat`
4. Start the web app with `npm run dev`

### For Production Use
To make it work across different networks, you'll need to:
1. Deploy the WebSocket server to a cloud service (like Heroku, Railway, or DigitalOcean)
2. Update the server URL in the connection manager
3. Share the deployed application URL instead of localhost

## Troubleshooting 🔧

### "Unable to connect to server" Error
- Make sure the WebSocket server is running: `node scripts/server.js`
- Check if port 4000 is available
- Verify no firewall is blocking the connection

### YouTube Videos Not Loading
- Check console for errors (F12 → Console)
- Ensure the YouTube URL is valid
- Try using different YouTube URL formats:
  - `https://www.youtube.com/watch?v=VIDEO_ID`
  - `https://youtu.be/VIDEO_ID`
  - Just the video ID: `VIDEO_ID`

### Room Sharing Issues
- Both users must have the server running locally
- Use the exact same Room ID
- Check browser console for connection errors

### Video Not Syncing
- Check internet connection stability
- Ensure both users are connected (green status indicator)
- Try refreshing the page and rejoining the room

## Project Structure

\`\`\`
├── app/
│   ├── page.tsx              # Main application component
│   ├── layout.tsx            # Root layout with fonts
│   └── globals.css           # Global styles and design tokens
├── components/
│   ├── youtube-player.tsx    # YouTube player with sync logic
│   ├── chat-panel.tsx        # Real-time chat interface
│   └── connection-manager.tsx # WebRTC connection handling
├── scripts/
│   └── server.js             # Socket.io signaling server
└── package.json              # Dependencies and scripts
\`\`\`

## Development

### Running the Signaling Server

The signaling server handles WebRTC connection establishment and room management:

\`\`\`bash
npm run server
\`\`\`

Server runs on `http://localhost:4000` by default.

### Environment Variables

No environment variables required for basic functionality. The app uses:

- Frontend: `http://localhost:3000`
- Signaling Server: `http://localhost:4000`

### Customization

- **Styling**: Modify `app/globals.css` for design tokens
- **Server Port**: Change PORT in `scripts/server.js`
- **STUN Servers**: Update `rtcConfig` in `connection-manager.tsx`

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+

WebRTC features require modern browser support.

## Troubleshooting

### Connection Issues

1. Ensure both signaling server and Next.js dev server are running
2. Check browser console for WebRTC errors
3. Verify firewall settings allow WebRTC connections
4. Try refreshing the page if connections fail

### Video Sync Issues

1. Check that all users have loaded the same video
2. Verify YouTube video is not region-restricted
3. Ensure stable internet connection for all participants
4. Try reloading the video if sync drifts

### Chat Not Working

1. Verify WebRTC data channel connections are established
2. Check browser console for data channel errors
3. Ensure users are in the same room
4. Try reconnecting to the room

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for learning or building your own watch party applications.
