package kr.kro.relationboat.app.data.local

import androidx.room.ColumnInfo
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.RoomDatabase
import androidx.room.Transaction
import androidx.room.TypeConverter
import androidx.room.TypeConverters
import kotlinx.coroutines.flow.Flow
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

@Entity(tableName = "folders")
data class FolderEntity(
    @PrimaryKey val id: String,
    val name: String,
    val sortOrder: Int,
    val updatedAt: Long,
    val deletedAt: Long? = null,
)

@Entity(
    tableName = "people",
    foreignKeys = [ForeignKey(
        entity = FolderEntity::class,
        parentColumns = ["id"],
        childColumns = ["folderId"],
        onDelete = ForeignKey.CASCADE,
    )],
    indices = [Index("folderId"), Index("name"), Index("phoneNumber")],
)
data class PersonEntity(
    @PrimaryKey val id: String,
    val folderId: String,
    val name: String,
    val phoneNumber: String?,
    val memo: String?,
    val updatedAt: Long,
    val deletedAt: Long? = null,
)

@Entity(
    tableName = "relationships",
    indices = [Index("fromPersonId"), Index("toPersonId")],
)
data class RelationshipEntity(
    @PrimaryKey val id: String,
    val fromPersonId: String,
    val toPersonId: String,
    val title: String,
    val memo: String?,
    val updatedAt: Long,
    val deletedAt: Long? = null,
)

@Entity(
    primaryKeys = ["relationshipId", "category"],
    tableName = "relationship_category_cross_ref",
    indices = [Index("category")],
)
data class RelationshipCategoryCrossRef(
    val relationshipId: String,
    val category: String,
)

@Entity(tableName = "daily_memos")
data class DailyMemoEntity(
    @PrimaryKey val date: String,
    val content: String,
    val color: String,
    val intensity: Int,
    val updatedAt: Long,
    val deletedAt: Long? = null,
)

@Entity(tableName = "settings")
data class SettingEntity(
    @PrimaryKey @ColumnInfo(name = "setting_key") val key: String,
    @ColumnInfo(name = "setting_value") val value: String,
    val updatedAt: Long,
)

class CategoryListConverter {
    @TypeConverter
    fun fromList(value: List<String>): String = Json.encodeToString(value)

    @TypeConverter
    fun toList(value: String): List<String> =
        if (value.isBlank()) emptyList() else Json.decodeFromString(value)
}

@Dao
interface RelationBoatDao {
    @Query("SELECT * FROM folders WHERE deletedAt IS NULL ORDER BY sortOrder, name")
    fun observeFolders(): Flow<List<FolderEntity>>

    @Query(
        """
        SELECT DISTINCT p.* FROM people p
        LEFT JOIN relationships rf ON (rf.fromPersonId = p.id OR rf.toPersonId = p.id) AND rf.deletedAt IS NULL
        LEFT JOIN relationship_category_cross_ref rc ON rc.relationshipId = rf.id
        WHERE p.deletedAt IS NULL
          AND (:query = '' OR p.name LIKE '%' || :query || '%')
          AND (:phone = '' OR COALESCE(p.phoneNumber, '') LIKE '%' || :phone || '%')
          AND (:memo = '' OR COALESCE(p.memo, '') LIKE '%' || :memo || '%')
          AND (:category = '' OR rc.category = :category)
        ORDER BY p.name
        """,
    )
    fun searchPeople(query: String, phone: String, memo: String, category: String): Flow<List<PersonEntity>>

    @Query("SELECT * FROM people WHERE id = :id LIMIT 1")
    suspend fun getPerson(id: String): PersonEntity?

    @Query("SELECT * FROM relationships WHERE deletedAt IS NULL")
    suspend fun getRelationships(): List<RelationshipEntity>

    @Query("SELECT * FROM relationship_category_cross_ref")
    suspend fun getRelationshipCategories(): List<RelationshipCategoryCrossRef>

    @Query("SELECT * FROM daily_memos WHERE date = :date LIMIT 1")
    fun observeDailyMemo(date: String): Flow<DailyMemoEntity?>

    @Query("SELECT * FROM settings")
    fun observeSettings(): Flow<List<SettingEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertFolders(items: List<FolderEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertPeople(items: List<PersonEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertRelationships(items: List<RelationshipEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertRelationshipCategories(items: List<RelationshipCategoryCrossRef>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertDailyMemo(item: DailyMemoEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertSetting(item: SettingEntity)

    @Transaction
    suspend fun replaceRelationshipCategories(items: List<RelationshipCategoryCrossRef>) {
        upsertRelationshipCategories(items)
    }
}

@Database(
    entities = [
        FolderEntity::class,
        PersonEntity::class,
        RelationshipEntity::class,
        RelationshipCategoryCrossRef::class,
        DailyMemoEntity::class,
        SettingEntity::class,
    ],
    version = 1,
    exportSchema = false,
)
@TypeConverters(CategoryListConverter::class)
abstract class RelationBoatDatabase : RoomDatabase() {
    abstract fun dao(): RelationBoatDao
}
