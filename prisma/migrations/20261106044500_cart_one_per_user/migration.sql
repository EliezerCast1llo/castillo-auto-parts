-- Un carrito por cuenta.
--
-- Sin esta restricción, dos pestañas agregando a la vez crean dos carritos y el
-- cliente ve uno u otro según cuál devuelva primero la consulta.
CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart"("userId");
