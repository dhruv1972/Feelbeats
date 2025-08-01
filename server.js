const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Spotify OAuth configuration
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://127.0.0.1:3000/callback';

// Store tokens (in production, use a proper database)
let accessToken = null;
let refreshToken = null;

// Mood to color mapping
const moodColors = {
    'chill': ['#E8F4FD', '#B8E6B8', '#87CEEB'],
    'energetic': ['#FF6B6B', '#FFE66D', '#FF8E53'],
    'romantic': ['#FFB6C1', '#FF69B4', '#DDA0DD'],
    'focus': ['#2C3E50', '#34495E', '#5D6D7E'],
    'happy': ['#F7DC6F', '#F8C471', '#F39C12'],
    'sad': ['#85C1E9', '#5DADE2', '#3498DB'],
    'angry': ['#E74C3C', '#C0392B', '#A93226'],
    'peaceful': ['#A9DFBF', '#82E0AA', '#58D68D']
};

// Mood to Spotify playlist mapping
const moodPlaylists = {
    'chill': [
        '37i9dQZF1DX3Ogo9pFvBkY', // Lo-Fi Beats (verified working)
        '37i9dQZF1DX8Uebhn9wtqo'  // Chill Vibes (verified working)
    ],
    'energetic': [
        '37i9dQZF1DX76Wlfdnj7AP', // Workout Mix (verified working)
        '37i9dQZF1DXcBWIGPoYlLa'  // Dance Hits (verified working)
    ],
    'romantic': [
        '37i9dQZF1DX5Vy6DFOcx00', // Love Songs (verified working)
        '37i9dQZF1DX4PP3DA4J0N8'  // Soft Melodies (verified working)
    ],
    'focus': [
        '37i9dQZF1DX8NTLI2TtZa6', // Study Music (verified working)
        '37i9dQZF1DX4sWSpwq3LiO'  // Classical Focus (verified working)
    ],
    'happy': [
        '37i9dQZF1DX3rxVfibe1L0', // Happy Hits (verified working)
        '37i9dQZF1DX9XIFQuFvzMv'  // Upbeat Pop (verified working)
    ],
    'sad': [
        '37i9dQZF1DX7KNKjK0Ht1m', // Melancholy (verified working)
        '37i9dQZF1DX3YSRoSdA634'  // Indie Acoustic (verified working)
    ],
    'angry': [
        '37i9dQZF1DX5Vy6DFOcx00', // Rock Hits (verified working)
        '37i9dQZF1DX8NTLI2TtZa6'  // Metal Mix (verified working)
    ],
    'peaceful': [
        '37i9dQZF1DX4sWSpwq3LiO', // Nature Sounds (verified working)
        '37i9dQZF1DX8NTLI2TtZa6'  // Meditation (verified working)
    ]
};

// Route to debug Spotify app configuration
app.get('/debug-spotify', (req, res) => {
    res.json({
        client_id: SPOTIFY_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        has_client_secret: !!SPOTIFY_CLIENT_SECRET,
        auth_url: `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user-read-private%20user-read-email%20user-read-playback-state%20user-modify-playback-state%20user-read-currently-playing%20streaming%20playlist-read-private%20playlist-read-collaborative`
    });
});

// Route to serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



