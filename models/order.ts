import { Address } from '@models/address';
import { Customer } from '@models/customer';
import { Product } from '@models/product';

export interface Order {
    id: number;
    product: Product[];
    customer: Customer;
    status: string;
    address: Address;
    purchaseDate: Date;
    totalAmount: number;
    totalItems: number;
    totalQuantity: number;
    totalPrice: number;
}
