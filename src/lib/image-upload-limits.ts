/**
 * Límites de subida de imágenes compartidos por cliente y servidor.
 *
 * Viven acá y no en `r2.ts` porque el selector del formulario corre en el
 * navegador y `r2.ts` arrastra el SDK de almacenamiento. Importarlo desde un
 * componente cliente metería ese SDK en el bundle para leer un número.
 */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
