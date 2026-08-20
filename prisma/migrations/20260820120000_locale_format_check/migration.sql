-- Formato del código de idioma.
--
-- El caso que esto ataja es una fila escrita por script con "EN" o "en-US":
-- el `where: { locale }` de la app busca "en" exacto, así que esa fila no se
-- selecciona nunca y la traducción se da por cargada sin estarlo. Falla en
-- silencio, que es lo peor que puede hacer.
--
-- Verifica la forma y no la lista de idiomas soportados a propósito. La lista
-- vive en src/lib/i18n/config.ts; repetirla acá obliga a mantener dos fuentes
-- sincronizadas y la que se desactualiza es siempre la de SQL. Además una fila
-- con un idioma bien formado pero no soportado es inofensiva —no la selecciona
-- nadie—, mientras que una mal formada engaña a quien la cargó.
ALTER TABLE "ProductTranslation"
  ADD CONSTRAINT "ProductTranslation_locale_format_check"
  CHECK ("locale" ~ '^[a-z]{2}$');

ALTER TABLE "ProductCategoryTranslation"
  ADD CONSTRAINT "ProductCategoryTranslation_locale_format_check"
  CHECK ("locale" ~ '^[a-z]{2}$');

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_locale_format_check"
  CHECK ("locale" ~ '^[a-z]{2}$');

ALTER TABLE "User"
  ADD CONSTRAINT "User_locale_format_check"
  CHECK ("locale" ~ '^[a-z]{2}$');
