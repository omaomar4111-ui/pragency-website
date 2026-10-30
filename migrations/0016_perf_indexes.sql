CREATE INDEX IF NOT EXISTS idx_portal_clients_email ON portal_clients(email);
CREATE INDEX IF NOT EXISTS idx_portal_deliverables_client ON portal_deliverables(client_id, status);
CREATE INDEX IF NOT EXISTS idx_client_invoices_client ON client_invoices(client_id, status);
CREATE INDEX IF NOT EXISTS idx_sales_leads_stage ON sales_leads(pipeline_stage);
