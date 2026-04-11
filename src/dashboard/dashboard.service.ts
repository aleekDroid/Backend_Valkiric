import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class DashboardService {
  constructor(
    private usersService: UsersService,
    private productsService: ProductsService,
    private ordersService: OrdersService,
  ) {}

  async getStats() {
    const [totalUsers, totalProducts, totalOrders, totalRevenue, recentOrders, lowStockProducts] =
      await Promise.all([
        this.usersService.count(),
        this.productsService.count(),
        this.ordersService.count(),
        this.ordersService.totalRevenue(),
        this.ordersService.findRecent(5),
        this.productsService.findLowStock(10),
      ]);

    return {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      recentOrders,
      lowStockProducts,
    };
  }
}
