import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity, OrderStatus } from './order.entity';
import { ProductsService } from '../products/products.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private repo: Repository<OrderEntity>,
    private productsService: ProductsService,
  ) {}

  async create(userId: string, body: { items: any[]; paymentDetails: any }): Promise<OrderEntity> {
    // Validate stock and calculate total
    let total = 0;
    const validatedItems = [];

    for (const item of body.items) {
      const product = await this.productsService.findOne(item.productId);
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Stock insuficiente para ${product.name}`);
      }
      total += Number(product.price) * item.quantity;
      validatedItems.push({
        productId: product.id,
        productName: product.name,
        price: Number(product.price),
        quantity: item.quantity,
        imageUrl: product.imageUrl,
      });
    }

    // Decrease stock
    for (const item of validatedItems) {
      await this.productsService.decreaseStock(item.productId, item.quantity);
    }

    // Generate payment reference
    const ref = `PAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const order = this.repo.create({
      userId,
      items: validatedItems,
      total,
      status: OrderStatus.PAID,
      paymentReference: ref,
      paymentDetails: body.paymentDetails,
    });

    return this.repo.save(order);
  }

  findByUser(userId: string): Promise<OrderEntity[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  findAll(): Promise<OrderEntity[]> {
    return this.repo.find({ order: { createdAt: 'DESC' }, relations: ['user'] });
  }

  async findOne(id: string): Promise<OrderEntity> {
    const order = await this.repo.findOne({ where: { id }, relations: ['user'] });
    if (!order) throw new NotFoundException('Orden no encontrada');
    return order;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<OrderEntity> {
    const order = await this.findOne(id);
    order.status = status;
    return this.repo.save(order);
  }

  count(): Promise<number> {
    return this.repo.count();
  }

  async totalRevenue(): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('o')
      .select('SUM(o.total)', 'sum')
      .where('o.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .getRawOne();
    return Number(result?.sum) || 0;
  }

  findRecent(limit = 5): Promise<OrderEntity[]> {
    return this.repo.find({
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['user'],
    });
  }
}
