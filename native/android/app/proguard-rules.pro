# Keep Family Field Guide core models and serializers
-keep class io.github.dineshkumarponnusamy.familyfieldguide.core.** { *; }
-keepclassmembers class io.github.dineshkumarponnusamy.familyfieldguide.core.** {
    *** Companion;
    kotlinx.serialization.KSerializer serializer(...);
}

# Preserve kotlinx.serialization runtime and generated serializers
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.SerializationKt
-keep,includedescriptorclasses class io.github.dineshkumarponnusamy.familyfieldguide.**$$serializer { *; }
-keepclassmembers class * {
    @kotlinx.serialization.Serializable <fields>;
}
-if @kotlinx.serialization.Serializable class **
-keepclassmembers class <1> {
    static <1>$Companion Companion;
}
-if @kotlinx.serialization.Serializable class ** {
    static **$Companion Companion;
}
-keepclassmembers class <1>$Companion {
    kotlinx.serialization.KSerializer serializer(...);
}
