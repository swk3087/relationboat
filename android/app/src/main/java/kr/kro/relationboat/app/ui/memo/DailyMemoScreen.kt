package kr.kro.relationboat.app.ui.memo

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import java.time.LocalDate
import kr.kro.relationboat.app.domain.model.DailyMemoColor
import kr.kro.relationboat.app.domain.model.isEditable
import kr.kro.relationboat.app.ui.MainUiState

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun DailyMemoScreen(
    state: MainUiState,
    onDateChange: (LocalDate) -> Unit,
    onSave: (String, DailyMemoColor, Int) -> Unit,
) {
    var content by remember(state.dailyMemo?.content) { mutableStateOf(state.dailyMemo?.content.orEmpty()) }
    var color by remember(state.dailyMemo?.color) { mutableStateOf(state.dailyMemo?.color ?: DailyMemoColor.BLUE) }
    var intensity by remember(state.dailyMemo?.intensity) { mutableStateOf(state.dailyMemo?.intensity ?: 2) }
    val editable = state.selectedMemoDate.isEditable(LocalDate.now())

    OutlinedCard(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("날짜별 작성/조회", style = MaterialTheme.typography.titleMedium)
            OutlinedTextField(value = state.selectedMemoDate.toString(), onValueChange = {}, readOnly = true, label = { Text("선택 날짜") }, modifier = Modifier.fillMaxWidth())
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(-1L, 0L, 1L, 2L).forEach { offset ->
                    val date = LocalDate.now().plusDays(offset)
                    FilterChip(selected = state.selectedMemoDate == date, onClick = { onDateChange(date) }, label = { Text(date.toString()) })
                }
            }
            OutlinedTextField(value = content, onValueChange = { content = it }, readOnly = !editable, minLines = 6, label = { Text("그날의 메모") }, modifier = Modifier.fillMaxWidth())
            Text("대표 색 선택")
            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                DailyMemoColor.entries.forEach { candidate ->
                    FilterChip(selected = color == candidate, onClick = { color = candidate }, label = { Text(candidate.label) })
                }
            }
            Text("중요도: $intensity")
            Slider(value = intensity.toFloat(), onValueChange = { intensity = it.toInt().coerceIn(1, 5) }, valueRange = 1f..5f, steps = 3, enabled = editable)
            OutlinedButton(onClick = { onSave(content, color, intensity) }, enabled = editable) {
                Text(if (editable) "오늘/내일 메모 저장" else "읽기 전용")
            }
        }
    }
}
