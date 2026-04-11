import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'valkiric',
  synchronize: true,
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
});

async function seed() {
  await AppDataSource.initialize();
  console.log('✅ Database connected');

  const userRepo = AppDataSource.getRepository('users');
  const productRepo = AppDataSource.getRepository('products');
  const orderRepo = AppDataSource.getRepository('orders');

  // Clear tables in dependency-safe order
  await AppDataSource.createQueryBuilder().delete().from('orders').execute();
  await AppDataSource.createQueryBuilder().delete().from('products').execute();
  await AppDataSource.createQueryBuilder().delete().from('users').execute();
  console.log('🗑️  Tables cleared');

  // ── USERS ──
  const adminPwd = await bcrypt.hash('Admin1234!', 10);
  const userPwd  = await bcrypt.hash('User1234!', 10);

  const admin = await userRepo.save({
    email: 'admin@valkiric.com', name: 'Admin Valkiric',
    password: adminPwd, role: 'ADMIN', isActive: true, phone: '+52 555 000 0001',
  });

  const users = await userRepo.save([
    { email: 'thor@email.com',   name: 'Thor Odinson',    password: userPwd, role: 'USER', isActive: true, phone: '+52 555 100 0001' },
    { email: 'freya@email.com',  name: 'Freya Vanadis',   password: userPwd, role: 'USER', isActive: true, phone: '+52 555 100 0002' },
    { email: 'loki@email.com',   name: 'Loki Laufeyson',  password: userPwd, role: 'USER', isActive: true },
    { email: 'hela@email.com',   name: 'Hela Odindottir',  password: userPwd, role: 'USER', isActive: true },
    { email: 'tyr@email.com',    name: 'Tyr Aesir',       password: userPwd, role: 'USER', isActive: false },
  ]);
  console.log('👥 Users created:', 1 + users.length);

  // ── PRODUCTS ──
  const products = await productRepo.save([
    // Supplements (6)
    {
      name: 'Whey Protein Valhalla', category: 'supplements', price: 899.00, stock: 45,
      description: 'Proteína de suero de alta calidad, 25g de proteína por servicio. Sabor vainilla y chocolate.',
      imageUrl: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600&q=80',
      isActive: true, details: { sabores: 'Vainilla, Chocolate, Fresa', peso: '2 lbs', proteina_por_servicio: '25g', servicios: 30 },
    },
    {
      name: 'Creatina Monohidrato Ragnarok', category: 'supplements', price: 449.00, stock: 60,
      description: 'Creatina monohidrato pura micronizada. Aumenta fuerza y masa muscular de forma probada.',
      imageUrl: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=600&q=80',
      isActive: true, details: { tipo: 'Monohidrato micronizado', peso: '300g', servicios: 60, dosis: '5g por servicio' },
    },
    {
      name: 'Pre-Entreno Berserker', category: 'supplements', price: 649.00, stock: 30,
      description: 'Pre-entreno explosivo con cafeína, beta-alanina y citrulina para rendimiento máximo.',
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
      isActive: true, details: { cafeina: '300mg', beta_alanina: '3.2g', citrulina: '6g', sabores: 'Sandía, Frutos Rojos' },
    },
    {
      name: 'BCAA Runas', category: 'supplements', price: 399.00, stock: 50,
      description: 'Aminoácidos de cadena ramificada 2:1:1. Recuperación rápida y prevención de catabolismo.',
      imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80',
      isActive: true, details: { ratio: '2:1:1', leucina: '5g', isoleucina: '2.5g', valina: '2.5g' },
    },
    {
      name: 'Vitaminas Aegir Complex', category: 'supplements', price: 299.00, stock: 80,
      description: 'Multivitamínico completo para atletas. 30 vitaminas y minerales esenciales.',
      imageUrl: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80',
      isActive: true, details: { pastillas: 90, dosis: '3 tabletas con alimentos', vitaminas: 30 },
    },
    {
      name: 'Proteína Vegana Mjolnir', category: 'supplements', price: 799.00, stock: 3,
      description: 'Proteína de guisante y arroz integral. 22g de proteína completa por servicio.',
      imageUrl: 'https://images.unsplash.com/photo-1559181567-c3190ca9be46?w=600&q=80',
      isActive: true, details: { base: 'Guisante + Arroz', proteina: '22g', calorias: 130, apto_vegano: true },
    },

    // Clothing (4)
    {
      name: 'Playera Dry-Fit Valkiric', category: 'clothing', price: 349.00, stock: 25,
      description: 'Playera de alto rendimiento con tecnología dry-fit. Logo Valkiric en pecho.',
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
      isActive: true, details: { tallas: 'XS, S, M, L, XL, XXL', colores: 'Negro, Blanco, Rojo', material: '92% poliéster, 8% elastano' },
    },
    {
      name: 'Shorts Entrenamiento Fenrir', category: 'clothing', price: 429.00, stock: 18,
      description: 'Shorts con bolsillos laterales, cordón ajustable y tela transpirable de 4 vías.',
      imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=600&q=80',
      isActive: true, details: { tallas: 'S, M, L, XL', colores: 'Negro, Gris', longitud: 'Sobre la rodilla' },
    },
    {
      name: 'Leggings Skadi Pro', category: 'clothing', price: 549.00, stock: 12,
      description: 'Leggings de compresión alta, cintura alta, bolsillo lateral. Ideal para sentadilla.',
      imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80',
      isActive: true, details: { tallas: 'XS, S, M, L, XL', colores: 'Negro, Burdeos', compresion: 'Alta' },
    },
    {
      name: 'Hoodie Odin Oversized', category: 'clothing', price: 749.00, stock: 8,
      description: 'Sudadera oversized de felpa premium. Diseño minimalista con runa Valkiric bordada.',
      imageUrl: 'https://images.unsplash.com/photo-1542327897-d73f4005b533?w=600&q=80',
      isActive: true, details: { tallas: 'S/M, L/XL, XXL', colores: 'Negro, Gris Carbón', material: '80% algodón, 20% poliéster' },
    },

    // Accessories (4)
    {
      name: 'Cinturón Powerlifting Yggdrasil', category: 'accessories', price: 1299.00, stock: 10,
      description: 'Cinturón de cuero genuino 10mm para powerlifting. Máximo soporte lumbar.',
      imageUrl: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=600&q=80',
      isActive: true, details: { material: 'Cuero genuino', grosor: '10mm', ancho: '4 pulgadas', tallas: 'S, M, L, XL' },
    },
    {
      name: 'Guantes Entrenamiento Tyr', category: 'accessories', price: 299.00, stock: 20,
      description: 'Guantes con almohadilla de gel y muñequeras integradas. Grip máximo.',
      imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80',
      isActive: true, details: { material: 'Cuero sintético + neopreno', tallas: 'S, M, L, XL', munequera: 'Integrada 18cm' },
    },
    {
      name: 'Bandas de Resistencia Bifrost', category: 'accessories', price: 449.00, stock: 35,
      description: 'Set de 5 bandas de resistencia progresiva (10-150 lbs). Para mobility y fuerza.',
      imageUrl: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600&q=80',
      isActive: true, details: { piezas: 5, resistencia: '10, 25, 50, 80, 150 lbs', material: 'Látex natural', incluye: 'Bolsa de malla' },
    },
    {
      name: 'Shaker Valkiric Pro', category: 'accessories', price: 199.00, stock: 55,
      description: 'Vaso mezclador 700ml con esfera batidora de acero y compartimento para suplementos.',
      imageUrl: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=600&q=80',
      isActive: true, details: { capacidad: '700ml', material: 'Tritan BPA-free', esfera: 'Acero inoxidable 316', colores: 'Negro, Rojo' },
    },

    // Merch (4)
    {
      name: 'Gorra Valkiric Snapback', category: 'merch', price: 279.00, stock: 22,
      description: 'Gorra snapback con logo bordado en 3D. Ajuste universal con hebilla trasera.',
      imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80',
      isActive: true, details: { colores: 'Negro/Rojo, Negro/Blanco', ajuste: 'Snapback universal', logo: 'Bordado 3D' },
    },
    {
      name: 'Mochila Gym Valkiric 40L', category: 'merch', price: 899.00, stock: 14,
      description: 'Mochila duffel con compartimento para zapatos, bolsillo húmedo y porta botella.',
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
      isActive: true, details: { capacidad: '40L', material: 'Oxford 900D', compartimentos: 5, colores: 'Negro, Gris' },
    },
    {
      name: 'Taza Térmica Valhalla 500ml', category: 'merch', price: 349.00, stock: 30,
      description: 'Termo de acero inoxidable doble pared. Mantiene temperatura 12h frío / 6h caliente.',
      imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80',
      isActive: true, details: { capacidad: '500ml', material: 'Acero inox 18/8', temperatura: '12h frío / 6h caliente', tapa: 'Anti-derrame' },
    },
    {
      name: 'Calcomanías Pack Runas', category: 'merch', price: 99.00, stock: 100,
      description: 'Pack de 8 calcomanías vinilo premium con diseños de runas nórdicas y logo Valkiric.',
      imageUrl: 'https://images.unsplash.com/photo-1606663889134-b1dedb5ed8b7?w=600&q=80',
      isActive: true, details: { cantidad: 8, material: 'Vinilo premium', resistente_agua: true, tamaño: '5–10cm' },
    },
  ]);
  console.log('📦 Products created:', products.length);

  // ── ORDERS ──
  const [p1, p2, p3, p4, p7, p11] = products;
  const [u1, u2, u3] = users;

  await orderRepo.save([
    {
      userId: u1.id,
      items: [
        { productId: p1.id, productName: p1.name, price: Number(p1.price), quantity: 2, imageUrl: p1.imageUrl },
        { productId: p2.id, productName: p2.name, price: Number(p2.price), quantity: 1, imageUrl: p2.imageUrl },
      ],
      total: Number(p1.price) * 2 + Number(p2.price),
      status: 'paid',
      paymentReference: 'PAY-DEMO-001',
      paymentDetails: { cardHolder: u1.name, email: u1.email, last4: '4242' },
    },
    {
      userId: u2.id,
      items: [
        { productId: p7.id, productName: p7.name, price: Number(p7.price), quantity: 1, imageUrl: p7.imageUrl },
        { productId: p11.id, productName: p11.name, price: Number(p11.price), quantity: 1, imageUrl: p11.imageUrl },
      ],
      total: Number(p7.price) + Number(p11.price),
      status: 'delivered',
      paymentReference: 'PAY-DEMO-002',
      paymentDetails: { cardHolder: u2.name, email: u2.email, last4: '1234' },
    },
    {
      userId: u3.id,
      items: [
        { productId: p3.id, productName: p3.name, price: Number(p3.price), quantity: 1, imageUrl: p3.imageUrl },
        { productId: p4.id, productName: p4.name, price: Number(p4.price), quantity: 2, imageUrl: p4.imageUrl },
      ],
      total: Number(p3.price) + Number(p4.price) * 2,
      status: 'processing',
      paymentReference: 'PAY-DEMO-003',
      paymentDetails: { cardHolder: u3.name, email: u3.email, last4: '5678' },
    },
  ]);
  console.log('🛒 Orders created: 3');

  await AppDataSource.destroy();
  console.log('\n✨ Seed completed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Admin:  admin@valkiric.com / Admin1234!');
  console.log('  Users:  *@email.com / User1234!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

seed().catch((e) => {
  console.error('❌ Seed error:', e);
  process.exit(1);
});
