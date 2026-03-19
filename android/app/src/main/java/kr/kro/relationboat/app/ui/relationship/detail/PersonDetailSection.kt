package kr.kro.relationboat.app.ui.relationship.detail

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kr.kro.relationboat.app.domain.model.Person

@Composable
fun PersonDetailSection(person: Person?) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        OutlinedTextField(value = person?.name.orEmpty(), onValueChange = {}, readOnly = true, label = { Text("이름") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = person?.phoneNumber.orEmpty(), onValueChange = {}, readOnly = true, label = { Text("전화번호") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = person?.memo.orEmpty(), onValueChange = {}, readOnly = true, label = { Text("메모") }, modifier = Modifier.fillMaxWidth())
    }
}
