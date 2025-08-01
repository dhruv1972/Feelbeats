// DOM Elements
const moodCards = document.querySelectorAll('.mood-card');
const resultsSection = document.getElementById('resultsSection');
const moodSection = document.querySelector('.mood-section');
const loadingSpinner = document.getElementById('loadingSpinner');
const selectedMoodSpan = document.getElementById('selectedMood');
const selectedMoodTitle = document.getElementById('selectedMoodTitle');
const moodGif = document.getElementById('moodGif');
const playlistsGrid = document.getElementById('playlistsGrid');
const musicPlayer = document.getElementById('musicPlayer');
const authSection = document.getElementById('authSection');
const spotifyLoginBtn = document.getElementById('spotifyLoginBtn');

// Music Player Elements
const currentTrackImage = document.getElementById('currentTrackImage');
const currentTrackName = document.getElementById('currentTrackName');
const currentTrackArtist = document.getElementById('currentTrackArtist');
const playBtn = document.getElementById('playBtn');
const playIcon = document.getElementById('playIcon');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressFill = document.getElementById('progressFill');
const currentTimeSpan = document.getElementById('currentTime');
const totalTimeSpan = document.getElementById('totalTime');

// Spotify Web Playback SDK
let player;
let deviceId;
let isPlaying = false;
let currentTrack = null;
let progressInterval;
let accessToken = null; // Add access token variable

// Current selected mood
let currentMood = '';

// Event Listeners
document.addEventListener('DOMContentLoaded', function () {
    // Add click event listeners to mood cards
    moodCards.forEach(card => {
        card.addEventListener('click', function () {
            const mood = this.getAttribute('data-mood');
            selectMood(mood);
        });
    });

    // Add backup click event listener for Spotify login button
    const spotifyLoginBtn = document.getElementById('spotifyLoginBtn');
    if (spotifyLoginBtn) {
        spotifyLoginBtn.addEventListener('click', function (e) {
            console.log('Login button clicked');
            loginToSpotify();
        });
    }

    // Check authentication status on load
    checkAuthStatus();

    // Initialize Spotify Web Playback SDK
    initializeSpotifyPlayer();
});

// Function to check device status and provide instructions
function checkDeviceStatus() {
    if (!deviceId) {
        console.log('[Device] No device ID available');
        return {
            hasDevice: false,
            message: '🎵 To play music:\n1. Make sure Spotify is open on your device\n2. Play any song in Spotify\n3. Refresh this page\n4. Try clicking a playlist again'
        };
    } else {
        console.log('[Device] Device ID available:', deviceId);
        return {
            hasDevice: true,
            message: '🎵 Device ready! Click a playlist to play music.'
        };
    }
}

// Function to refresh access token and update UI
async function refreshAccessToken() {
    try {
        const tokenResponse = await fetch('/api/spotify-token');
        const tokenData = await tokenResponse.json();

        if (tokenData.hasToken) {
            accessToken = tokenData.accessToken;
            console.log('[Frontend] Access token refreshed');
            return true;
        } else {
            console.log('[Frontend] No access token available');
            return false;
        }
    } catch (error) {
        console.error('[Frontend] Error refreshing access token:', error);
        return false;
    }
}

// Function to get access token from server
async function getAccessToken() {
    try {
        const response = await fetch('/api/spotify-token');
        const data = await response.json();
        if (data.hasToken) {
            accessToken = data.accessToken;
            console.log('[Frontend] Got access token from server');
            return true;
        } else {
            console.log('[Frontend] No access token available');
            return false;
        }
    } catch (error) {
        console.error('[Frontend] Error getting access token:', error);
        return false;
    }
}

// Function to check authentication status
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth-status');
        const data = await response.json();

        // Also get the access token
        const tokenResponse = await fetch('/api/spotify-token');
        const tokenData = await tokenResponse.json();

        if (data.authenticated && tokenData.hasToken) {
            accessToken = tokenData.accessToken;
            console.log('[Frontend] User is authenticated and has access token');
            showMusicPlayer();
            hideAuthSection();
        } else {
            console.log('[Frontend] User is not authenticated or missing access token');
            showAuthSection();
            hideMusicPlayer();
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        showAuthSection();
        hideMusicPlayer();
    }
}

