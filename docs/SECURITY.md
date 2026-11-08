# Seguridad y operación local

## Límite actual

Solo loopback 127.0.0.1. Esta versión no está preparada ni autorizada para publicación/acceso remoto. Los archivos locales y SQLite no están cifrados por la aplicación: la privacidad frente a otros usuarios del sistema depende de permisos de Windows y cifrado del equipo. La autenticación web no cifra el disco ni el backup. No guardar aquí información real sensible antes de revisar operación/recuperación.

## Controles implementados

- Primera cuenta solo desde el equipo y cuando no hay usuarios, transacción para evitar carreras. Segunda cuenta autenticada, límite inicial de dos. No hay registro público ni contraseña por defecto. Contraseñas de 12–128 caracteres, hash scrypt con sal aleatoria (N=32768, r=8, p=3); no se guarda la contraseña en claro.
- Tokens opacos aleatorios de 256 bits, solo SHA-256 en base de datos, cookie HttpOnly y SameSite Strict, expiración12h e invalidación al salir. Secure cuando el origen es HTTPS. HTTP solo para loopback; HTTPS obligatorio antes de remoto.
- Todas las rutas de datos/originales/OpenAPI requieren sesión. User_id resuelto en servidor; watchlist, libro y valoraciones filtrados por propietario. Biblioteca compartida de forma intencional entre las dos cuentas.
- Mutaciones exigen cabecera no simple y origen coincidente cuando existe. Sin CORS permisivo. TrustedHost evita hosts arbitrarios. Límite de tamaño y rate limit básico del login por IP en memoria, adecuado solo para este proceso local.
- SQL parametrizado, Pydantic con campos extra prohibidos y controles financieros. Ruta original sale del catálogo, valida contención y hash. React escapa texto documental; sin HTML recuperado ejecutable ni modelo conectado a herramientas.
- CSP de mismo origen, nosniff, cache no-store y restricción de framing al propio origen para el visor PDF. Logs de peticiones con identificador; sin contraseña/cookie ni cuerpos documentales.
- Sin secretos de proveedor, repositorio remoto, tracking externo, brokers ni trabajos programados.

## Pendiente antes de remoto

Proveedor de identidad y recuperación de cuentas, cambio/revocación de credenciales, permisos de carteras compartidas, TLS/HSTS, límites distribuidos, auditoría persistente, protección/backup cifrado y política de retención. Revisar acceso/licencias del curso y proveedores, separar entornos y hacer auditoría independiente. Las pruebas actuales no constituyen certificación de seguridad.

## Copia local

Con el servidor detenido, copiar `.local/iip.sqlite` e inventarios a una ubicación privada autorizada. Con servidor activo, usar la API `sqlite3.Connection.backup()`; copiar solo el fichero de SQLite bajo WAL puede omitir transacciones recientes. Copia y restauración automatizadas, cifrado y simulacro de recuperación se implementarán antes de producción. No se ha realizado backup externo ni eliminado información del usuario.
