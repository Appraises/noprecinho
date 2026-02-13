-- AlterTable
ALTER TABLE "Price" ADD COLUMN     "productId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5;

-- CreateIndex
CREATE INDEX "Price_productId_idx" ON "Price"("productId");

-- AddForeignKey
ALTER TABLE "Price" ADD CONSTRAINT "Price_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