// Function to show/hide auth section
function showAuthSection() {
    authSection.style.display = 'block';
}

function hideAuthSection() {
    authSection.style.display = 'none';
}

// Function to show/hide music player
function showMusicPlayer() {
    musicPlayer.style.display = 'flex';
}

function hideMusicPlayer() {
    musicPlayer.style.display = 'none';
}

// Function to login to Spotify
function loginToSpotify() {
    console.log('Redirecting to Spotify...');
    try {
        window.location.href = '/login';

    } catch (error) {
        console.error('Redirect error:', error);
    }
}

// Function to initialize Spotify Web Playback SDK
function initializeSpotifyPlayer() {
    console.log('Loading Spotify player...');

    window.onSpotifyWebPlaybackSDKReady = () => {
        console.log('Creating Spotify player...');

        player = new Spotify.Player({
            name: 'FeelBeats Web Player',
            getOAuthToken: cb => {
                console.log('Getting token...');
                cb(accessToken);
            }
        });

        // Error handling
        player.addListener('initialization_error', ({ message }) => {
            console.error('Player init error:', message);
        });

        player.addListener('authentication_error', ({ message }) => {
            console.error('Auth error:', message);
        });

        player.addListener('account_error', ({ message }) => {
            console.error('Account error:', message);
        });

        player.addListener('playback_error', ({ message }) => {
            console.error('Playback error:', message);
        });

        // Playback status updates
        player.addListener('player_state_changed', state => {
            if (state) {
                updatePlayerUI(state);
            }
        });

        // Ready
        player.addListener('ready', ({ device_id }) => {
            deviceId = device_id;
            console.log('Spotify player ready! Device ID:', device_id);
        });

        // Not Ready
        player.addListener('not_ready', ({ device_id }) => {
            console.log('Player went offline:', device_id);
            deviceId = null;
        });

        // Connect to the player
        console.log('Connecting player...');
        player.connect();
    };
}

// Function to update player UI
function updatePlayerUI(state) {
    const track = state.track_window.current_track;
    const position = state.position;
    const duration = state.duration;
    const isPlayingState = !state.paused;

    // Update track info
    if (track) {
        currentTrackImage.src = track.album.images[0]?.url || '';
        currentTrackName.textContent = track.name;
        currentTrackArtist.textContent = track.artists.map(artist => artist.name).join(', ');
        currentTrack = track;
    }

    // Update play/pause button
    isPlaying = isPlayingState;
    playIcon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';

    // Update progress
    if (duration > 0) {
        const progress = (position / duration) * 100;
        progressFill.style.width = `${progress}%`;

        currentTimeSpan.textContent = formatTime(position);
        totalTimeSpan.textContent = formatTime(duration);
    }
}

