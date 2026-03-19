package kr.kro.relationboat.app.ui.relationship

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kr.kro.relationboat.app.domain.model.PersonSearchFilter
import kr.kro.relationboat.app.ui.MainUiState
import kr.kro.relationboat.app.ui.PathQueryState
import kr.kro.relationboat.app.ui.relationship.detail.PersonDetailSection
import kr.kro.relationboat.app.ui.relationship.edit.RelationshipEditorSection
import kr.kro.relationboat.app.ui.relationship.folder.FolderSelectionSection
import kr.kro.relationboat.app.ui.relationship.list.PersonListSection
import kr.kro.relationboat.app.ui.relationship.path.PathVisualizerScreen

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun RelationshipScreen(
    state: MainUiState,
    onFilterChange: ((PersonSearchFilter.() -> PersonSearchFilter) -> Unit),
    onPathChange: ((PathQueryState.() -> PathQueryState) -> Unit),
    onPathSearch: () -> Unit,
) {
    Column(
        modifier = Modifier.verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        SectionFrame(title = "폴더 목록/선택") {
            FolderSelectionSection(state.folders)
        }
        SectionFrame(title = "사람 목록/검색") {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(value = state.filter.query, onValueChange = { value -> onFilterChange { copy(query = value) } }, label = { Text("이름") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = state.filter.phoneNumber, onValueChange = { value -> onFilterChange { copy(phoneNumber = value) } }, label = { Text("전화번호") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = state.filter.memo, onValueChange = { value -> onFilterChange { copy(memo = value) } }, label = { Text("메모") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = state.filter.category, onValueChange = { value -> onFilterChange { copy(category = value) } }, label = { Text("카테고리") }, modifier = Modifier.fillMaxWidth())
                Divider()
                PersonListSection(state.people)
            }
        }
        SectionFrame(title = "사람 상세/편집") {
            PersonDetailSection(state.people.firstOrNull())
        }
        SectionFrame(title = "관계 연결 생성/수정") {
            RelationshipEditorSection()
        }
        SectionFrame(title = "관계 경로 조회") {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = state.pathQuery.fromPersonId, onValueChange = { value -> onPathChange { copy(fromPersonId = value) } }, label = { Text("from person id") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = state.pathQuery.toPersonId, onValueChange = { value -> onPathChange { copy(toPersonId = value) } }, label = { Text("to person id") }, modifier = Modifier.fillMaxWidth())
                Text("depth: ${state.pathQuery.depth}")
                Slider(value = state.pathQuery.depth.toFloat(), onValueChange = { value -> onPathChange { copy(depth = value.toInt().coerceIn(0, 8)) } }, valueRange = 0f..8f, steps = 7)
                OutlinedButton(onClick = onPathSearch) { Text("경로 조회") }
                state.pathQuery.graph?.let { PathVisualizerScreen(it) }
            }
        }
    }
}

@Composable
private fun SectionFrame(title: String, content: @Composable () -> Unit) {
    OutlinedCard(
        modifier = Modifier.fillMaxWidth(),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
        colors = CardDefaults.outlinedCardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium)
            content()
        }
    }
}
