package kr.kro.relationboat.app.ui.relationship.list

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kr.kro.relationboat.app.domain.model.Person

@Composable
fun PersonListSection(people: List<Person>) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        people.forEach { person ->
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column {
                    Text(person.name, style = MaterialTheme.typography.titleMedium)
                    Text(person.phoneNumber ?: "전화번호 없음", style = MaterialTheme.typography.bodyMedium)
                }
                Text(person.memo ?: "")
            }
        }
    }
}
