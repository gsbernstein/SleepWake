# SleepWake - OK to Wake Clock

A React Native app that works as an "ok to wake" clock for children. The app allows you to set bedtime and wake up times, and provides visual cues with color changes to indicate when it's okay to wake up.

## Features

- Set custom bedtime and wake up times
- Configurable warning time (default: 15 minutes before wake time)
- Night light mode
- Support for custom naps
- Color changes to indicate status:
  - Dark during sleep time
  - Yellow during warning period
  - Green at wake time
  - Black when no schedule is active
- iPad compatible

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio and Android SDK (for Android development)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

### Running the App

To start the development server:

```
npm start
```
or
```
yarn start
```

This will open the Expo Developer Tools in your browser. From there, you can:

- Press `i` to open the app in an iOS simulator
- Press `a` to open the app in an Android emulator
- Scan the QR code with the Expo Go app on your physical device

Alternatively, you can run the app directly:

For iOS:
```
npm run ios
```
or
```
yarn ios
```

For Android:
```
npm run android
```
or
```
yarn android
```

## Usage

1. Open the app and tap "Manage Schedules" at the bottom of the screen
2. Create a new schedule by filling in the form:
   - Name: Give your schedule a name (e.g., "Bedtime", "Nap Time")
   - Bedtime: Set the bedtime (HH:mm format)
   - Wake Time: Set the wake time (HH:mm format)
   - Warning Time: Set how many minutes before wake time the warning should start
   - Night Light: Toggle night light mode
   - Is Nap: Toggle if this is a nap schedule
3. Save the schedule
4. Activate the schedule by tapping the "Activate" button
5. Return to the clock screen to see the active schedule

## License

This project is licensed under the MIT License - see the LICENSE file for details.
