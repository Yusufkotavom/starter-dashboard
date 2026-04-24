import {
  PrismaClient,
  ProductType,
  ClientStatus,
  QuotationStatus,
  ProjectStatus,
  InvoiceStatus
} from '@prisma/client';

const prisma = new PrismaClient();

function log(message) {
  process.stdout.write(`${message}\n`);
}

// ── Categories (service/product categories) ───────────────────────

const categories = [
  {
    name: 'Web Development',
    slug: 'web-development',
    description: 'Website, web app, and e-commerce development.'
  },
  {
    name: 'Design',
    slug: 'design',
    description: 'UI/UX, branding, graphic design, and visual identity.'
  },
  {
    name: 'Digital Marketing',
    slug: 'digital-marketing',
    description: 'SEO, social media, ads, and content strategy.'
  },
  {
    name: 'Consulting',
    slug: 'consulting',
    description: 'Business, tech, and strategy consulting.'
  }
];

// ── Products (services offered by the agency) ────────────────────

const products = [
  {
    name: 'Company Profile Website',
    description: 'Responsive company profile website with CMS integration.',
    type: ProductType.SERVICE,
    price: '8500000',
    unit: 'project',
    photoUrl: null,
    categorySlug: 'web-development'
  },
  {
    name: 'UI/UX Design System',
    description: 'Complete design system with components, tokens, and documentation.',
    type: ProductType.SERVICE,
    price: '6000000',
    unit: 'project',
    photoUrl: null,
    categorySlug: 'design'
  },
  {
    name: 'Monthly SEO Management',
    description: 'On-page SEO, content audit, backlink strategy, and monthly report.',
    type: ProductType.SERVICE,
    price: '3500000',
    unit: 'month',
    photoUrl: null,
    categorySlug: 'digital-marketing'
  },
  {
    name: 'Tech Strategy Consulting',
    description: 'Technology stack review, roadmap planning, and architecture consulting.',
    type: ProductType.SERVICE,
    price: '1500000',
    unit: 'hour',
    photoUrl: null,
    categorySlug: 'consulting'
  }
];

// ── Clients ───────────────────────────────────────────────────────

const clients = [
  {
    name: 'Budi Santoso',
    email: 'budi@ptmajujaya.co.id',
    phone: '0812-3456-7890',
    company: 'PT Maju Jaya Indonesia',
    status: ClientStatus.ACTIVE,
    notes: 'Long-term client. Preferred communication via WhatsApp.'
  },
  {
    name: 'Siti Rahayu',
    email: 'siti@startupkita.id',
    phone: '0856-9012-3456',
    company: 'Startup Kita',
    status: ClientStatus.ACTIVE,
    notes: 'Fast approvals, needs detailed invoices.'
  },
  {
    name: 'Ahmad Fauzi',
    email: 'ahmad@tokobagus.com',
    phone: '0878-2345-6789',
    company: 'Toko Bagus',
    status: ClientStatus.LEAD,
    notes: 'Interested in e-commerce development.'
  }
];

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  log('🌱 Seeding agency dashboard data...\n');

  // Categories
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat
    });
  }
  log(`  ✅ ${categories.length} categories`);

  // Products
  for (const [i, prod] of products.entries()) {
    await prisma.product.upsert({
      where: { id: i + 1 },
      update: prod,
      create: prod
    });
  }
  log(`  ✅ ${products.length} products/services`);

  // Clients
  for (const client of clients) {
    await prisma.client.upsert({
      where: { email: client.email },
      update: client,
      create: client
    });
  }
  log(`  ✅ ${clients.length} clients`);

  // Sample Quotation → Project → Invoice
  const client = await prisma.client.findFirst({ where: { email: 'budi@ptmajujaya.co.id' } });
  const webProd = await prisma.product.findFirst({ where: { categorySlug: 'web-development' } });
  const designProd = await prisma.product.findFirst({ where: { categorySlug: 'design' } });

  if (client && webProd && designProd) {
    const existingQuot = await prisma.quotation.findUnique({ where: { number: 'QUO-2024-001' } });

    if (!existingQuot) {
      const quot = await prisma.quotation.create({
        data: {
          number: 'QUO-2024-001',
          clientId: client.id,
          status: QuotationStatus.APPROVED,
          subtotal: 14500000,
          tax: 1450000,
          discount: 0,
          total: 15950000,
          validUntil: new Date('2024-12-31'),
          notes: 'Website + design system package for PT Maju Jaya.',
          items: {
            create: [
              {
                productId: webProd.id,
                description: webProd.name,
                qty: 1,
                unitPrice: Number(webProd.price),
                amount: Number(webProd.price)
              },
              {
                productId: designProd.id,
                description: designProd.name,
                qty: 1,
                unitPrice: Number(designProd.price),
                amount: Number(designProd.price)
              }
            ]
          }
        }
      });

      const project = await prisma.project.create({
        data: {
          name: 'PT Maju Jaya — Website & Design',
          clientId: client.id,
          quotationId: quot.id,
          status: ProjectStatus.ACTIVE,
          startDate: new Date('2024-11-01'),
          endDate: new Date('2025-01-31'),
          budget: 15950000,
          notes: 'Approved quotation QUO-2024-001.'
        }
      });

      await prisma.invoice.create({
        data: {
          number: 'INV-2024-001',
          clientId: client.id,
          projectId: project.id,
          status: InvoiceStatus.SENT,
          subtotal: 7250000,
          tax: 725000,
          total: 7975000,
          dueDate: new Date('2024-12-15'),
          notes: 'Down payment 50% — Website & Design project.'
        }
      });

      log('  ✅ 1 quotation (APPROVED) + 1 project (ACTIVE) + 1 invoice (SENT)');
    } else {
      log('  ℹ️  Sample data already exists, skipped');
    }
  }

  log('\n✨ Seed complete!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
