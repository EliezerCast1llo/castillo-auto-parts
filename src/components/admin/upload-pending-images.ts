/**
 * Sube las imágenes que esperaban en el navegador, ya con el producto creado.
 *
 * Vive aparte del formulario para poder probarla: el formulario arrastra React
 * y el enrutador, y lo que hay que verificar acá es lo que viaja en cada
 * petición y qué se hace cuando una falla.
 */
export type PendingUpload = { file: File };

/**
 * Devuelve cuántas fallaron, en vez de tirar.
 *
 * El producto **ya existe** cuando esto corre. Propagar el error dejaría a
 * quien lo creó sin saber que su ficha sí quedó guardada, y lo mandaría a
 * crearla de nuevo —duplicando el SKU— en vez de a reintentar la imagen.
 */
export async function uploadPendingImages(
  productId: string,
  images: PendingUpload[],
): Promise<number> {
  let failed = 0;

  for (const [index, image] of images.entries()) {
    const body = new FormData();
    body.append("file", image.file);
    body.append("productId", productId);
    body.append("alt", image.file.name.replace(/\.[^.]+$/, ""));
    // La primera es la principal, igual que en la ficha de edición.
    if (index === 0) body.append("isPrimary", "true");

    try {
      const response = await fetch("/api/admin/upload-image", { method: "POST", body });
      if (!response.ok) failed += 1;
    } catch {
      // Una caída de red cuenta igual que un rechazo del servidor: en los dos
      // casos la imagen no quedó.
      failed += 1;
    }
  }

  return failed;
}
