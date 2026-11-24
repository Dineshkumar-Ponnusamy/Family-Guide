package io.github.dineshkumarponnusamy.familyfieldguide.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

object FfgColors {
    val Paper = Color(0xFFF6F1E6)
    val Paper2 = Color(0xFFEFE7D6)
    val CardBg = Color(0xFFFFFDF8)
    val Ink = Color(0xFF1F3A2E)
    val Ink2 = Color(0xFF4B5F55)
    val Mute = Color(0xFF5D6359)
    val Rule = Color(0xFFD9CFB9)
    val Tomato = Color(0xFFD2512F)
    val TomatoInk = Color(0xFFB3381A)
    val Sun = Color(0xFFE9B44C)
    val Sky = Color(0xFF4F7C8A)
    val AlertBg = Color(0xFFFFF5F2)
    val WarnBg = Color(0xFFFBF3DF)
    val InfoBg = Color(0xFFE7F0F2)
    val DemoIdleBg = Color(0xFFEEF5EE)
    val DemoActiveBg = Color(0xFFFFF3DD)
    val OkGreen = Color(0xFF2E6F5E)

    val HcPaper = Color.White
    val HcInk = Color(0xFF0B1410)
    val HcRule = Color(0xFF333333)
    val HcTomato = Color(0xFFB32D0F)

    val REGION_ORDER = listOf("us", "us_in", "in", "visa_intl", "uk", "ca", "au", "eu", "generic")
    val PLAYBOOK_ORDER = listOf("hurt", "illness", "gone", "windfall", "money", "caregiver", "visa")
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

private val HighContrastPalette = lightColorScheme(
    primary = FfgColors.HcInk,
    onPrimary = Color.White,
    secondary = FfgColors.HcTomato,
    onSecondary = Color.White,
    background = FfgColors.HcPaper,
    onBackground = FfgColors.HcInk,
    surface = FfgColors.HcPaper,
    onSurface = FfgColors.HcInk
)

fun ffgTypography(largeText: Boolean): Typography {
    val bump = if (largeText) 3 else 0
    return Typography(
        headlineSmall = TextStyle(
            fontFamily = FontFamily.Serif,
            fontWeight = FontWeight.Bold,
            fontSize = (24 + bump).sp,
            lineHeight = (30 + bump).sp
        ),
        titleLarge = TextStyle(
            fontFamily = FontFamily.Serif,
            fontWeight = FontWeight.Bold,
            fontSize = (20 + bump).sp,
            lineHeight = (26 + bump).sp
        ),
        titleMedium = TextStyle(
            fontFamily = FontFamily.Serif,
            fontWeight = FontWeight.SemiBold,
            fontSize = (18 + bump).sp,
            lineHeight = (24 + bump).sp
        ),
        bodyLarge = TextStyle(
            fontFamily = FontFamily.SansSerif,
            fontWeight = FontWeight.Normal,
            fontSize = (15 + bump).sp,
            lineHeight = (22 + bump).sp
        ),
        bodyMedium = TextStyle(
            fontFamily = FontFamily.SansSerif,
            fontWeight = FontWeight.Normal,
            fontSize = (14 + bump).sp,
            lineHeight = (20 + bump).sp
        ),
        bodySmall = TextStyle(
            fontFamily = FontFamily.SansSerif,
            fontWeight = FontWeight.Normal,
            fontSize = (12.5f + bump).sp,
            lineHeight = (18 + bump).sp
        ),
        labelMedium = TextStyle(
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.SemiBold,
            fontSize = (11.5f + (if (largeText) 1.5f else 0f)).sp,
            letterSpacing = 0.6.sp
        ),
        labelSmall = TextStyle(
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.SemiBold,
            fontSize = (10.5f + (if (largeText) 1.5f else 0f)).sp,
            letterSpacing = 0.7.sp
        )
    )
}

@Composable
fun FamilyGuideTheme(
    largeText: Boolean = false,
    highContrast: Boolean = false,
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = if (highContrast) HighContrastPalette else LightPalette,
        typography = ffgTypography(largeText),
        content = content
    )
}

@Composable
fun FfgBrandLogo(size: Dp = 32.dp) {
    Canvas(modifier = Modifier.size(size)) {
        val s = this.size.minDimension / 128f
        drawRoundRect(
            color = FfgColors.Paper,
            topLeft = Offset.Zero,
            size = Size(128f * s, 128f * s),
            cornerRadius = CornerRadius(28f * s, 28f * s)
        )
        drawRoundRect(
            color = FfgColors.Ink,
            topLeft = Offset(8f * s, 8f * s),
            size = Size(112f * s, 112f * s),
            cornerRadius = CornerRadius(22f * s, 22f * s),
            style = Stroke(width = 6f * s)
        )
        val house = Path().apply {
            moveTo(64f * s, 26f * s)
            lineTo(28f * s, 54f * s)
            lineTo(28f * s, 98f * s)
            lineTo(100f * s, 98f * s)
            lineTo(100f * s, 54f * s)
            close()
        }
        drawPath(house, color = FfgColors.CardBg)
        drawPath(house, color = FfgColors.Ink, style = Stroke(width = 5f * s, join = StrokeJoin.Round))

        val heart = Path().apply {
            moveTo(64f * s, 84f * s)
            cubicTo(53f * s, 76.5f * s, 46f * s, 70f * s, 46f * s, 62f * s)
            cubicTo(46f * s, 55f * s, 51f * s, 51f * s, 56f * s, 51f * s)
            cubicTo(60f * s, 51f * s, 63f * s, 53f * s, 64f * s, 56f * s)
            cubicTo(65f * s, 53f * s, 68f * s, 51f * s, 72f * s, 51f * s)
            cubicTo(77f * s, 51f * s, 82f * s, 55f * s, 82f * s, 62f * s)
            cubicTo(82f * s, 70f * s, 75f * s, 76.5f * s, 64f * s, 84f * s)
            close()
        }
        drawPath(heart, color = FfgColors.Tomato)
    }
}

@Composable
fun FfgCard(
    highlightTomato: Boolean = false,
    highContrast: Boolean = false,
    content: @Composable ColumnScope.() -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        color = if (highlightTomato) FfgColors.AlertBg else if (highContrast) FfgColors.HcPaper else FfgColors.CardBg,
        border = BorderStroke(
            if (highlightTomato || highContrast) 2.dp else 1.dp,
            if (highlightTomato) FfgColors.Tomato else if (highContrast) FfgColors.HcRule else FfgColors.Rule
        )
    ) {
        Column(modifier = Modifier.padding(16.dp), content = content)
    }
}
