package kr.kro.relationboat.app.ui.relationship.edit

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.FilterChip
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun RelationshipEditorSection() {
    var selectedCategories by remember { mutableStateOf(listOf("친구")) }
    val options = listOf("친구", "가족", "동아리", "직장", "스터디")
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        OutlinedTextField(value = "민아", onValueChange = {}, readOnly = true, label = { Text("from") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = "준호", onValueChange = {}, readOnly = true, label = { Text("to") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = "친구", onValueChange = {}, label = { Text("제목") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = "방과 후 스터디", onValueChange = {}, label = { Text("메모") }, modifier = Modifier.fillMaxWidth())
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            options.forEach { category ->
                FilterChip(selected = category in selectedCategories, onClick = {
                    selectedCategories = if (category in selectedCategories) selectedCategories - category else selectedCategories + category
                }, label = { Text(category) })
            }
        }
    }
}
