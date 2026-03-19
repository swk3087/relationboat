package kr.kro.relationboat.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val ColdColorScheme = darkColorScheme(
    primary = Color(0xFF9AA8B7),
    onPrimary = Color(0xFF11161C),
    background = Color(0xFF0E141B),
    onBackground = Color(0xFFD8E0E8),
    surface = Color(0xFF141C24),
    onSurface = Color(0xFFD8E0E8),
    secondary = Color(0xFF738396),
    outline = Color(0xFF344454),
)

@Composable
fun RelationBoatTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = ColdColorScheme,
        typography = RelationBoatTypography,
        content = content,
    )
}