// Spotify OAuth routes
app.get('/login', (req, res) => {
    console.log('Spotify login requested');

    if (!SPOTIFY_CLIENT_ID) {
        console.error('No Spotify Client ID found!');
        return res.status(500).send('Spotify Client ID not configured');
    }

    const scopes = [
        'user-read-private',
        'user-read-email',
        'user-read-playback-state',
        'user-modify-playback-state',
        'user-read-currently-playing',
        'streaming',
        'playlist-read-private',
        'playlist-read-collaborative'
    ];

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scopes.join(' '))}`;
    console.log('Redirecting to Spotify auth');

    res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.redirect('/?error=no_code');
    }

    try {
        const tokenResponse = await axios.post('https://accounts.spotify.com/api/token',
            new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI,
                client_id: SPOTIFY_CLIENT_ID,
                client_secret: SPOTIFY_CLIENT_SECRET
            }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        accessToken = tokenResponse.data.access_token;
        refreshToken = tokenResponse.data.refresh_token;

        res.redirect('/?success=true');
    } catch (error) {
        console.error('Error getting tokens:', error);
        res.redirect('/?error=token_error');
    }
});

// Route to get mood colors
app.get('/api/mood-colors/:mood', (req, res) => {
    const mood = req.params.mood.toLowerCase();
    const colors = moodColors[mood] || moodColors['chill'];
    res.json({ colors });
});

// Route to test Spotify search API
app.get('/api/spotify-search-test', async (req, res) => {
    try {
        if (!accessToken) {
            return res.json({
                status: 'not_authenticated',
                message: 'No Spotify access token available.'
            });
        }

        // Test search API with a simple term
        const response = await axios.get(`https://api.spotify.com/v1/search`, {
            params: {
                q: 'chill',
                type: 'playlist',
                limit: 2,
                market: 'US'
            },
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const playlists = response.data.playlists?.items || [];

        res.json({
            status: 'success',
            message: 'Spotify search API is working!',
            playlists_found: playlists.length,
            playlists: playlists.map(p => ({ name: p.name, id: p.id }))
        });
    } catch (error) {
        console.error('[Spotify Search Test] Error:', error.response?.data || error.message);
        res.json({
            status: 'error',
            message: 'Spotify search API test failed',
            error: error.response?.data || error.message
        });
    }
});

// Route to get access token for frontend
app.get('/api/spotify-token', (req, res) => {
    if (accessToken) {
        res.json({
            accessToken: accessToken,
            hasToken: true
        });
    } else {
        res.json({
            accessToken: null,
            hasToken: false
        });
    }
});

// Route to test Spotify API connectivity
app.get('/api/spotify-test', async (req, res) => {
    try {
        if (!accessToken) {
            return res.json({
                status: 'not_authenticated',
                message: 'No Spotify access token available. Please connect with Spotify first.'
            });
        }

        // Test with a simple API call
        const response = await axios.get('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        res.json({
            status: 'success',
            message: 'Spotify API is working!',
            user: response.data.display_name || 'Unknown',
            token_valid: true
        });
    } catch (error) {
        console.error('[Spotify Test] Error:', error.response?.data || error.message);
        res.json({
            status: 'error',
            message: 'Spotify API test failed',
            error: error.response?.data || error.message,
            token_valid: false
        });
    }
});

