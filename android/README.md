# Android build notes

This project uses a text-only Gradle bootstrap script instead of committing `gradle-wrapper.jar`.
When you run `./gradlew`, the script reads `gradle/wrapper/gradle-wrapper.properties`, downloads the Gradle ZIP declared there, extracts it into `android/.gradle-bootstrap/`, and then runs that Gradle installation.

The Gradle project also auto-generates `local.properties` when it is missing and an Android SDK can be found from one of these sources:

- `ANDROID_HOME`
- `ANDROID_SDK_ROOT`
- JVM properties `android.home` or `android.sdk.path`
- Common SDK install paths such as `~/Android/Sdk`, `/usr/local/android-sdk`, `/opt/android-sdk`, `/opt/android-sdk-linux`, or `/usr/lib/android-sdk`

If none of those locations exist, APK builds will still fail until you install the Android SDK and point one of the variables above to it.

Typical local build:

```bash
cd android
export ANDROID_HOME="$HOME/Android/Sdk"
./gradlew assembleDebug
```

GitHub Actions can use the same script after installing Java and Android SDK packages; no binary wrapper JAR needs to be checked into the repository.
