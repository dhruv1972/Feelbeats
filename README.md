# FeelBeats - Mood-Based Music Web App

## Project Description

FeelBeats is a modern web application that allows users to select their current mood and instantly get personalized music recommendations along with matching visual elements. The app combines the power of multiple APIs to create a cohesive and immersive user experience with **live music playback directly on the website**.

## Features

- **Mood Selection**: Choose from 8 different moods (Chill, Energetic, Romantic, Focus, Happy, Sad, Angry, Peaceful)
- **Dynamic Theming**: The entire interface changes colors based on the selected mood
- **Live Music Playback**: Listen to music directly on the website using Spotify Web Playback SDK
- **Music Player Controls**: Play, pause, skip tracks, and control volume
- **Playlist Integration**: Click on playlists to start playing them immediately
- **Visual Elements**: Mood-matching GIFs from Giphy API
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Smooth Animations**: Beautiful transitions and hover effects
- **Touch Support**: Swipe gestures for mobile users
- **Spotify Authentication**: Secure OAuth flow for music playback

## APIs Used

### 1. Spotify Web API + Web Playback SDK
- **Purpose**: Provide music playlist recommendations and live music playback
- **Integration**: Full OAuth authentication with real-time music controls
- **Features**: Play, pause, skip, volume control, progress tracking
- **URL**: https://developer.spotify.com/documentation/web-api/

### 2. Giphy API
- **Purpose**: Fetch mood-matching GIFs for visual engagement
- **Integration**: Real-time GIF search based on selected mood
- **URL**: https://developers.giphy.com/docs/api/

## Technology Stack

- **Backend**: Node.js with Express.js
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **APIs**: Spotify Web API + Web Playback SDK, Giphy API
- **Authentication**: Spotify OAuth 2.0
- **Styling**: Modern CSS with gradients, animations, and responsive design
- **Fonts**: Google Fonts (Poppins)

## Installation & Setup

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)
- Spotify account (Free or Premium - both work! Premium allows in-browser playback, Free opens playlists in Spotify app)

### Step 1: Clone or Download the Project
```bash
# If using git
git clone <repository-url>
cd FeelBeats

# Or simply download and extract the project files
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Spotify App Setup
1. Go to https://developer.spotify.com/dashboard/
2. Create a new app
3. Add `http://127.0.0.1:3000/callback` to your app's Redirect URIs (use 127.0.0.1, not localhost)
4. Copy your Client ID and Client Secret

### Step 4: Environment Setup
1. Copy the environment example file:
```bash
cp env.example .env
```

2. Add your API keys to the `.env` file:
```env
GIPHY_API_KEY=your_giphy_api_key_here
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
REDIRECT_URI=http://127.0.0.1:3000/callback
PORT=3000
```

### Step 5: Run the Application
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### Step 6: Access the Application
Open your web browser and navigate to:
```
http://127.0.0.1:3000
```

## Usage

1. **Connect to Spotify**: Click "Connect with Spotify" to authenticate
2. **Select Your Mood**: Click on any of the 8 mood cards on the homepage
3. **Experience the Magic**: Watch as the entire interface transforms with new colors and themes
4. **Listen to Music**: Use the music player controls to play, pause, and navigate tracks
5. **Play Playlists**: Click on any playlist to start playing it immediately
6. **Change Mood**: Use the "Change Mood" button to go back and try different moods
7. **Mobile Experience**: Swipe left on mobile to go back to mood selection

## Music Player Features

- **Real-time Playback**: Listen to music directly on the website
- **Player Controls**: Play/pause, previous/next track buttons
- **Progress Bar**: Visual progress indicator with time display
- **Track Information**: Current track name, artist, and album art
- **Playlist Integration**: Click playlists to start playing them
- **Responsive Design**: Works on all devices

## Project Structure

```
FeelBeats/
├── public/
│   ├── index.html          # Main HTML file with music player
│   ├── styles.css          # CSS styles and animations
│   └── script.js           # Frontend JavaScript with Spotify SDK
├── server.js               # Express server and API routes
├── package.json            # Project dependencies
├── env.example             # Environment variables template
└── README.md              # This file
```

