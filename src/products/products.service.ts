import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { ProductEntity } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private repo: Repository<ProductEntity>,
  ) {}

  async findAll(search?: string, category?: string): Promise<ProductEntity[]> {
    const where: any[] = [];

    if (search && category) {
      where.push({ name: ILike(`%${search}%`), category, isActive: true });
      where.push({ description: ILike(`%${search}%`), category, isActive: true });
    } else if (search) {
      where.push({ name: ILike(`%${search}%`) });
      where.push({ description: ILike(`%${search}%`) });
    } else if (category) {
      where.push({ category });
    }

    return this.repo.find({
      where: where.length ? where : undefined,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ProductEntity> {
    const product = await this.repo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async create(data: Partial<ProductEntity>): Promise<ProductEntity> {
    const product = this.repo.create(data);
    return this.repo.save(product);
  }

  async update(id: string, data: Partial<ProductEntity>): Promise<ProductEntity> {
    const product = await this.findOne(id);
    Object.assign(product, data);
    return this.repo.save(product);
  }

  async decreaseStock(id: string, qty: number): Promise<void> {
    await this.repo.decrement({ id }, 'stock', qty);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  count(): Promise<number> {
    return this.repo.count({ where: { isActive: true } });
  }

  findLowStock(threshold = 10): Promise<ProductEntity[]> {
    return this.repo
      .createQueryBuilder('p')
      .where('p.stock <= :threshold', { threshold })
      .andWhere('p.isActive = true')
      .orderBy('p.stock', 'ASC')
      .limit(10)
      .getMany();
  }
}
