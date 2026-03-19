package kr.kro.relationboat.app.ui.navigation

sealed interface AppDestination {
    data object Relationship : AppDestination
    data object DailyMemo : AppDestination
    data object Settings : AppDestination
}
