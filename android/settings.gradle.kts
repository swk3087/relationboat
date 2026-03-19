import java.util.Properties

fun ensureAndroidSdkLocalProperties() {
    val localPropertiesFile = rootDir.resolve("local.properties")
    if (localPropertiesFile.exists()) {
        return
    }

    val sdkCandidates = listOfNotNull(
        System.getenv("ANDROID_HOME"),
        System.getenv("ANDROID_SDK_ROOT"),
        System.getProperty("android.home"),
        System.getProperty("android.sdk.path"),
        System.getenv("HOME")?.let { "$it/Android/Sdk" },
        "/usr/local/android-sdk",
        "/opt/android-sdk",
        "/opt/android-sdk-linux",
        "/usr/lib/android-sdk",
    ).map(::File)
        .firstOrNull(File::isDirectory)
        ?: return

    val properties = Properties().apply {
        setProperty("sdk.dir", sdkCandidates.absolutePath)
    }
    localPropertiesFile.outputStream().use { output ->
        properties.store(output, "Auto-generated from environment for Gradle builds")
    }
}

ensureAndroidSdkLocalProperties()

pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "RelationBoatAndroid"
include(":app")
