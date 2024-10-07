export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  average_rating?: number;
}

export interface Review {
  id: number;
  product_id: number;
  first_name: string;
  last_name: string;
  review_text?: string;
  rating: number;
}

export interface ReviewRequest {
  first_name: string;
  last_name: string;
  review_text?: string;
  rating: number;
}

export interface ProductUpdateRequest {
  name: string;
  description: string;
  price: number;
}
