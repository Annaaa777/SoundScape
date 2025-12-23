🎵 SoundScape

AI-Powered Smart Navigation + Mood-Adaptive Playlists

Built at MadHacks 2025 – University of Wisconsin–Madison

________________________________

🚀 Overview

SoundScape reimagines everyday navigation by blending:

🗺️ Real-time directions
🎶 Spotify-powered music personalization
🤖 AI playlist generation
🎙️ Voice mood detection

Instead of treating navigation and music as separate tools, SoundScape
dynamically adapts what you hear based on:

Your mood (selected manually or detected with voice)

Real-time traffic conditions

Weather along the route

Trip duration

Changing conditions during the drive

Perfect for college students commuting to class, riding the bus, or
discovering new daily habits — SoundScape makes every trip feel
intentional.

________________________________

✨ Key Features

🎧 AI-Generated Playlists (OpenAI)

SoundScape uses AI to select the best tracks from your Spotify library
that match the:

Current mood

Weather

Traffic

Route duration

Live environmental changes

Instead of a fixed number (like 15–20), the AI chooses as many tracks
as needed for the experience.

________________________________

🎙️ Voice Mood Detection (Fish Audio / STT)

Say your mood out loud:

“I’m tired”
“I’m excited”
“I’m calm”

SoundScape uses speech-to-text (FishAudio or Expo’s built-in STT
fallback) to detect emotional cues and modify the playlist
accordingly.

________________________________

🗺️ Smart Navigation

Powered by:

Mapbox Directions API → route geometry, duration, traffic

Google Places API → autocomplete destination search

OpenWeather API → weather influence

Expo Location → user’s current position

Features:

Live route polyline

Traffic visualization

Weather context

Auto-zooming map

________________________________

🧪 Demo Mode (For Judging Without Moving)

Since hackathon rooms aren’t drive-friendly…

Demo Mode simulates a full trip from:

➡️ West Towne Mall → Union South (Madison, WI)

With:

Moving GPS position

Changing traffic

Changing weather

AI playlist updates mid-route

Perfect for a live stage demo.

________________________________

🔐 User Authentication

Simple username + password auth flow so judges can easily:

Create accounts

Log in/out

Test onboarding screens

Fully powered by Expo + in-app storage.

________________________________

🎵 Spotify Integration

Spotify OAuth login

Full library loading

Tracks passed to OpenAI for playlist generation

Automatic fallback sample library if Spotify is unavailable

________________________________

🏗️ Tech Stack

Frontend

React Native (Expo)

React Navigation

React Native Maps

APIs & Services

Google Places API — destination search

Mapbox Directions API — routing, traffic, geometry

OpenWeather API — weather context

Spotify Web API — user library & OAuth

OpenAI API — playlist generation logic

Fish Audio (optional) — speech-to-text + mood detection

Expo Speech/Audio — fallback STT & playback

State & Storage

React Context (Auth, Music)

Expo SecureStore (token storage)

________________________________

📁 Folder Structure

vibeNav/
│
├── assets/
│   ├── logo.png
│   ├── icon.png
│   └── splash-icon.png
│
├── components/
│   ├── DestinationSearch.js
│   ├── MoodSelector.js
│   ├── VoiceMoodSelector.js
│   ├── MusicPlayer.js
│   └── NavigationInstructions.js
│
├── context/
│   └── AuthContext.js
│
├── screens/
│   ├── HomeScreen.js
│   ├── LoginScreen.js
│   ├── RegisterScreen.js
│   ├── SignUpScreen.js
│   └── NavigationScreen.js
│
├── services/
│   ├── ai.js
│   ├── mapbox.js
│   ├── mockRoute.js
│   ├── weather.js
│   ├── spotify.js
│   ├── spotifyPlayback.js
│   ├── speechToText.js
│   └── fishAudio.js
│
├── utils/
│   ├── constants.js
│   ├── distance.js
│   └── previewTester.js
│
├── .env
├── App.js
├── app.config.js
└── package.json

________________________________

🔧 Setup Instructions

1️⃣ Install Dependencies

npm install

2️⃣ Set Environment Variables

Create .env:

MAPBOX_KEY=xxxx
GOOGLE_PLACES_KEY=xxxx
OPENAI_KEY=xxxx
OPENWEATHER_KEY=xxxx
SPOTIFY_CLIENT_ID=xxxx
SPOTIFY_REDIRECT_URI=exp://127.0.0.1:19000
FISHAUDIO_KEY=xxxx

3️⃣ Start the App

npx expo start

________________________________

🎬 Demo Instructions (For Judges)

⭐ 30-Second Demo Flow

Open app

Login or Register

Tap Demo Mode: ON

Destination auto-sets to Union South

Tap Start Trip

Watch the simulation:

Marker moves

Weather/traffic update

AI regenerates playlist

Use Voice Mood Selector

“I’m stressed” → softer music

“I’m hype” → energetic tracks

End trip → summary popup

________________________________

🧠 Hackathon Build Summary

In under 24 hours, we built:

Voice mood recognition

Dynamic playlist AI

Real navigation engine

Multi-API integration

Live map simulation

Spotify authentication

Unified UI/UX

Demo-ready mock routing system

________________________________

👥 Team SoundScape

Triya Poondra,
Anoushka Das,
Manasvi Khandelwal,
Angelina Arasavelli

University of Wisconsin–Madison
MadHacks 2025
