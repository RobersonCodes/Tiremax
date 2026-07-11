-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "error_message" TEXT,
ADD COLUMN     "focus_ref" TEXT,
ADD COLUMN     "pdf_url" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'NFSE',
ADD COLUMN     "xml_url" TEXT;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "aliquota_iss" DOUBLE PRECISION,
ADD COLUMN     "cnae_code" TEXT,
ADD COLUMN     "fiscal_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fiscal_environment" TEXT NOT NULL DEFAULT 'homologacao',
ADD COLUMN     "focus_nfe_empresa_id" TEXT,
ADD COLUMN     "inscricao_municipal" TEXT,
ADD COLUMN     "item_lista_servico" TEXT,
ADD COLUMN     "regime_tributario" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "reset_token" TEXT,
ADD COLUMN     "reset_token_expiry" TIMESTAMP(3);
