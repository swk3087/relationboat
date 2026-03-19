package kr.kro.relationboat.app.ui.relationship.folder

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Text
import kr.kro.relationboat.app.domain.model.Folder

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun FolderSelectionSection(folders: List<Folder>) {
    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        folders.forEach { folder ->
            FilterChip(selected = false, onClick = { }, label = { Text(folder.name) })
        }
    }
}