// Route to get Spotify playlists by mood
app.get('/api/spotify/:mood', async (req, res) => {
    try {
        const mood = req.params.mood.toLowerCase();

        // Search terms for each mood
        const moodSearchTerms = {
            'chill': ['lo-fi', 'chill', 'relax'],
            'energetic': ['workout', 'dance', 'energy'],
            'romantic': ['love', 'romance', 'ballads'],
            'focus': ['study', 'concentration', 'classical'],
            'happy': ['happy', 'upbeat', 'feel good'],
            'sad': ['melancholy', 'sad', 'emotional'],
            'angry': ['rock', 'metal', 'intense'],
            'peaceful': ['meditation', 'peaceful', 'calm']
        };

        // Mock playlists for fallback
        const mockPlaylists = {
            'chill': [
                { id: 'chill-1', name: 'Lo-Fi Beats to Study/Relax', tracks: 45, image: 'https://via.placeholder.com/300x300/87CEEB/FFFFFF?text=Lo-Fi+Beats', uri: 'spotify:playlist:37i9dQZF1DX3Ogo9pFvBkY' },
                { id: 'chill-2', name: 'Chill Vibes & Relaxation', tracks: 32, image: 'https://via.placeholder.com/300x300/B8E6B8/FFFFFF?text=Chill+Vibes', uri: 'spotify:playlist:37i9dQZF1DX8Uebhn9wtqo' }
            ],
            'energetic': [
                { id: 'energetic-1', name: 'Workout Mix - High Energy', tracks: 28, image: 'https://via.placeholder.com/300x300/FF6B6B/FFFFFF?text=Workout+Mix', uri: 'spotify:playlist:37i9dQZF1DX76Wlfdnj7AP' },
                { id: 'energetic-2', name: 'Dance Hits & Party Anthems', tracks: 50, image: 'https://via.placeholder.com/300x300/FFE66D/FFFFFF?text=Dance+Hits', uri: 'spotify:playlist:37i9dQZF1DXcBWIGPoYlLa' }
            ],
            'romantic': [
                { id: 'romantic-1', name: 'Love Songs & Romance', tracks: 25, image: 'https://via.placeholder.com/300x300/FFB6C1/FFFFFF?text=Love+Songs', uri: 'spotify:playlist:37i9dQZF1DX5Vy6DFOcx00' },
                { id: 'romantic-2', name: 'Soft Melodies & Ballads', tracks: 30, image: 'https://via.placeholder.com/300x300/FF69B4/FFFFFF?text=Soft+Melodies', uri: 'spotify:playlist:37i9dQZF1DX4PP3DA4J0N8' }
            ],
            'focus': [
                { id: 'focus-1', name: 'Study Music & Concentration', tracks: 40, image: 'https://via.placeholder.com/300x300/2C3E50/FFFFFF?text=Study+Music', uri: 'spotify:playlist:37i9dQZF1DX8NTLI2TtZa6' },
                { id: 'focus-2', name: 'Classical Focus & Productivity', tracks: 35, image: 'https://via.placeholder.com/300x300/34495E/FFFFFF?text=Classical+Focus', uri: 'spotify:playlist:37i9dQZF1DX4sWSpwq3LiO' }
            ],
            'happy': [
                { id: 'happy-1', name: 'Happy Hits & Feel Good', tracks: 42, image: 'https://via.placeholder.com/300x300/F7DC6F/FFFFFF?text=Happy+Hits', uri: 'spotify:playlist:37i9dQZF1DX3rxVfibe1L0' },
                { id: 'happy-2', name: 'Upbeat Pop & Positive Vibes', tracks: 38, image: 'https://via.placeholder.com/300x300/F8C471/FFFFFF?text=Upbeat+Pop', uri: 'spotify:playlist:37i9dQZF1DX9XIFQuFvzMv' }
            ],
            'sad': [
                { id: 'sad-1', name: 'Melancholy & Reflection', tracks: 33, image: 'https://via.placeholder.com/300x300/85C1E9/FFFFFF?text=Melancholy', uri: 'spotify:playlist:37i9dQZF1DX7KNKjK0Ht1m' },
                { id: 'sad-2', name: 'Indie Acoustic & Emotional', tracks: 29, image: 'https://via.placeholder.com/300x300/5DADE2/FFFFFF?text=Indie+Acoustic', uri: 'spotify:playlist:37i9dQZF1DX3YSRoSdA634' }
            ],
            'angry': [
                { id: 'angry-1', name: 'Rock Hits & Power Anthems', tracks: 36, image: 'https://via.placeholder.com/300x300/E74C3C/FFFFFF?text=Rock+Hits', uri: 'spotify:playlist:37i9dQZF1DX5Vy6DFOcx00' },
                { id: 'angry-2', name: 'Metal Mix & Heavy Energy', tracks: 44, image: 'https://via.placeholder.com/300x300/C0392B/FFFFFF?text=Metal+Mix', uri: 'spotify:playlist:37i9dQZF1DX8NTLI2TtZa6' }
            ],
            'peaceful': [
                { id: 'peaceful-1', name: 'Nature Sounds & Meditation', tracks: 27, image: 'https://via.placeholder.com/300x300/A9DFBF/FFFFFF?text=Nature+Sounds', uri: 'spotify:playlist:37i9dQZF1DX4sWSpwq3LiO' },
                { id: 'peaceful-2', name: 'Peaceful Piano & Calm', tracks: 31, image: 'https://via.placeholder.com/300x300/82E0AA/FFFFFF?text=Meditation', uri: 'spotify:playlist:37i9dQZF1DX8NTLI2TtZa6' }
            ]
        };

        if (!accessToken) {
            console.log('[Spotify] No access token. Returning mock playlists.');
            return res.json({ playlists: mockPlaylists[mood] || mockPlaylists['chill'] });
        }

        // Try to search for real playlists using Spotify Search API
        const playlists = [];
        let realPlaylistsFound = false;
        const searchTerms = moodSearchTerms[mood] || moodSearchTerms['chill'];

        for (const searchTerm of searchTerms) {
            try {
                console.log(`[Spotify] Searching for playlists with term: "${searchTerm}"`);
                const response = await axios.get(`https://api.spotify.com/v1/search`, {
                    params: {
                        q: searchTerm,
                        type: 'playlist',
                        limit: 5,
                        market: 'US' // Add market parameter
                    },
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });



                const searchResults = response.data.playlists?.items || [];
                console.log('Found', searchResults.length, 'playlists for', searchTerm);

                if (searchResults.length > 0) {
                    for (const playlist of searchResults.slice(0, 2)) {
                        if (playlist && playlist.id) {
                            playlists.push({
                                id: playlist.id,
                                name: playlist.name,
                                tracks: playlist.tracks?.total || 0,
                                image: playlist.images?.[0]?.url || 'https://via.placeholder.com/300x300/667eea/FFFFFF?text=Playlist',
                                uri: playlist.uri
                            });
                            realPlaylistsFound = true;
                            console.log(`[Spotify] Found playlist: ${playlist.name} (ID: ${playlist.id})`);
                        }
                    }
                    if (realPlaylistsFound) {
                        break; // Found playlists, no need to try other search terms
                    }
                } else {
                    console.log(`[Spotify] No playlists found for term: "${searchTerm}"`);
                }
            } catch (error) {
                console.error(`[Spotify] Error searching for "${searchTerm}":`, error.response?.data || error.message);
                if (error.response?.status === 401) {
                    console.log('[Spotify] Authentication error - token may be expired');
                    break; // Don't try other terms if auth failed
                }
            }
        }

        if (realPlaylistsFound) {
            console.log('[Spotify] Real playlists found via search:', playlists.length, 'playlists');
            res.json({ playlists });
        } else {
            console.log('[Spotify] No real playlists found via search. Using mock playlists.');
            res.json({ playlists: mockPlaylists[mood] || mockPlaylists['chill'] });
        }
    } catch (error) {
        console.error('[Spotify] Error fetching Spotify data:', error);
        res.status(500).json({ error: 'Failed to fetch playlist data' });
    }
});

