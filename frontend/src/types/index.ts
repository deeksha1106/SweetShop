export interface User {
  id: number;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Sweet {
  id: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
  description: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: number;
  user_id: number;
  sweet_id: number;
  sweet_name: string;
  quantity: number;
  total_price: number;
  unit_price: number;
  created_at: string;
}

export interface InventoryLog {
  id: number;
  sweet_id: number;
  sweet_name: string;
  user_id: number;
  user_email: string;
  action: 'purchase' | 'restock';
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  created_at: string;
}

export interface InventoryStats {
  totalSweets: number;
  totalValue: number;
  outOfStock: number;
  lowStock: number;
  inStock: number;
  categories: {
    [key: string]: {
      count: number;
      totalQuantity: number;
      totalValue: number;
    };
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
}
