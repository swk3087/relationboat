package kr.kro.relationboat.app.data.remote

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

@Serializable
data class FolderDto(
    val id: String,
    val name: String,
    val sortOrder: Int,
    val updatedAt: Long,
    val deletedAt: Long? = null,
)

@Serializable
data class PersonDto(
    val id: String,
    val folderId: String,
    val name: String,
    val phoneNumber: String? = null,
    val memo: String? = null,
    val updatedAt: Long,
    val deletedAt: Long? = null,
)

@Serializable
data class RelationshipDto(
    val id: String,
    val fromPersonId: String,
    val toPersonId: String,
    val title: String,
    val memo: String? = null,
    val categories: List<String> = emptyList(),
    val updatedAt: Long,
    val deletedAt: Long? = null,
)

@Serializable
data class DailyMemoDto(
    val date: String,
    val content: String,
    val color: String,
    val intensity: Int,
    val updatedAt: Long,
)

@Serializable
data class SyncPayloadDto(
    val folders: List<FolderDto>,
    val people: List<PersonDto>,
    val relationships: List<RelationshipDto>,
    val dailyMemos: List<DailyMemoDto>,
)

@Serializable
data class SyncResponseDto(
    val serverTimestamp: Long,
    val payload: SyncPayloadDto,
)

@Serializable
data class PathNodeDto(
    val personId: String,
    val personName: String,
    val depth: Int,
)

@Serializable
data class PathEdgeDto(
    val relationshipId: String,
    val fromPersonId: String,
    val toPersonId: String,
    val title: String,
    val categories: List<String> = emptyList(),
)

@Serializable
data class PathGraphDto(
    val columns: List<List<PathNodeDto>>,
    val edges: List<PathEdgeDto>,
    val depth: Int,
)

@Serializable
data class AuthTokenDto(
    @SerialName("access_token") val accessToken: String,
    @SerialName("refresh_token") val refreshToken: String,
)

interface RelationBoatApi {
    @GET("folders")
    suspend fun getFolders(): List<FolderDto>

    @GET("people")
    suspend fun searchPeople(
        @Query("query") query: String,
        @Query("phone") phone: String,
        @Query("memo") memo: String,
        @Query("category") category: String,
    ): List<PersonDto>

    @POST("relationships/path")
    suspend fun findPath(
        @Query("fromPersonId") fromPersonId: String,
        @Query("toPersonId") toPersonId: String,
        @Query("depth") depth: Int,
    ): PathGraphDto

    @POST("sync")
    suspend fun sync(@Body payload: SyncPayloadDto): SyncResponseDto
}
