package kr.kro.relationboat.app.ui.relationship.path

import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import kr.kro.relationboat.app.domain.model.PathGraph
import kr.kro.relationboat.app.export.PathPngExporter

@Composable
fun PathVisualizerScreen(graph: PathGraph) {
    val context = LocalContext.current
    val exporter = remember(context) { PathPngExporter(context) }
    var exportedUri by remember { mutableStateOf<Uri?>(null) }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.horizontalScroll(rememberScrollState())) {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            graph.columns.forEach { column ->
                Column(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.width(220.dp)) {
                    column.distinctBy { it.personId }.forEach { node ->
                        OutlinedCard(border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline), colors = CardDefaults.outlinedCardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text(node.personName, style = MaterialTheme.typography.titleMedium)
                                Text("depth ${node.depth}", style = MaterialTheme.typography.bodyMedium)
                            }
                        }
                    }
                }
            }
        }
        graph.edges.forEach { edge ->
            Text("${edge.fromPersonId} → ${edge.toPersonId} · ${edge.title} · ${edge.categories.joinToString()}", style = MaterialTheme.typography.bodyMedium)
        }
        OutlinedButton(onClick = { exportedUri = exporter.export(graph) }) {
            Text("PNG 저장")
        }
        exportedUri?.let { Text("저장됨: $it", style = MaterialTheme.typography.bodyMedium) }
    }
}
