package kr.kro.relationboat.app.data.repository

import java.time.LocalDate
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kr.kro.relationboat.app.data.local.DailyMemoEntity
import kr.kro.relationboat.app.data.local.FolderEntity
import kr.kro.relationboat.app.data.local.PersonEntity
import kr.kro.relationboat.app.data.local.RelationBoatDao
import kr.kro.relationboat.app.data.local.RelationshipCategoryCrossRef
import kr.kro.relationboat.app.data.local.RelationshipEntity
import kr.kro.relationboat.app.data.remote.RelationBoatApi
import kr.kro.relationboat.app.domain.model.DailyMemo
import kr.kro.relationboat.app.domain.model.DailyMemoColor
import kr.kro.relationboat.app.domain.model.Folder
import kr.kro.relationboat.app.domain.model.PathEdge
import kr.kro.relationboat.app.domain.model.PathGraph
import kr.kro.relationboat.app.domain.model.PathNode
import kr.kro.relationboat.app.domain.model.Person
import kr.kro.relationboat.app.domain.model.PersonSearchFilter
import kr.kro.relationboat.app.domain.model.Relationship
import kr.kro.relationboat.app.domain.model.StorageMode
import kr.kro.relationboat.app.settings.SettingsStore
import kr.kro.relationboat.app.sync.SyncCoordinator

@Singleton
class RelationBoatRepository @Inject constructor(
    private val dao: RelationBoatDao,
    private val api: RelationBoatApi,
    private val settingsStore: SettingsStore,
    private val syncCoordinator: SyncCoordinator,
) {
    fun observeFolders(): Flow<List<Folder>> = dao.observeFolders().map { list -> list.map { it.toDomain() } }

    fun searchPeople(filter: PersonSearchFilter): Flow<List<Person>> =
        settingsStore.settings.combine(
            dao.searchPeople(filter.query, filter.phoneNumber, filter.memo, filter.category),
        ) { settings, local ->
            if (settings.storageMode == StorageMode.SYNC && filter.category.isNotBlank()) {
                syncCoordinator.requestBackgroundSync()
            }
            local.map { it.toDomain() }
        }

    fun observeDailyMemo(date: LocalDate): Flow<DailyMemo?> =
        dao.observeDailyMemo(date.toString()).map { it?.toDomain() }

    fun observeSettings() = settingsStore.settings

    suspend fun saveDailyMemo(memo: DailyMemo) {
        dao.upsertDailyMemo(memo.toEntity())
        syncCoordinator.requestBackgroundSync()
    }

    suspend fun updateStorageMode(mode: StorageMode) {
        settingsStore.updateStorageMode(mode)
    }

    suspend fun updateGoogleAccount(email: String?) {
        settingsStore.updateGoogleAccount(email)
    }

    suspend fun seedSampleDataIfEmpty() {
        if (dao.observeFolders().first().isNotEmpty()) return
        val now = System.currentTimeMillis()
        dao.upsertFolders(
            listOf(
                FolderEntity("folder-elementary", "초등", 0, now),
                FolderEntity("folder-middle", "중등", 1, now),
            ),
        )
        dao.upsertPeople(
            listOf(
                PersonEntity("person-mina", "folder-elementary", "민아", "010-1234-5678", "합창부", now),
                PersonEntity("person-jun", "folder-middle", "준호", "010-2345-6789", "축구부", now),
                PersonEntity("person-seo", "folder-middle", "서윤", null, "학급 회장", now),
            ),
        )
        dao.upsertRelationships(
            listOf(
                RelationshipEntity("rel-1", "person-mina", "person-jun", "친구", "방과 후 스터디", now),
                RelationshipEntity("rel-2", "person-jun", "person-seo", "동아리", "봉사팀", now),
            ),
        )
        dao.upsertRelationshipCategories(
            listOf(
                RelationshipCategoryCrossRef("rel-1", "친구"),
                RelationshipCategoryCrossRef("rel-1", "스터디"),
                RelationshipCategoryCrossRef("rel-2", "동아리"),
            ),
        )
    }

    suspend fun buildLocalPathGraph(fromPersonId: String, toPersonId: String, depth: Int): PathGraph {
        val people = listOfNotNull(dao.getPerson(fromPersonId), dao.getPerson(toPersonId))
        val relationships = dao.getRelationships()
        val categoryMap = dao.getRelationshipCategories().groupBy { it.relationshipId }.mapValues { entry -> entry.value.map { it.category } }
        return PathGraph(
            columns = people.mapIndexed { index, person -> listOf(PathNode(person.id, person.name, index * depth.coerceAtLeast(1))) },
            edges = relationships.filter { it.fromPersonId == fromPersonId || it.toPersonId == toPersonId }.map {
                PathEdge(it.id, it.fromPersonId, it.toPersonId, it.title, categoryMap[it.id].orEmpty())
            },
            depth = depth,
        )
    }

    suspend fun fetchRemotePathGraph(fromPersonId: String, toPersonId: String, depth: Int): PathGraph {
        val dto = api.findPath(fromPersonId, toPersonId, depth)
        return PathGraph(
            columns = dto.columns.map { column -> column.map { PathNode(it.personId, it.personName, it.depth) } },
            edges = dto.edges.map { PathEdge(it.relationshipId, it.fromPersonId, it.toPersonId, it.title, it.categories) },
            depth = dto.depth,
        )
    }
}

private fun FolderEntity.toDomain() = Folder(id, name, sortOrder, updatedAt, deletedAt)
private fun PersonEntity.toDomain() = Person(id, folderId, name, phoneNumber, memo, updatedAt, deletedAt)
private fun DailyMemoEntity.toDomain() = DailyMemo(LocalDate.parse(date), content, DailyMemoColor.valueOf(color), intensity, updatedAt)
private fun DailyMemo.toEntity() = DailyMemoEntity(date.toString(), content, color.name, intensity, updatedAt)
