/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,document]` on the table `clients` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenant_id,code]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenant_id,number]` on the table `sales` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenant_id,number]` on the table `services` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenant_id,email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenant_id,plate]` on the table `vehicles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tenant_id` to the `accounts_payable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `accounts_receivable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `sales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `services` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `stock_movements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `vehicles` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "clients_document_key";

-- DropIndex
DROP INDEX "invoices_number_key";

-- DropIndex
DROP INDEX "products_code_key";

-- DropIndex
DROP INDEX "sales_number_key";

-- DropIndex
DROP INDEX "services_number_key";

-- DropIndex
DROP INDEX "users_email_key";

-- DropIndex
DROP INDEX "vehicles_plate_key";

-- AlterTable
ALTER TABLE "accounts_payable" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "accounts_receivable" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "cnpj" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip_code" TEXT,
    "logo" TEXT,
    "primary_color" TEXT NOT NULL DEFAULT '#f5c800',
    "open_hours" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'TRIAL',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "trial_ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "clients_tenant_id_document_key" ON "clients"("tenant_id", "document");

-- CreateIndex
CREATE UNIQUE INDEX "products_tenant_id_code_key" ON "products"("tenant_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "sales_tenant_id_number_key" ON "sales"("tenant_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "services_tenant_id_number_key" ON "services"("tenant_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_tenant_id_plate_key" ON "vehicles"("tenant_id", "plate");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