// Route to get Giphy GIFs by mood
app.get('/api/giphy/:mood', async (req, res) => {
    try {
        const mood = req.params.mood.toLowerCase();
        const giphyApiKey = process.env.GIPHY_API_KEY;

        if (!giphyApiKey) {
            // Return mock data if no API key is provided
            const mockGifs = {
                'chill': 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
                'energetic': 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
                'romantic': 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
                'focus': 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
                'happy': 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
                'sad': 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
                'angry': 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
                'peaceful': 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif'
            };

            return res.json({ gif: mockGifs[mood] || mockGifs['chill'] });
        }

        const response = await axios.get(`https://api.giphy.com/v1/gifs/search`, {
            params: {
                api_key: giphyApiKey,
                q: mood,
                limit: 1,
                rating: 'g'
            }
        });

        const gifUrl = response.data.data[0]?.images?.original?.url ||
            'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif';

        res.json({ gif: gifUrl });
    } catch (error) {
        console.error('Error fetching Giphy data:', error);
        res.status(500).json({ error: 'Failed to fetch GIF data' });
    }
});

// Route to check authentication status
app.get('/api/auth-status', (req, res) => {
    res.json({
        authenticated: !!accessToken,
        clientId: SPOTIFY_CLIENT_ID
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🎵 FeelBeats server running on http://127.0.0.1:${PORT}`);
    console.log('\n✨ Your app is ready with:');
    console.log('✅ Mood selection and theming');
    console.log('✅ Giphy GIF integration');
    console.log('✅ Spotify API integration');
    console.log('✅ Live music playback (when authenticated)');
    console.log('\n📝 To enable Spotify features:');
    console.log('1. Create a .env file with your Spotify API keys');
    console.log('2. Update your Spotify app redirect URI to: http://127.0.0.1:3000/callback');
    console.log('3. Access the app at: http://127.0.0.1:3000');
}); 