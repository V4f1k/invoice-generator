import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://localhost:5432/invoice_generator_test',
    },
  },
});

describe('Database Migrations - Invoice Tables', () => {
  beforeAll(async () => {
    // Ensure we're using test database
    if (!process.env.DATABASE_URL?.includes('test')) {
      throw new Error('This test must run against a test database');
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Invoice model', () => {
    it('should have all required fields', async () => {
      // This will fail if the table structure is wrong
      try {
        const result = await prisma.$queryRaw`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'invoices'
          ORDER BY column_name;
        `;

        expect(result).toBeDefined();
        
        // Check that key columns exist
        const columns = result as any[];
        const columnNames = columns.map((col: any) => col.column_name);
        
        expect(columnNames).toContain('id');
        expect(columnNames).toContain('supplier_id');
        expect(columnNames).toContain('client_name');
        expect(columnNames).toContain('client_street');
        expect(columnNames).toContain('client_city');
        expect(columnNames).toContain('client_zip_code');
        expect(columnNames).toContain('client_country');
        expect(columnNames).toContain('issue_date');
        expect(columnNames).toContain('due_date');
        expect(columnNames).toContain('subtotal');
        expect(columnNames).toContain('vat_amount');
        expect(columnNames).toContain('total');
        expect(columnNames).toContain('created_at');
        expect(columnNames).toContain('updated_at');
      } catch (error) {
        throw new Error(`Invoice table migration failed: ${error}`);
      }
    });

    it('should have correct data types for monetary fields', async () => {
      const result = await prisma.$queryRaw`
        SELECT column_name, data_type, numeric_precision, numeric_scale
        FROM information_schema.columns 
        WHERE table_name = 'invoices' 
        AND column_name IN ('subtotal', 'total');
      `;

      const columns = result as any[];
      
      columns.forEach((col: any) => {
        expect(col.data_type).toBe('numeric');
        expect(col.numeric_precision).toBe(10);
        expect(col.numeric_scale).toBe(2);
      });
    });
  });

  describe('InvoiceItem model', () => {
    it('should have all required fields', async () => {
      try {
        const result = await prisma.$queryRaw`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'invoice_items'
          ORDER BY column_name;
        `;

        expect(result).toBeDefined();
        
        const columns = result as any[];
        const columnNames = columns.map((col: any) => col.column_name);
        
        expect(columnNames).toContain('id');
        expect(columnNames).toContain('invoice_id');
        expect(columnNames).toContain('description');
        expect(columnNames).toContain('quantity');
        expect(columnNames).toContain('unit_price');
        expect(columnNames).toContain('line_total');
        expect(columnNames).toContain('created_at');
        expect(columnNames).toContain('updated_at');
      } catch (error) {
        throw new Error(`InvoiceItem table migration failed: ${error}`);
      }
    });

    it('should have correct data types for decimal fields', async () => {
      const result = await prisma.$queryRaw`
        SELECT column_name, data_type, numeric_precision, numeric_scale
        FROM information_schema.columns 
        WHERE table_name = 'invoice_items' 
        AND column_name IN ('quantity', 'unit_price', 'line_total');
      `;

      const columns = result as any[];
      
      columns.forEach((col: any) => {
        expect(col.data_type).toBe('numeric');
        expect(col.numeric_precision).toBe(10);
        expect(col.numeric_scale).toBe(2);
      });
    });

    it('should have foreign key constraint to invoices table', async () => {
      const result = await prisma.$queryRaw`
        SELECT 
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS referenced_table,
          ccu.column_name AS referenced_column
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'invoice_items'
        AND tc.constraint_type = 'FOREIGN KEY';
      `;

      const constraints = result as any[];
      const invoiceConstraint = constraints.find((c: any) => 
        c.column_name === 'invoice_id' && c.referenced_table === 'invoices'
      );

      expect(invoiceConstraint).toBeDefined();
      expect(invoiceConstraint.referenced_column).toBe('id');
    });
  });

  describe('Supplier model relationship', () => {
    it('should have foreign key constraint from invoices to suppliers', async () => {
      const result = await prisma.$queryRaw`
        SELECT 
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS referenced_table,
          ccu.column_name AS referenced_column
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'invoices'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'supplier_id';
      `;

      const constraints = result as any[];
      const supplierConstraint = constraints.find((c: any) => 
        c.referenced_table === 'suppliers'
      );

      expect(supplierConstraint).toBeDefined();
      expect(supplierConstraint.referenced_column).toBe('id');
    });
  });
});