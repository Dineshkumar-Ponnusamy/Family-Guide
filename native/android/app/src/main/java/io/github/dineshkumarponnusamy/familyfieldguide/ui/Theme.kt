package io.github.dineshkumarponnusamy.familyfieldguide.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

object FfgColors {
    val Paper = Color(0xFFF6F1E6)
    val Paper2 = Color(0xFFEFE7D6)
    val CardBg = Color(0xFFFFFDF8)
    val Ink = Color(0xFF1F3A2E)
    val Ink2 = Color(0xFF4B5F55)
    val Mute = Color(0xFF8A8F84)
    val Rule = Color(0xFFD9CFB9)
    val Tomato = Color(0xFFD2512F)
    val Sun = Color(0xFFE9B44C)
    val Sky = Color(0xFF4F7C8A)
    val AlertBg = Color(0xFFFFF5F2)
    val WarnBg = Color(0xFFFBF3DF)
    val InfoBg = Color(0xFFE7F0F2)
}

private val LightPalette = lightColorScheme(
    primary = FfgColors.Ink,
    onPrimary = FfgColors.Paper,
    secondary = FfgColors.Tomato,
    onSecondary = Color.White,
    background = FfgColors.Paper,
    onBackground = FfgColors.Ink,
    surface = FfgColors.CardBg,
    onSurface = FfgColors.Ink
)

@Composable
fun FamilyGuideTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = LightPalette, content = content)
}

@Composable
fun FfgCard(highlightTomato: Boolean = false, content: @Composable ColumnScope.() -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        color = if (highlightTomato) FfgColors.AlertBg else FfgColors.CardBg,
        border = BorderStroke(if (highlightTomato) 2.dp else 1.dp, if (highlightTomato) FfgColors.Tomato else FfgColors.Rule)
    ) {
        Column(modifier = Modifier.padding(16.dp), content = content)
    }
}
