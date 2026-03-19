package kr.kro.relationboat.app.domain.model

import java.time.LocalDate

enum class StorageMode { LOCAL_ONLY, SYNC }
enum class FontPreset(val label: String) { SYSTEM("시스템"), SANS("Sans"), SERIF("Serif") }
enum class DailyMemoColor(val label: String) {
    RED("빨"), ORANGE("주"), YELLOW("노"), GREEN("초"), BLUE("파"), NAVY("남"), PURPLE("보"), WHITE("흰"), BLACK("검")
}

data class Folder(
    val id: String,
    val name: String,
    val sortOrder: Int,
    val updatedAt: Long,
    val deletedAt: Long? = null,
)

data class Person(
    val id: String,
    val folderId: String,
    val name: String,
    val phoneNumber: String?,
    val memo: String?,
    val updatedAt: Long,
    val deletedAt: Long? = null,
)

data class Relationship(
    val id: String,
    val fromPersonId: String,
    val toPersonId: String,
    val title: String,
    val memo: String?,
    val categories: List<String>,
    val updatedAt: Long,
    val deletedAt: Long? = null,
)

data class DailyMemo(
    val date: LocalDate,
    val content: String,
    val color: DailyMemoColor,
    val intensity: Int,
    val updatedAt: Long,
)

data class AppSettings(
    val storageMode: StorageMode = StorageMode.LOCAL_ONLY,
    val googleAccountEmail: String? = null,
    val fontPreset: FontPreset = FontPreset.SYSTEM,
    val customFontUri: String? = null,
)

data class PersonSearchFilter(
    val query: String = "",
    val phoneNumber: String = "",
    val memo: String = "",
    val category: String = "",
)

data class PathEdge(
    val relationshipId: String,
    val fromPersonId: String,
    val toPersonId: String,
    val title: String,
    val categories: List<String>,
)

data class PathNode(
    val personId: String,
    val personName: String,
    val depth: Int,
)

data class PathGraph(
    val columns: List<List<PathNode>>,
    val edges: List<PathEdge>,
    val depth: Int,
)

fun LocalDate.isEditable(now: LocalDate): Boolean = this <= now.plusDays(1)
