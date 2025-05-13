import React, { createContext, useState, ReactNode, useContext } from 'react';
import uuid from 'react-native-uuid'; // Import uuid

interface ProductInfo {
  id: string;
  title: string;
  brand: string;
  price: number;
  stock: string;
  images: string[];
}

interface ProductContextProps {
  products: ProductInfo[];
  setProducts: React.Dispatch<React.SetStateAction<ProductInfo[]>>;
  addProduct: (product: ProductInfo) => void;
  removeProduct: (id: string) => void;
  productExists: (productId: string) => boolean;
}

const ProductContext = createContext<ProductContextProps | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<ProductInfo[]>([]);

  // Check if a product with the given ID already exists in the products list
  const productExists = (productId: string): boolean => {
    return products.some(product => product.id === productId);
  };

  const addProduct = (product: ProductInfo) => {
    // If product already has an ID, check if it exists first
    if (product.id && productExists(product.id)) {
      console.log(`Product with ID ${product.id} already exists in the list`);
      return; // Don't add duplicate product
    }
    
    // If product doesn't have an ID, assign one
    const productWithId = product.id ? product : { ...product, id: uuid.v4() };
    setProducts((prevProducts) => [...prevProducts, productWithId]);
  };

  const removeProduct = (id: string) => {
    setProducts((prevProducts) => prevProducts.filter(product => product.id !== id));
  };

  return (
    <ProductContext.Provider value={{ products, setProducts, addProduct, removeProduct, productExists }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProductContext = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProductContext must be used within a ProductProvider');
  }
  return context;
};
