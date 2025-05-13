import 'react-native-gesture-handler'; // Initialize gesture handler
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ProductProvider } from './product_info/ProductContext'; // Correct the import path
import AppNavigator from './navigation/AppNavigator'; // Import your custom AppNavigator

const App = () => {
  return (
    <NavigationContainer>
      <ProductProvider> {/* Wrap your app with the ProductProvider */}
        <AppNavigator /> {/* Use your AppNavigator that includes the drawer */}
      </ProductProvider>
    </NavigationContainer>
  );
};

export default App;
