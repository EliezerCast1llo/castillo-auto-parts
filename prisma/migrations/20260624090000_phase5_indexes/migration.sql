-- Phase 5: query and foreign-key indexes for catalog/search/cart/order paths.

CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_brand_idx" ON "Product"("brand");
CREATE INDEX "Product_isActive_isFeatured_idx" ON "Product"("isActive", "isFeatured");
CREATE INDEX "Product_isActive_brand_idx" ON "Product"("isActive", "brand");

CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");
CREATE INDEX "VehicleCompatibility_productId_idx" ON "VehicleCompatibility"("productId");

CREATE INDEX "CartItem_productId_idx" ON "CartItem"("productId");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");
