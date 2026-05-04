export interface Product {
    id: string;
    name: string;
    weight?: string;
    availability: string;
    description: string;
    quantity: number;
    price: number;
    imageUrl: string;
    brand: string;
    model?: string;
}
