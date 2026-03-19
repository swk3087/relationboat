package kr.kro.relationboat.app.ui.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kr.kro.relationboat.app.domain.model.FontPreset
import kr.kro.relationboat.app.domain.model.StorageMode
import kr.kro.relationboat.app.ui.MainUiState

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun SettingsScreen(
    state: MainUiState,
    onStorageModeSelected: (StorageMode) -> Unit,
    onGoogleConnect: (String?) -> Unit,
) {
    OutlinedCard(modifier = Modifier.fillMaxWidth()) {
        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Text("저장 방식 선택", style = MaterialTheme.typography.titleMedium)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                StorageMode.entries.forEach { mode ->
                    FilterChip(selected = state.settings.storageMode == mode, onClick = { onStorageModeSelected(mode) }, label = { Text(mode.name.lowercase()) })
                }
            }
            if (state.settings.storageMode == StorageMode.SYNC) {
                Text("sync 모드에서만 Google 로그인 유도", style = MaterialTheme.typography.bodyMedium)
                OutlinedButton(onClick = { onGoogleConnect("user@example.com") }) { Text(state.settings.googleAccountEmail ?: "Google 계정 연결") }
            }
            Text("전체 내보내기")
            OutlinedButton(onClick = { }) { Text("JSON/PNG 내보내기") }
            Text("글꼴 선택")
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                FontPreset.entries.forEach { font ->
                    FilterChip(selected = state.settings.fontPreset == font, onClick = { }, label = { Text(font.label) })
                }
            }
            Text("글꼴 업로드 또는 파일 선택")
            OutlinedButton(onClick = { }) { Text("파일 선택") }
        }
    }
}
