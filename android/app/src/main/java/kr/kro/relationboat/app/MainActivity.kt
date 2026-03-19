package kr.kro.relationboat.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.Composable
import dagger.hilt.android.AndroidEntryPoint
import kr.kro.relationboat.app.ui.RelationBoatApp
import kr.kro.relationboat.app.ui.theme.RelationBoatTheme

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent { AppContent() }
    }
}

@Composable
private fun AppContent() {
    RelationBoatTheme {
        RelationBoatApp()
    }
}
