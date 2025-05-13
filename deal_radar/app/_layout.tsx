import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { ProductProvider } from './../src/product_info/ProductContext'; // Make sure the path is correct

export default function Layout() {
  return (
    <ProductProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Drawer>
          <Drawer.Screen
            name="index"
            options={{
              drawerLabel: 'Home',
              title: 'Home',
            }}
          />
          <Drawer.Screen
            name="ProductList"
            options={{
              drawerLabel: 'Product List',
              title: 'Product List',
            }}
          />
        </Drawer>
      </GestureHandlerRootView>
    </ProductProvider>
  );
}