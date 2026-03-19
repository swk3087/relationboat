package kr.kro.relationboat.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import java.time.LocalDate
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kr.kro.relationboat.app.data.repository.RelationBoatRepository
import kr.kro.relationboat.app.domain.model.AppSettings
import kr.kro.relationboat.app.domain.model.DailyMemo
import kr.kro.relationboat.app.domain.model.DailyMemoColor
import kr.kro.relationboat.app.domain.model.Folder
import kr.kro.relationboat.app.domain.model.PathGraph
import kr.kro.relationboat.app.domain.model.Person
import kr.kro.relationboat.app.domain.model.PersonSearchFilter
import kr.kro.relationboat.app.domain.model.StorageMode

@HiltViewModel
class MainViewModel @Inject constructor(
    private val repository: RelationBoatRepository,
) : ViewModel() {
    private val searchFilter = MutableStateFlow(PersonSearchFilter())
    private val selectedMemoDate = MutableStateFlow(LocalDate.now())
    private val pathQuery = MutableStateFlow(PathQueryState())

    private val peopleFlow = searchFilter.flatMapLatest(repository::searchPeople)
    private val memoFlow = selectedMemoDate.flatMapLatest(repository::observeDailyMemo)

    val uiState: StateFlow<MainUiState> = combine(
        repository.observeFolders(),
        peopleFlow,
        repository.observeSettings(),
        searchFilter,
        selectedMemoDate,
        memoFlow,
        pathQuery,
    ) { folders, people, settings, filter, memoDate, memo, path ->
        MainUiState(
            folders = folders,
            people = people,
            settings = settings,
            filter = filter,
            selectedMemoDate = memoDate,
            dailyMemo = memo,
            pathQuery = path,
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), MainUiState())

    init {
        viewModelScope.launch { repository.seedSampleDataIfEmpty() }
    }

    fun updateSearchFilter(update: PersonSearchFilter.() -> PersonSearchFilter) {
        searchFilter.update(update)
    }

    fun selectMemoDate(date: LocalDate) {
        selectedMemoDate.value = date
    }

    fun saveMemo(content: String, color: DailyMemoColor, intensity: Int) {
        viewModelScope.launch {
            repository.saveDailyMemo(
                DailyMemo(
                    date = selectedMemoDate.value,
                    content = content,
                    color = color,
                    intensity = intensity,
                    updatedAt = System.currentTimeMillis(),
                ),
            )
        }
    }

    fun updateStorageMode(mode: StorageMode) {
        viewModelScope.launch { repository.updateStorageMode(mode) }
    }

    fun connectGoogleAccount(email: String?) {
        viewModelScope.launch { repository.updateGoogleAccount(email) }
    }

    fun updatePathQuery(update: PathQueryState.() -> PathQueryState) {
        pathQuery.update(update)
    }

    fun loadPathGraph() {
        viewModelScope.launch {
            val query = pathQuery.value
            if (query.fromPersonId.isBlank() || query.toPersonId.isBlank()) return@launch
            val graph = if (uiState.value.settings.storageMode == StorageMode.SYNC) {
                repository.fetchRemotePathGraph(query.fromPersonId, query.toPersonId, query.depth)
            } else {
                repository.buildLocalPathGraph(query.fromPersonId, query.toPersonId, query.depth)
            }
            pathQuery.update { it.copy(graph = graph) }
        }
    }
}

data class MainUiState(
    val folders: List<Folder> = emptyList(),
    val people: List<Person> = emptyList(),
    val settings: AppSettings = AppSettings(),
    val filter: PersonSearchFilter = PersonSearchFilter(),
    val selectedMemoDate: LocalDate = LocalDate.now(),
    val dailyMemo: DailyMemo? = null,
    val pathQuery: PathQueryState = PathQueryState(),
)

data class PathQueryState(
    val fromPersonId: String = "",
    val toPersonId: String = "",
    val depth: Int = 3,
    val graph: PathGraph? = null,
)