## API Endpoints

### Backend Routes
- `GET /` - Serve the main application
- `GET /login` - Spotify OAuth login
- `GET /callback` - Spotify OAuth callback
- `GET /api/auth-status` - Check authentication status
- `GET /api/mood-colors/:mood` - Get color palette for a mood
- `GET /api/spotify/:mood` - Get playlists for a mood
- `GET /api/giphy/:mood` - Get GIF for a mood

## Features in Detail

### Live Music Playback
- **Spotify Web Playback SDK**: Full integration for real-time music control
- **OAuth Authentication**: Secure login with Spotify
- **Device Management**: Automatic device detection and switching
- **Real-time Updates**: Live track information and progress
- **Cross-platform**: Works on desktop and mobile browsers

### Mood-Based Theming
Each mood has its own color palette that transforms the entire interface:
- **Chill**: Soft blues and greens
- **Energetic**: Vibrant oranges and yellows
- **Romantic**: Pink and purple tones
- **Focus**: Deep blues and grays
- **Happy**: Bright yellows and oranges
- **Sad**: Cool blues
- **Angry**: Intense reds
- **Peaceful**: Calm greens

### Responsive Design
- Mobile-first approach
- Touch-friendly interface
- Swipe gestures for navigation
- Adaptive layouts for all screen sizes

### Performance Optimizations
- Lazy loading of images
- Smooth animations with CSS
- Efficient API calls
- Error handling for failed requests
- Graceful fallbacks for API failures

## Development Notes

### Current Implementation
- **Spotify Web Playback SDK**: Fully integrated with OAuth authentication
- **Giphy API**: Fully integrated with real API calls
- **Color Themes**: Custom mood-to-color mapping
- **Error Handling**: Graceful fallbacks for API failures
- **Real-time Music**: Live playback with full controls

### Technical Requirements
- **Spotify Premium**: Required for Web Playback SDK
- **Modern Browser**: Chrome, Firefox, Safari, Edge
- **User Interaction**: Requires user interaction to start playback

### Future Enhancements
- User accounts and mood history
- Social sharing features
- More mood options and customization
- Audio visualization
- Collaborative playlists
- Voice commands

## Troubleshooting

### Common Issues

1. **Spotify Authentication Not Working**
   - Ensure your Spotify app redirect URI matches exactly: `http://127.0.0.1:3000/callback`
   - Check that your Client ID and Secret are correct
   - Verify you have a Spotify Premium account

2. **Music Not Playing**
   - Make sure you're logged into Spotify Premium
   - Check that your browser supports the Web Playback SDK
   - Try refreshing the page and re-authenticating

3. **Port Already in Use**
   ```bash
   # Change the port in .env file
   PORT=3001
   ```

4. **API Keys Not Working**
   - Ensure your API keys are correctly added to `.env`
   - Check that the keys are valid and have proper permissions
   - The app will work with mock data if no API keys are provided

5. **Images Not Loading**
   - The app includes fallback handling for failed image loads
   - Check your internet connection

### Getting Help
- Check the browser console for error messages
- Ensure all dependencies are installed: `npm install`
- Verify Node.js version: `node --version`
- Check Spotify Web Playback SDK documentation

## Security Notes

- **OAuth Tokens**: Stored securely on the server
- **API Keys**: Never exposed to the client
- **User Privacy**: No personal data is stored

## License

This project is created for educational purposes as part of the HTTP5222 course assignment.

## Credits

- **Fonts**: Google Fonts (Poppins)
- **Icons**: Font Awesome
- **APIs**: Spotify Web API + Web Playback SDK, Giphy API
- **Design**: Custom responsive design with modern CSS

---

**Note**: This project demonstrates advanced API integration, OAuth authentication, real-time music playback, and modern web development practices. The Spotify integration requires a Premium account and proper OAuth setup for full functionality. 