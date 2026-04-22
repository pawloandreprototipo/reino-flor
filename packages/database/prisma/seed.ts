import { PrismaClient, Role, Plan, ProductStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

async function main() {
  console.log('🌱 Iniciando seed...')

  // Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'reino-flor' },
    update: {},
    create: {
      name: 'Reino Flor',
      slug: 'reino-flor',
      plan: Plan.PRO,
      settings: {
        create: {
          primaryColor: '#7c3aed',
          secondaryColor: '#f43f5e',
          currency: 'BRL',
          locale: 'pt-BR',
        },
      },
    },
  })
  console.log('✅ Tenant criado:', tenant.slug)

  // Admin user
  const admin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@reinoflor.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@reinoflor.com',
    passwordHash: await hashPassword('admin123'),
      name: 'Admin Reino Flor',
      role: Role.ADMIN,
      emailVerified: true,
    },
  })
  console.log('✅ Admin criado:', admin.email)

  // Customer user
  const customer = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'cliente@teste.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'cliente@teste.com',
    passwordHash: await hashPassword('cliente123'),
      name: 'Cliente Teste',
      role: Role.CUSTOMER,
      emailVerified: true,
      addresses: {
        create: {
          label: 'Casa',
          street: 'Rua das Flores',
          number: '123',
          district: 'Jardim Primavera',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100',
          isDefault: true,
        },
      },
    },
  })
  console.log('✅ Cliente criado:', customer.email)

  // Store
  const store = await prisma.store.upsert({
    where: { slug: 'reino-flor-store' },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Reino Flor',
      slug: 'reino-flor-store',
      description: 'A loja mais florida do Brasil 🌸',
    },
  })
  console.log('✅ Loja criada:', store.slug)

  // Warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { id: 'warehouse-main' },
    update: {},
    create: {
      id: 'warehouse-main',
      name: 'Depósito Principal',
      address: 'Av. Industrial, 500',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '04000-000',
    },
  })

  // Categories
  const catFlores = await prisma.category.upsert({
    where: { storeId_slug: { storeId: store.id, slug: 'flores' } },
    update: {},
    create: {
      storeId: store.id,
      name: 'Flores',
      slug: 'flores',
      description: 'Flores naturais e artificiais',
    },
  })

  const catVasos = await prisma.category.upsert({
    where: { storeId_slug: { storeId: store.id, slug: 'vasos' } },
    update: {},
    create: {
      storeId: store.id,
      name: 'Vasos',
      slug: 'vasos',
      description: 'Vasos decorativos',
    },
  })
  console.log('✅ Categorias criadas')

  // Products
  const products = [
    {
      name: 'Buquê de Rosas Vermelhas',
      slug: 'buque-rosas-vermelhas',
      description: 'Lindo buquê com 12 rosas vermelhas frescas, ideal para presentear.',
      price: 89.9,
      comparePrice: 120.0,
      categoryId: catFlores.id,
      sku: 'BRV-001',
    },
    {
      name: 'Orquídea Phalaenopsis',
      slug: 'orquidea-phalaenopsis',
      description: 'Orquídea branca em vaso de cerâmica. Elegante e sofisticada.',
      price: 149.9,
      comparePrice: 180.0,
      categoryId: catFlores.id,
      sku: 'OPH-001',
    },
    {
      name: 'Vaso Cerâmica Artesanal',
      slug: 'vaso-ceramica-artesanal',
      description: 'Vaso de cerâmica feito à mão, perfeito para decoração.',
      price: 59.9,
      categoryId: catVasos.id,
      sku: 'VCA-001',
    },
  ]

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { storeId_slug: { storeId: store.id, slug: p.slug } },
      update: {},
      create: {
        storeId: store.id,
        categoryId: p.categoryId,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        comparePrice: p.comparePrice ?? null,
        sku: p.sku,
        status: ProductStatus.ACTIVE,
        featured: true,
        inventory: {
          create: {
            quantity: 50,
            lowStockAlert: 5,
            warehouseId: warehouse.id,
          },
        },
      },
    })
    console.log('✅ Produto criado:', product.name)
  }

  // Coupon
  await prisma.coupon.upsert({
    where: { storeId_code: { storeId: store.id, code: 'BEMVINDO10' } },
    update: {},
    create: {
      storeId: store.id,
      code: 'BEMVINDO10',
      type: 'PERCENTAGE',
      value: 10,
      minOrderValue: 50,
      maxUses: 100,
      active: true,
    },
  })
  console.log('✅ Cupom criado: BEMVINDO10')

  // Home page (builder)
  await prisma.storePage.upsert({
    where: { storeId_slug: { storeId: store.id, slug: 'home' } },
    update: {},
    create: {
      storeId: store.id,
      slug: 'home',
      title: 'Página Inicial',
      isHome: true,
      published: true,
      sections: [
        {
          id: 'hero-1',
          type: 'hero',
          order: 0,
          props: {
            title: 'Flores que encantam 🌸',
            subtitle: 'Entrega em todo o Brasil',
            buttonText: 'Ver produtos',
            buttonUrl: '/produtos',
            backgroundImage: '',
          },
        },
        {
          id: 'products-1',
          type: 'product_grid',
          order: 1,
          props: {
            title: 'Destaques',
            columns: 3,
            limit: 6,
          },
        },
        {
          id: 'newsletter-1',
          type: 'newsletter',
          order: 2,
          props: {
            title: 'Receba novidades',
            subtitle: 'Cadastre seu e-mail e ganhe 10% de desconto',
          },
        },
      ],
    },
  })
  console.log('✅ Página home criada')

  console.log('\n🎉 Seed concluído com sucesso!')
  console.log('\n📋 Credenciais de acesso:')
  console.log('   Admin: admin@reinoflor.com / admin123')
  console.log('   Cliente: cliente@teste.com / cliente123')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
