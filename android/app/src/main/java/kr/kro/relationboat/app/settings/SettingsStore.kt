package kr.kro.relationboat.app.settings

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import kr.kro.relationboat.app.domain.model.AppSettings
import kr.kro.relationboat.app.domain.model.FontPreset
import kr.kro.relationboat.app.domain.model.StorageMode

private val Context.dataStore by preferencesDataStore(name = "relationboat_settings")

@Singleton
class SettingsStore @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val storageModeKey = stringPreferencesKey("storage_mode")
    private val accountKey = stringPreferencesKey("google_account_email")
    private val fontPresetKey = stringPreferencesKey("font_preset")
    private val customFontKey = stringPreferencesKey("custom_font_uri")

    val settings: Flow<AppSettings> = context.dataStore.data
        .catch { emit(emptyPreferences()) }
        .map { prefs ->
            AppSettings(
                storageMode = prefs[storageModeKey]?.let(StorageMode::valueOf) ?: StorageMode.LOCAL_ONLY,
                googleAccountEmail = prefs[accountKey],
                fontPreset = prefs[fontPresetKey]?.let(FontPreset::valueOf) ?: FontPreset.SYSTEM,
                customFontUri = prefs[customFontKey],
            )
        }

    suspend fun updateStorageMode(mode: StorageMode) {
        context.dataStore.edit { it[storageModeKey] = mode.name }
    }

    suspend fun updateGoogleAccount(email: String?) {
        context.dataStore.edit {
            if (email == null) it.remove(accountKey) else it[accountKey] = email
        }
    }

    suspend fun updateFontPreset(fontPreset: FontPreset) {
        context.dataStore.edit { it[fontPresetKey] = fontPreset.name }
    }

    suspend fun updateCustomFont(uri: String?) {
        context.dataStore.edit {
            if (uri == null) it.remove(customFontKey) else it[customFontKey] = uri
        }
    }
}
