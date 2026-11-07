# APK de White Door (Android)

La app empaqueta el juego completo con Capacitor, así que funciona sin internet.

## Volver a generar el APK

Requisitos: Node, Java 17+ y el Android SDK en `C:\Users\julia\Android\Sdk`.

```bash
cd apk
npm install
npm run sync              # copia el juego a www/ y lo pasa al proyecto Android
python make-icons.py      # íconos y pantalla de carga (solo tras crear android/)
cd android && ./gradlew.bat assembleRelease
```

El APK queda en `android/app/build/outputs/apk/release/app-release.apk`.

Para que el celular acepte una actualización encima de la app instalada, sube `versionCode`
en `android/app/build.gradle` y firma siempre con la misma llave `whitedoor.keystore`
(y su clave en `keystore.properties`). Esos dos archivos no se suben a GitHub: guárdalos con copia de seguridad.
