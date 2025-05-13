import React, { useEffect, useState } from 'react';
import { Text, View, FlatList, StyleSheet, ActivityIndicator, Image, Button, Linking, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProductContext } from '../src/product_info/ProductContext';

interface ProductInfo {
  id: string;
  title: string;
  brand: string;
  price: number;
  price_initial?: number; // Optional field for original price
  stock: string;
  images: string[];
  url?: string; // Optional field for product URL
}

const ProductList = () => {
  const { products, setProducts, removeProduct } = useProductContext();
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const storedProducts = await AsyncStorage.getItem('products');
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      }
    } catch (error) {
      console.error('Error fetching products from local storage:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Helper function to calculate discount percentage
  const calculateDiscount = (currentPrice: number, originalPrice?: number) => {
    if (!originalPrice || originalPrice <= currentPrice) return null;
    const discountPercent = Math.floor(((originalPrice - currentPrice) / originalPrice) * 100);
    return discountPercent;
  };

  // Function to open product URL in Amazon app or browser
  const openProductUrl = async (url?: string) => {
    if (!url) {
      Alert.alert('Error', 'No product URL available');
      return;
    }

    // Try to open the Amazon app first
    const amazonAppUrl = url.replace('https://www.amazon.com', 'amazon://'); 
    
    try {
      const canOpenAmazonApp = await Linking.canOpenURL(amazonAppUrl);
      
      if (canOpenAmazonApp) {
        await Linking.openURL(amazonAppUrl);
      } else {
        // If Amazon app is not installed, open in browser
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert('Error', 'Could not open the product page');
    }
  };

  const renderItem = ({ item }: { item: ProductInfo }) => {
    const discountPercent = calculateDiscount(item.price, item.price_initial);
    
    return (
      <View style={styles.productContainer}>
        {/* Image at the top */}
        {item.images && item.images.length > 0 && (
          <Image
            source={{ uri: item.images[0] }}
            style={styles.productImage}
            resizeMode="contain" // Ensure the whole image is visible
          />
        )}
        
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.brandText}>Brand: {item.brand}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>Current Price: ${item.price.toFixed(2)}</Text>
          
          {/* Always show price_initial */}
          <Text style={item.price_initial && item.price_initial > item.price ? styles.originalPrice : styles.regularPrice}>
            Original: ${item.price_initial ? item.price_initial.toFixed(2) : item.price.toFixed(2)}
          </Text>
          
          {/* Show discount badge only when there is an actual discount */}
          {item.price_initial && item.price_initial > item.price && (
            <Text style={styles.discountBadge}>{discountPercent}<Text>%</Text> OFF</Text>
          )}
        </View>
        
        <Text style={styles.stockText}>Stock: {item.stock}</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.viewButton} 
            onPress={() => openProductUrl(item.url)}
          >
            <Text style={styles.viewButtonText}>View on Amazon</Text>
          </TouchableOpacity>
          <View style={styles.buttonSpacer} />
          <TouchableOpacity 
            style={styles.removeButton} 
            onPress={() => removeProduct(item.id)}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={products}
          renderItem={renderItem}
          keyExtractor={(item) => item.id ? item.id : Math.random().toString()} // Fallback to a random ID if it's missing
          contentContainerStyle={styles.listContainer}
          numColumns={2} // Display two items per row
          columnWrapperStyle={styles.columnWrapper} // Style for the row wrapper
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10, // Reduced padding to maximize space
  },
  listContainer: {
    paddingHorizontal: 5, // Add horizontal padding to the list
  },
  columnWrapper: {
    justifyContent: 'space-between', // Space evenly between items
  },
  productContainer: {
    marginBottom: 10,
    marginHorizontal: 5,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    alignItems: 'center',
    width: '48%', // Slightly less than 50% to account for margins
    overflow: 'hidden', // Prevent content from spilling outside the container
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    height: 40, // Fixed height for title
    overflow: 'hidden', // Hide overflow text
  },
  priceContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  discountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  originalPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
    color: '#7f8c8d',
    marginRight: 10,
  },
  regularPrice: {
    fontSize: 14,
    color: '#333',
    marginTop: 5,
  },
  discountBadge: {
    backgroundColor: '#e74c3c',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  productImage: {
    width: 100, // Even smaller image size
    height: 100,
    marginVertical: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 5,
    width: '100%',
  },
  buttonSpacer: {
    width: 10, // Space between buttons
  },
  viewButton: {
    backgroundColor: '#FFD814', // Same yellow color as in index.tsx
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  viewButtonText: {
    color: '#111',
    fontWeight: '600',
    fontSize: 12,
  },
  removeButton: {
    backgroundColor: '#FF0000', // Red color for remove button
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  removeButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  brandText: {
    fontSize: 12,
    marginBottom: 3,
  },
  stockText: {
    fontSize: 12,
    marginBottom: 3,
  },
});

export default ProductList;
