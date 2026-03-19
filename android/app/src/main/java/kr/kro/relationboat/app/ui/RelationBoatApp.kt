package kr.kro.relationboat.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.Today
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import kr.kro.relationboat.app.ui.memo.DailyMemoScreen
import kr.kro.relationboat.app.ui.relationship.RelationshipScreen
import kr.kro.relationboat.app.ui.settings.SettingsScreen

private enum class RootSection(val label: String) { RELATIONSHIP("관계"), DAILY_MEMO("그날의 메모"), SETTINGS("설정") }

@Composable
fun RelationBoatApp(viewModel: MainViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    var currentSection by rememberSaveable { mutableStateOf(RootSection.RELATIONSHIP) }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        bottomBar = {
            NavigationBar {
                listOf(
                    RootSection.RELATIONSHIP to Icons.Outlined.Groups,
                    RootSection.DAILY_MEMO to Icons.Outlined.Today,
                    RootSection.SETTINGS to Icons.Outlined.Settings,
                ).forEach { (section, icon) ->
                    NavigationBarItem(
                        selected = currentSection == section,
                        onClick = { currentSection = section },
                        icon = { androidx.compose.material3.Icon(icon, contentDescription = section.label) },
                        label = { Text(section.label) },
                    )
                }
            }
        },
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 20.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text(text = currentSection.label, modifier = Modifier.fillMaxWidth())
            when (currentSection) {
                RootSection.RELATIONSHIP -> RelationshipScreen(state = state, onFilterChange = viewModel::updateSearchFilter, onPathChange = viewModel::updatePathQuery, onPathSearch = viewModel::loadPathGraph)
                RootSection.DAILY_MEMO -> DailyMemoScreen(state = state, onDateChange = viewModel::selectMemoDate, onSave = viewModel::saveMemo)
                RootSection.SETTINGS -> SettingsScreen(state = state, onStorageModeSelected = viewModel::updateStorageMode, onGoogleConnect = viewModel::connectGoogleAccount)
            }
        }
    }
}
