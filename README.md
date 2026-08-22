<div align="center">

  # ✈️ TRAVO

  ### *Modern Social Travel & Real-Time Exploration Companion*

  [![Expo SDK](https://img.shields.io/badge/Expo-SDK%2054-000000?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
  [![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/NativeWind-v4.2-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://nativewind.dev)
  [![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
  [![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)](https://clerk.com)

  <p align="center">
    <b>Travo</b> connects travelers worldwide through real-time location sharing, interest-matched group activities, interactive mapping, and media-rich travel storytelling.
  </p>

  [Features](#-key-features) • [Tech Stack](#%EF%B8%8F-tech-stack--architecture) • [Project Structure](#-project-structure) • [Getting Started](#-getting-started) • [Environment Variables](#-environment-variables) • [Database Schema](#%EF%B8%8F-database-schema)

---

</div>

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack & Architecture](#%EF%B8%8F-tech-stack--architecture)
- [Project Structure](#-project-structure)
- [Database Schema](#%EF%B8%8F-database-schema)
- [Third-Party Services](#-third-party-services)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#-environment-variables)
  - [Running the App](#running-the-app)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**Travo** is a full-featured, cross-platform mobile & web application built using **React Native**, **Expo SDK 54**, **Supabase**, and **Clerk**. Designed for modern wanderers and adventure seekers, Travo turns solo journeys into shared experiences by linking travelers based on proximity, common interests, and real-time availability.

Whether you're looking for a coffee buddy in Tokyo, a hiking crew in Banff, or want to broadcast your trip memories with high-res photos and videos, Travo provides an intuitive and seamless social travel ecosystem.

---

## ✨ Key Features

### 📍 1. Interactive Real-Time Map & Routing
- **Live Location Tracking**: Toggle location visibility with smooth background and foreground tracking options (`expo-location`, `expo-task-manager`).
- **Geoapify Search & Autocomplete**: Real-time venue and place suggestions tailored to user proximity.
- **Turn-by-Turn Navigation**: Dynamic route generation calculating distance (km) and travel duration (min) via Geoapify Routing API.
- **Cross-Platform Map Render**: Native Google Maps rendering on iOS/Android via `react-native-maps` with web map support.

### 👥 2. Social Activities & Meetups
- **Activity Creation**: Host activities categorized by size (**Duo**, **Trio**, **Group**) and visibility (**Public**, **Friends**, **Invite Only**).
- **Interest Matching**: Filter activities by categories such as *Sightseeing, Foodie, Hiking, Photography, Nightlife, Culture*, and more.
- **Status & Requests**: Manage upcoming, ongoing, and completed activities with full join request workflow management.

### 📸 3. Traveler Community Feed
- **Media Storytelling**: Share travel memories with text, venue tags, and high-definition photos or videos.
- **Cloudinary Optimization**: Dynamic image resizing, video thumbnail generation, and adaptive quality delivery (`@cloudinary/url-gen`).
- **Social Engagement**: Like, comment, and filter posts by public vs. friends-only visibility.

### 👤 4. Rich User Profiles & Presence
- **Personalized Showcase**: Custom avatar, bio, travel stats (friends count, activities hosted/joined), and tag cloud of interests.
- **Real-Time Presence**: Track availability status (`idle`, `in_activity`, `looking`).
- **Clerk & Supabase Sync**: Bi-directional data sync ensuring seamless identity management between Clerk Auth and Supabase PostgreSQL.

---

## 🛠️ Tech Stack & Architecture

### **Frontend & UI**
- **Framework**: [React Native 0.81](https://reactnative.dev) + [Expo 54](https://expo.dev)
- **Routing**: [Expo Router v6](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **Language**: [TypeScript 5.9](https://www.typescriptlang.org/)
- **Styling**: [NativeWind v4](https://nativewind.dev) (Tailwind CSS v3) + `expo-linear-gradient`
- **Icons & Animation**: `@expo/vector-icons` (Ionicons) + `react-native-reanimated`

### **Backend & Infrastructure**
- **Authentication**: [Clerk Expo](https://clerk.com) (JWT token caching via `expo-secure-store`)
- **Database & Realtime**: [Supabase](https://supabase.com) (PostgreSQL Database Engine)
- **Media Engine**: [Cloudinary](https://cloudinary.com) (CDN & media transformations)
- **Geospatial & Maps**: [Geoapify API](https://www.geoapify.com/) (Search, Autocomplete, Routing) + Google Maps SDK

```
┌────────────────────────────────────────────────────────────────────────┐
│                              TRAVO APP                                 │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
       ┌───────────────────────────┼───────────────────────────┐
       ▼                           ▼                           ▼
┌──────────────┐           ┌──────────────┐            ┌──────────────┐
│  Clerk Auth  │           │   Supabase   │            │ Cloudinary   │
│ (Identity)   │           │ (DB / Store) │            │ (Media CDN)  │
└──────────────┘           └──────────────┘            └──────────────┘
       │                           │                           │
       └───────────────────────────┼───────────────────────────┘
                                   │
                                   ▼
                       ┌──────────────────────┐
                       │  Geoapify / Google   │
                       │   Maps (Routing)     │
                       └──────────────────────┘
```

---

## 📁 Project Structure

```text
Travo/
├── app/                        # Expo Router Pages & Navigation
│   ├── (auth)/                 # Authentication Routes
│   │   ├── _layout.tsx         # Auth Layout Wrapper
│   │   ├── sign-in.tsx         # Sign In Screen
│   │   └── sign-up.tsx         # Sign Up Screen
│   ├── (tabs)/                 # Main Tab Navigation
│   │   ├── map/                # Interactive Map & Navigation Tab
│   │   │   └── index.tsx       # Map Screen
│   │   ├── activities.tsx      # Activities & Meetups Management
│   │   ├── community.tsx       # Travel Feed & Posts
│   │   └── profile.tsx         # User Profile & Activity Grid
│   ├── _layout.tsx             # Root Layout & Provider Setup
│   └── index.tsx               # Entry & Authentication Redirect
├── components/                 # Reusable UI Components
│   ├── ActivityCard.tsx        # Activity Card Renderer
│   ├── ActivityDetailsModal.tsx# Detailed Activity View & Actions
│   ├── CreateActivityModal.tsx # New Activity Form
│   ├── CreatePostModal.tsx     # Post Creation Modal with Media
│   ├── MapComponent.tsx        # Cross-platform Map View
│   ├── MapComponent.web.tsx    # Web Fallback Map Component
│   ├── ProfileHeader.tsx       # User Profile Header
│   └── ...                     # Additional UI widgets & Modals
├── services/                   # Business Logic & API Layer
│   ├── database.ts             # Supabase Database Client & Operations
│   ├── geoapify.ts            # Location Search & Geocoding Services
│   ├── routes.ts               # Routing & Distance Calculation Engine
│   └── locationTask.ts         # Expo Background Location Handler
├── context/                    # React Context State Providers
│   ├── MapContext.tsx          # Map State & Location Provider
│   └── LocationContext.tsx     # Device Geolocation State
├── lib/                        # Third-Party Integrations
│   ├── supabase.ts             # Supabase Client Initialization
│   └── cloudinary.ts           # Cloudinary Media Upload & Transformations
├── types/                      # TypeScript Global Type Definitions
├── app.config.js               # Dynamic Expo Configuration
├── tailwind.config.js          # Tailwind CSS Configuration
└── package.json                # Project Dependencies & Scripts
```

---

## 🗄️ Database Schema

Travo relies on a relational PostgreSQL database powered by **Supabase**. The core entities include:

| Table | Description | Key Fields |
| :--- | :--- | :--- |
| **`users`** | Core user credentials & profile information | `id`, `email`, `username`, `display_name`, `avatar_url`, `city`, `country`, `bio` |
| **`profiles`** | Extended live tracking & preferences | `user_id`, `interests`, `last_latitude`, `last_longitude`, `is_live_tracking` |
| **`user_presence`** | Real-time user availability status | `user_id`, `status` (`idle` \| `in_activity` \| `looking`), `current_activity_id` |
| **`activities`** | Traveler meetups & events | `id`, `creator_id`, `title`, `size_type`, `visibility`, `latitude`, `longitude`, `status` |
| **`posts`** | Social media feed items | `id`, `author_id`, `text`, `media_url`, `media_type`, `venue_name`, `location_name` |
| **`post_comments`**| Discussion comments on travel posts | `id`, `post_id`, `author_id`, `text`, `created_at` |
| **`analytics_events`** | Product analytics events (batched from the app's local SQLite queue — see `supabase/migrations/`) | `id`, `user_id`, `name`, `props`, `created_at` |

---

## 🔌 Third-Party Services

Travo brings together best-in-class platforms to deliver a top-tier mobile experience:

- **[Clerk Expo](https://clerk.com)**: Frictionless authentication supporting social logins, secure token storage, and session hooks.
- **[Supabase](https://supabase.com)**: Scalable backend handling user data, activities, posts, comments, and geospatial points.
- **[Geoapify](https://www.geoapify.com)**: Fast geocoding, reverse geocoding, autocomplete search, and polyline routing.
- **[Cloudinary](https://cloudinary.com)**: Dynamic media optimization, background uploads, video streaming, and smart face cropping for avatars.

---

## 🚀 Getting Started

Follow these steps to get a local development instance up and running.

### Prerequisites

Make sure you have the following installed on your machine:
- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn** / **pnpm**
- **Expo Go** app on your iOS/Android device (or Android Studio / Xcode for emulators)

---

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/UtkarshSolanki0709/Travo.git
   cd Travo
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

---

### 🔑 Environment Variables

Create a `.env` file in the root of your project directory and add your API keys:

```env
# Clerk Authentication
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Geoapify API Key
EXPO_PUBLIC_GEOAPIFY_API_KEY=your_geoapify_api_key

# Google Maps API Key (Optional for Native Maps)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Cloudinary Storage
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset
```

---

### Running the App

Start the Expo development server:

```bash
# Start the Expo CLI server
npm start

# Run on Android Emulator / Device
npm run android

# Run on iOS Simulator / Device
npm run ios

# Run on Web Browser
npm run web
```

---

## 🛣️ Roadmap

- [ ] **Real-Time Group Chat**: Direct messaging & group chat rooms for activity participants.
- [ ] **Offline Map Caching**: Download trip regions for offline exploration.
- [ ] **AI Trip Itinerary Generator**: Smart AI recommendations for daily travel plans based on interests.
- [ ] **Push Notifications**: Instant alerts when requested to join activities or when receiving post comments.

---

## 🤝 Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">

---

Made with ❤️ by [Utkarsh Solanki](https://github.com/UtkarshSolanki0709) and the Travo Community.

</div>
