# SleepWake - OK to Wake Clock

A React Native app that works as an "ok to wake" clock for children. The app allows you to set bedtime and wake up times, and provides visual cues with color changes to indicate when it's okay to wake up.

## Features

- Set custom bedtime and wake up times
- Configurable warning time (default: 15 minutes before wake time)
- Night light mode with customizable colors (including purple)
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
   - Night Light: Toggle night light mode and select a color (including purple)
   - Is Nap: Toggle if this is a nap schedule
3. Save the schedule
4. Activate the schedule by tapping the "Activate" button
5. Return to the clock screen to see the active schedule

### Night Light Feature

The app includes a night light feature that fills the entire screen with a customizable color. By default, it uses a purple color (#8A2BE2), but you can choose from several other colors:

- Purple (#8A2BE2)
- Blue (#4169E1)
- Green (#32CD32)
- Red (#DC143C)
- Orange (#FFA500)
- Pink (#FF69B4)

To use the night light:
1. Create a schedule and enable the "Night Light" option
2. Tap on the color preview to open the color picker
3. Select your preferred color
4. Save the schedule and activate it
5. The screen will fill with the selected color during the active schedule period

## License

This project is licensed under the MIT License - see the LICENSE file for details.
