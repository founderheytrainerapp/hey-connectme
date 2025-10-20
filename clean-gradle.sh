#!/bin/bash

echo "Stopping stuck Java/Gradle processes..."
powershell.exe "Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force"
powershell.exe "Get-Process gradlew -ErrorAction SilentlyContinue | Stop-Process -Force"

echo "Deleting global Gradle caches..."
rm -rf /c/Users/fathi/.gradle/caches
rm -rf /c/Users/fathi/.gradle/daemon
rm -rf /c/Users/fathi/.gradle/native
rm -rf /c/Users/fathi/.gradle/wrapper

echo "Deleting project Gradle cache..."
rm -rf /c/Users/fathi/HEY-TRAINER-APP/hey-trainer-client-app/android/.gradle

echo "Cleaning Android build..."
cd /c/Users/fathi/HEY-TRAINER-APP/hey-trainer-client-app/android || exit
./gradlew clean

echo "Done! You can now rebuild your app:"
echo "npx expo run:android"
