# My Music App 🎵

A professional mobile music application built with **React Native (Expo)**, designed to stream your own music from your own backend source.

---

## 📂 Project Structure

The project is divided into two main parts:

### 1. [Frontend (Mobile App)](./frontend)
The core application, built with a modern stack for a fast and fluid music experience.
- **Framework**: [Expo](https://expo.dev/) (React Native)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (Super simple and fast state management)
- **Data Fetching**: [TanStack Query (v5)](https://tanstack.com/query/latest) (Robust caching and synchronization)
- **Audio Playback**: [Expo AV](https://docs.expo.dev/versions/latest/sdk/av/) (Native audio/video capabilities)
- **Navigation**: [React Navigation](https://reactnavigation.org/) (Seamless screen transitions)

### 2. [Backend (Server)](./backend)
The server-side logic that provides song metadata and streamable links.
- **Current Status**: Implemented with Express, supports searching and stream URL extraction.

---

## 🚀 Getting Started

### 📱 Frontend: Running the Mobile App

To test the application before building a production version, we use the **Expo Development Server**.

1.  **Navigate to the frontend directory**:
    ```bash
    cd frontend
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Start the Expo server**:
    ```bash
    npx expo start
    ```
4.  **How to test it**:
    - **Physical Device (Recommended)**: Install the **Expo Go** app from the App Store or Play Store. Scan the QR code shown in your terminal.
    - **iOS Simulator**: Press `i` in the terminal (Requires macOS and Xcode).
    - **Android Emulator**: Press `a` in the terminal (Requires Android Studio and an AVD).
    - **Web**: Press `w` to run in the browser (though native features like Expo AV are better tested on devices).

### 🖥️ Backend: Future Server

Once you have your streamable links ready, we can implement the backend here.

---

## 🛠️ Tech Stack Overview

- **TypeScript**: Ensuring type-safe code throughout the application.
- **Node.js**: The backbone for both frontend tooling and future backend.
- **Zustand**: Managing the "Player State" (What's playing, current time, playlist).
- **Axios**: Communicating with your backend source.

---

## 🔧 Roadmap
- [ ] Implement backend server with music metadata.
- [ ] Connect `PlayerScreen` to a real stream.
- [ ] Add "Library" persistence for offline mode.
- [ ] Implement advanced Search functionality.
