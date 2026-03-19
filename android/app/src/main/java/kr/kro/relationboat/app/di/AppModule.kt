package kr.kro.relationboat.app.di

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys
import androidx.room.Room
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton
import kotlinx.serialization.json.Json
import kr.kro.relationboat.app.data.local.RelationBoatDao
import kr.kro.relationboat.app.data.local.RelationBoatDatabase
import kr.kro.relationboat.app.data.remote.RelationBoatApi
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): RelationBoatDatabase =
        Room.databaseBuilder(context, RelationBoatDatabase::class.java, "relationboat.db").build()

    @Provides
    fun provideDao(database: RelationBoatDatabase): RelationBoatDao = database.dao()

    @Provides
    @Singleton
    fun provideAuthPrefs(@ApplicationContext context: Context) = EncryptedSharedPreferences.create(
        "secure_auth",
        MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC),
        context,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    @Provides
    @Singleton
    fun provideApi(prefs: android.content.SharedPreferences): RelationBoatApi {
        val authInterceptor = Interceptor { chain ->
            val token = prefs.getString("access_token", null)
            val request = chain.request().newBuilder().apply {
                if (!token.isNullOrBlank()) header("Authorization", "Bearer $token")
            }.build()
            chain.proceed(request)
        }
        val client = OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC })
            .build()
        val json = Json { ignoreUnknownKeys = true }
        return Retrofit.Builder()
            .baseUrl("https://relationboat.kro.kr/api/v1/")
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .client(client)
            .build()
            .create(RelationBoatApi::class.java)
    }
}
