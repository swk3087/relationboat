package kr.kro.relationboat.app.export

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.net.Uri
import java.io.File
import java.io.FileOutputStream
import javax.inject.Inject
import javax.inject.Singleton
import dagger.hilt.android.qualifiers.ApplicationContext
import kr.kro.relationboat.app.domain.model.PathGraph

@Singleton
class PathPngExporter @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    fun export(graph: PathGraph): Uri {
        val width = 1080
        val height = (graph.columns.size.coerceAtLeast(1) * 220).coerceAtLeast(720)
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(Color.rgb(18, 24, 32))
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.rgb(210, 220, 230)
            textSize = 36f
        }
        graph.columns.flatten().forEachIndexed { index, node ->
            canvas.drawText("${node.personName} (${node.depth})", 60f, 80f + index * 80f, paint)
        }
        val file = File(context.cacheDir, "relation_path_${System.currentTimeMillis()}.png")
        FileOutputStream(file).use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
        return Uri.fromFile(file)
    }
}