// Function to format time
function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Function to toggle play/pause
async function togglePlay() {
    if (!deviceId) return;

    try {
        await fetch(`https://api.spotify.com/v1/me/player/${isPlaying ? 'pause' : 'play'}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                device_id: deviceId
            })
        });
    } catch (error) {
        console.error('Error toggling playback:', error);
    }
}

// Function to play previous track
async function previousTrack() {
    if (!deviceId) return;

    try {
        await fetch('https://api.spotify.com/v1/me/player/previous', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                device_id: deviceId
            })
        });
    } catch (error) {
        console.error('Error playing previous track:', error);
    }
}

// Function to play next track
async function nextTrack() {
    if (!deviceId) return;

    try {
        await fetch('https://api.spotify.com/v1/me/player/next', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                device_id: deviceId
            })
        });
    } catch (error) {
        console.error('Error playing next track:', error);
    }
}

// Function to play a playlist
async function playPlaylist(playlistUri) {
    console.log('Playing playlist:', playlistUri);

    // Get access token from server (refresh if needed)
    let hasToken = await getAccessToken();
    if (!hasToken) {
        hasToken = await refreshAccessToken();
    }

    if (!hasToken) {
        alert('🎵 Please connect with Spotify first to play music!');
        return;
    }

    if (!deviceId) {
        console.log('No device available - need Premium for browser playback');
        alert('🎵 Opening playlist in Spotify app!\n\n💡 Note: Playing music directly in the browser requires Spotify Premium. The playlist will open in your Spotify app or web player.');
        // Open in Spotify app/web player
        window.open(playlistUri, '_blank');
        return;
    }

    try {
        console.log('[Playback] Sending play request to Spotify API');
        const response = await fetch('https://api.spotify.com/v1/me/player/play', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                context_uri: playlistUri,
                device_id: deviceId
            })
        });

        if (response.ok) {
            console.log('[Playback] Successfully started playback');
            alert('🎵 Music is now playing! Check your Spotify app or web player.');
        } else {
            const errorData = await response.json();
            console.error('[Playback] Error response:', errorData);

            if (response.status === 403) {
                alert('⚠️ Spotify Premium is required to play music through the web player. Opening playlist in your Spotify app instead!');
                window.open(playlistUri, '_blank');
            } else if (response.status === 404) {
                alert('⚠️ No active Spotify device found. Opening playlist in your Spotify app instead!');
                window.open(playlistUri, '_blank');
            } else {
                alert(`❌ Playback error (${response.status}): ${errorData.error?.message || 'Unknown error'}. Opening playlist in your Spotify app instead!`);
                window.open(playlistUri, '_blank');
            }
        }
    } catch (error) {
        console.error('[Playback] Error playing playlist:', error);
        alert('❌ Error playing music. Opening playlist in your Spotify app instead!');
        window.open(playlistUri, '_blank');
    }
}

// Function to select a mood
async function selectMood(mood) {
    currentMood = mood;

    // Show loading spinner
    showLoading();

    try {
        // Update theme colors
        updateTheme(mood);

        // Fetch data from APIs
        await Promise.all([
            fetchMoodColors(mood),
            fetchSpotifyPlaylists(mood),
            fetchMoodGif(mood)
        ]);

        // Update UI
        updateResultsUI(mood);

        // Hide loading and show results
        hideLoading();
        showResults();

    } catch (error) {
        console.error('Error selecting mood:', error);
        hideLoading();
        alert('Sorry, there was an error loading your mood data. Please try again.');
    }
}

// Function to update theme colors
function updateTheme(mood) {
    // Remove all existing theme classes
    document.body.classList.remove(
        'chill-theme', 'energetic-theme', 'romantic-theme', 'focus-theme',
        'happy-theme', 'sad-theme', 'angry-theme', 'peaceful-theme'
    );

    // Add new theme class
    document.body.classList.add(`${mood}-theme`);
}

// Function to fetch mood colors from API
async function fetchMoodColors(mood) {
    try {
        const response = await fetch(`/api/mood-colors/${mood}`);
        const data = await response.json();
        return data.colors;
    } catch (error) {
        console.error('Error fetching mood colors:', error);
        return null;
    }
}

// Function to fetch Spotify playlists
async function fetchSpotifyPlaylists(mood) {
    try {
        const response = await fetch(`/api/spotify/${mood}`);
        const data = await response.json();
        return data.playlists;
    } catch (error) {
        console.error('Error fetching Spotify playlists:', error);
        return [];
    }
}

// Function to fetch mood GIF
async function fetchMoodGif(mood) {
    try {
        const response = await fetch(`/api/giphy/${mood}`);
        const data = await response.json();
        return data.gif;
    } catch (error) {
        console.error('Error fetching mood GIF:', error);
        return null;
    }
}

// Function to update results UI
function updateResultsUI(mood) {
    // Update mood title
    selectedMoodSpan.textContent = mood.charAt(0).toUpperCase() + mood.slice(1);

    // Update GIF
    fetchMoodGif(mood).then(gifUrl => {
        if (gifUrl) {
            moodGif.src = gifUrl;
            moodGif.style.display = 'block';
        }
    });

    // Update playlists
    fetchSpotifyPlaylists(mood).then(playlists => {
        displayPlaylists(playlists);
    });
}

// Function to display playlists
function displayPlaylists(playlists) {
    playlistsGrid.innerHTML = '';

    if (playlists && playlists.length > 0) {
        playlists.forEach(playlist => {
            const playlistCard = createPlaylistCard(playlist);
            playlistsGrid.appendChild(playlistCard);
        });
    } else {
        playlistsGrid.innerHTML = '<p style="color: #666; text-align: center;">No playlists available for this mood.</p>';
    }
}

// Function to create playlist card
function createPlaylistCard(playlist) {
    const card = document.createElement('div');
    card.className = 'playlist-card';
    card.style.animation = 'fadeIn 0.5s ease';

    // Check if this is a real Spotify playlist or mock playlist
    const isRealPlaylist = playlist.uri && playlist.uri.startsWith('spotify:playlist:');
    const deviceStatus = checkDeviceStatus();
    const canPlay = isRealPlaylist && deviceStatus.hasDevice && accessToken;

    card.innerHTML = `
        <img src="${playlist.image}" alt="${playlist.name}" class="playlist-image">
        <div class="playlist-info">
            <h4>${playlist.name}</h4>
            <p>${playlist.tracks} tracks</p>
            ${canPlay ? '<div class="play-indicator">🎵 Click to play</div>' :
            isRealPlaylist ? '<div class="play-indicator">🎵 Real playlist (setup device)</div>' :
                '<div class="play-indicator">📋 Sample playlist</div>'}
        </div>
    `;

    // Add click event to play playlist
    if (canPlay) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            console.log('[Frontend] Playing playlist:', playlist.name, 'URI:', playlist.uri);
            playPlaylist(playlist.uri);
        });
    } else {
        card.style.cursor = 'default';
        card.addEventListener('click', () => {
            console.log('[Frontend] Playlist clicked but cannot play:', {
                isRealPlaylist,
                hasDevice: deviceStatus.hasDevice,
                hasAccessToken: !!accessToken,
                playlistName: playlist.name
            });

            if (isRealPlaylist) {
                if (!accessToken) {
                    alert('🎵 This is a real Spotify playlist! Click "Connect with Spotify" first to play music.');
                } else {
                    // If authenticated but no device, open in Spotify app
                    alert('🎵 Opening playlist in Spotify app!\n\n💡 Note: Playing music directly in the browser requires Spotify Premium. The playlist will open in your Spotify app or web player.');
                    window.open(playlist.uri, '_blank');
                }
            } else {
                alert('📋 This is a sample playlist. Connect with Spotify to access real playlists and play music!');
            }
        });
    }

    return card;
}

// Function to show loading spinner
function showLoading() {
    loadingSpinner.style.display = 'flex';
}

// Function to hide loading spinner
function hideLoading() {
    loadingSpinner.style.display = 'none';
}

// Function to show results section
function showResults() {
    moodSection.style.display = 'none';
    resultsSection.style.display = 'block';
    resultsSection.style.animation = 'fadeIn 0.5s ease';
}

// Function to show mood selection (go back)
function showMoodSelection() {
    resultsSection.style.display = 'none';
    moodSection.style.display = 'block';
    moodSection.style.animation = 'fadeIn 0.5s ease';

    // Reset theme to default
    document.body.classList.remove(
        'chill-theme', 'energetic-theme', 'romantic-theme', 'focus-theme',
        'happy-theme', 'sad-theme', 'angry-theme', 'peaceful-theme'
    );
}

// Add smooth scrolling for better UX
document.addEventListener('DOMContentLoaded', function () {
    // Smooth scroll to results when mood is selected
    const smoothScrollToResults = () => {
        resultsSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };

    // Override the selectMood function to include smooth scrolling
    const originalSelectMood = selectMood;
    selectMood = async function (mood) {
        await originalSelectMood(mood);
        setTimeout(smoothScrollToResults, 100);
    };
});

// Add keyboard navigation support
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && resultsSection.style.display !== 'none') {
        showMoodSelection();
    }
});

// Add touch/swipe support for mobile
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', function (e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0 && resultsSection.style.display !== 'none') {
            // Swipe left - go back to mood selection
            showMoodSelection();
        }
    }
}

// Add error handling for failed image loads
document.addEventListener('error', function (e) {
    if (e.target.tagName === 'IMG') {
        e.target.style.display = 'none';
        const fallbackDiv = document.createElement('div');
        fallbackDiv.style.cssText = `
            width: 100%;
            height: 150px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            border-radius: 10px;
        `;
        fallbackDiv.textContent = '🎵 Music';
        e.target.parentNode.insertBefore(fallbackDiv, e.target);
    }
}, true); 