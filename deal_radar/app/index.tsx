import React, { useState, useEffect, useRef } from 'react';
import { Text, View, Button, StyleSheet, ActivityIndicator, Image, Linking, TouchableOpacity, Alert, TextInput, FlatList, ScrollView, Modal } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProductContext } from '../src/product_info/ProductContext';
import uuid from 'react-native-uuid'; // Import uuid
import { WebView } from 'react-native-webview';

interface ProductInfo {
  id: string;
  title: string;
  brand: string;
  price: number;
  price_initial?: number; // Original non-discounted price
  currency?: string; // Added currency field
  stock: string;
  images: string[];
  url?: string;
  rating?: number;
  reviews_count?: number;
  is_prime?: boolean;
  shipping_info?: string;
  is_amazons_choice?: boolean;
  is_best_seller?: boolean;
}

interface SearchProduct {
  id: string;
  asin: string;
  title: string;
  price: number;
  price_initial?: number; // Original non-discounted price
  currency: string;
  rating: number;
  reviews_count: number;
  image_url: string;
  product_url: string;
  is_prime: boolean;
  is_sponsored: boolean;
  is_amazons_choice: boolean;
  is_best_seller: boolean;
  shipping_info: string;
  position: number;
}

// Function to open Amazon link
const openAmazonLink = async (url?: string) => {
  // Check if URL is defined
  if (!url) {
    Alert.alert('Error', 'No product URL available');
    return;
  }
  
  // Check if the URL can be opened
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      // Handle case where URL can't be opened
      Alert.alert('Cannot open URL', 'The Amazon app may not be installed.');
    }
  } catch (error) {
    console.error('Error opening URL:', error);
    Alert.alert('Error', 'Could not open the URL');
  }
};

export default function Index() {
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const { addProduct, productExists } = useProductContext();
  const [isMounted, setIsMounted] = useState(true); // To track if the component is mounted
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [trackingProduct, setTrackingProduct] = useState<string | null>(null); // Track which product is being added

  // State for browser modal
  const [browserVisible, setBrowserVisible] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('https://www.amazon.com');
  const webViewRef = useRef<WebView>(null);

  // Function to extract ASIN from Amazon URL
  const extractAsinFromUrl = (url: string): string | null => {
    // Pattern 1: /dp/XXXXXXXXXX/ format
    let match = url.match(/\/dp\/([A-Z0-9]{10})(\/|\?|$)/);
    if (match) return match[1];

    // Pattern 2: /gp/product/XXXXXXXXXX/ format
    match = url.match(/\/gp\/product\/([A-Z0-9]{10})(\/|\?|$)/);
    if (match) return match[1];

    // Pattern 3: /ASIN/XXXXXXXXXX format
    match = url.match(/\/ASIN\/([A-Z0-9]{10})(\/|\?|$)/);
    if (match) return match[1];

    // Pattern 4: ?asin=XXXXXXXXXX format
    match = url.match(/[?&]asin=([A-Z0-9]{10})(&|$)/);
    if (match) return match[1];

    return null;
  };

  // Function to open browser modal
  const openBrowser = () => {
    // Reset to Amazon main page each time
    setCurrentUrl('https://www.amazon.com');
    setBrowserVisible(true);
  };
  
  // Function to go back in browser history
  const goBack = () => {
    if (webViewRef.current) {
      webViewRef.current.goBack();
    }
  };

  // Function to close browser modal
  const closeBrowser = () => {
    setBrowserVisible(false);
  };

  // Function to use current URL for product tracking
  const useCurrentUrl = () => {
    const asin = extractAsinFromUrl(currentUrl);
    if (asin) {
      setProductId(asin);
      // Clear any displayed search results
      setSearchResults([]);
      setProductInfo(null);
      fetchProductInfo(asin);
      closeBrowser();
    } else {
      Alert.alert(
        'Product ID Not Found', 
        'Could not find a valid Amazon product ID in the current URL. Please navigate to a product page.'
      );
    }
  };

  useEffect(() => {
    setIsMounted(true); // Mark the component as mounted when it mounts

    return () => {
      setIsMounted(false); // Mark the component as unmounted when it unmounts
    };
  }, []); // This useEffect runs only once when the component mounts

  // State for product ID input
  const [productId, setProductId] = useState<string>('');

  const fetchProductInfo = async (specificProductId?: string) => {
    setLoading(true);
    try {
      // Use either the provided product ID, the state productId, or a default
      const idToFetch = specificProductId || productId || 'B0BZYCJK89';
      
      console.log(`Fetching product info for ID: ${idToFetch}`);
      const response = await axios.get(`http://10.242.211.195:5000/fetch_product_info?product_id=${idToFetch}`); 
      console.log('Response data:', response.data);

      // Generate a unique id for the product
      const product = { 
        ...response.data, 
        id: uuid.v4(), // Generate unique id for each product
      };

      if (isMounted) {
        setProductInfo(product);
        // Store the fetched product information in AsyncStorage
        await AsyncStorage.setItem('products', JSON.stringify([product]));
        addProduct(product);
        
        // Show success message
        Alert.alert('Success', `Fetched product info for ${product.title.substring(0, 30)}...`);
      }
    } catch (error: any) {
      console.error('Error fetching product info:', error);
      
      // Show error message with details if available
      let errorMessage = 'Failed to fetch product info. Please try again.';
      if (error.response) {
        errorMessage = error.response.data?.error || errorMessage;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  // Function to track a product from search results
  const trackProduct = async (product: SearchProduct) => {
    try {
      setTrackingProduct(product.id);
      
      // Check if the product already exists in the tracked products list
      if (productExists(product.id)) {
        Alert.alert('Already Tracked', `"${product.title.substring(0, 30)}..." is already in your tracked products`);
        return;
      }
      
      // Convert the search product to the format expected by ProductInfo
      const productToAdd: ProductInfo = {
        id: product.id,
        title: product.title,
        brand: 'From Amazon Search', // Default value since search results don't have brand
        price: product.price,
        // If there's a discount, store the original price
        price_initial: product.price_initial || undefined,
        stock: product.is_prime ? 'In Stock' : 'Check Amazon',
        images: [product.image_url],
        url: product.product_url,
        rating: product.rating,
        reviews_count: product.reviews_count,
        is_prime: product.is_prime,
        shipping_info: product.shipping_info,
        is_amazons_choice: product.is_amazons_choice,
        is_best_seller: product.is_best_seller
      };
      
      // Add the product to the context
      addProduct(productToAdd);
      
      // Also save to AsyncStorage
      try {
        // Get existing products
        const storedProductsJson = await AsyncStorage.getItem('products');
        const storedProducts = storedProductsJson ? JSON.parse(storedProductsJson) : [];
        
        // Check if product already exists in AsyncStorage
        const productExistsInStorage = storedProducts.some((p: ProductInfo) => p.id === product.id);
        if (productExistsInStorage) {
          console.log(`Product ${product.id} already exists in AsyncStorage`);
          return;
        }
        
        // Add new product
        const updatedProducts = [...storedProducts, productToAdd];
        
        // Save back to AsyncStorage
        await AsyncStorage.setItem('products', JSON.stringify(updatedProducts));
        
        Alert.alert('Success', `Added "${product.title.substring(0, 30)}..." to your tracked products`);
      } catch (error) {
        console.error('Error saving to AsyncStorage:', error);
        Alert.alert('Error', 'Failed to save product to storage');
      }
    } catch (error) {
      console.error('Error tracking product:', error);
      Alert.alert('Error', 'Failed to track product');
    } finally {
      setTrackingProduct(null);
    }
  };
  
  // Function to track a product from product info display
  const trackProductFromInfo = async (product: ProductInfo) => {
    try {
      // Check if the product already exists in the tracked products list
      if (productExists(product.id)) {
        Alert.alert('Already Tracked', `"${product.title.substring(0, 30)}..." is already in your tracked products`);
        return;
      }
      
      // Product is already in the right format, just add it
      addProduct(product);
      
      // Also save to AsyncStorage
      try {
        // Get existing products
        const storedProductsJson = await AsyncStorage.getItem('products');
        const storedProducts = storedProductsJson ? JSON.parse(storedProductsJson) : [];
        
        // Check if product already exists in AsyncStorage
        const productExistsInStorage = storedProducts.some((p: ProductInfo) => p.id === product.id);
        if (productExistsInStorage) {
          console.log(`Product ${product.id} already exists in AsyncStorage`);
          return;
        }
        
        // Add new product
        const updatedProducts = [...storedProducts, product];
        
        // Save back to AsyncStorage
        await AsyncStorage.setItem('products', JSON.stringify(updatedProducts));
        
        Alert.alert('Success', `Added "${product.title.substring(0, 30)}..." to your tracked products`);
      } catch (error) {
        console.error('Error saving to AsyncStorage:', error);
        Alert.alert('Error', 'Failed to save product to storage');
      }
    } catch (error) {
      console.error('Error tracking product:', error);
      Alert.alert('Error', 'Failed to track product');
    }
  };

  const searchProducts = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Search Error', 'Please enter a product to search for');
      return;
    }

    setLoading(true);
    setSearchResults([]);
    // Clear any previously displayed product info
    setProductInfo(null);
    
    try {
      console.log(`Sending search request for: ${searchQuery}`);
      const response = await axios.get(`http://10.242.211.195:5000/search_products?query=${encodeURIComponent(searchQuery)}`);
      console.log('Search response status:', response.status);
      console.log('Search results:', response.data);

      if (response.data && response.data.products) {
        console.log(`Found ${response.data.products.length} products`);
        // Add unique IDs to each product
        const productsWithIds = response.data.products.map((product: any) => {
          // Debug image URLs
          console.log(`Product ${product.asin} image_url: ${product.image_url}`);
          return {
            ...product,
            id: uuid.v4()
          };
        });

        if (isMounted) {
          setSearchResults(productsWithIds);
          setTotalResults(response.data.total_results || productsWithIds.length);
          setCurrentPage(response.data.page || 1);
        }
      } else {
        console.warn('Unexpected response format:', response.data);
        Alert.alert('Search Error', 'Unexpected response format from server');
      }
    } catch (error: any) {
      console.error('Error searching products:', error);
      
      // Get more detailed error information
      let errorMessage = 'Failed to search for products. Please try again.';
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        errorMessage = error.response.data?.error || errorMessage;
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        errorMessage = 'No response received from server';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
        errorMessage = error.message || errorMessage;
      }
      
      Alert.alert('Search Error', errorMessage);
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.browserButton} onPress={openBrowser}>
        <Text style={styles.browserButtonText}>Browse Amazon</Text>
      </TouchableOpacity>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Enter product to search"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Button title="Search" onPress={searchProducts} />
      </View>
      
      {/* Browser Modal */}
      <Modal
        visible={browserVisible}
        animationType="slide"
        onRequestClose={closeBrowser}
      >
        <View style={styles.browserContainer}>
          <View style={styles.browserHeader}>
            <View style={styles.browserControls}>
              <TouchableOpacity style={styles.browserControlButton} onPress={goBack}>
                <Text style={styles.browserControlText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.browserControlButton} onPress={useCurrentUrl}>
                <Text style={styles.browserControlText}>Track Product</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.browserControlButton} onPress={closeBrowser}>
                <Text style={styles.browserControlText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
          <WebView
            ref={webViewRef}
            source={{ uri: currentUrl }}
            style={styles.webView}
            onNavigationStateChange={(navState) => {
              if (navState.url) setCurrentUrl(navState.url);
            }}
          />
        </View>
      </Modal>
      
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      
      {searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          numColumns={2} // Display two items per row
          columnWrapperStyle={styles.columnWrapper} // Style for the row wrapper
          renderItem={({ item }) => (
            <View style={styles.productContainer}>
              <View style={styles.productHeader}>
                {item.is_sponsored && <Text style={styles.sponsored}>Sponsored</Text>}
                {item.is_amazons_choice && <Text style={styles.amazonChoice}>Amazon's Choice</Text>}
                {item.is_best_seller && <Text style={styles.bestSeller}>Best Seller</Text>}
              </View>
              
              {/* Image at the top */}
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.productImage}
                  resizeMode="contain"
                  onLoad={() => console.log(`Image loaded for ${item.asin}: ${item.image_url}`)}
                  onError={() => console.error(`Image failed to load for ${item.asin}: ${item.image_url}`)}
                />
              </View>
              
              {/* Product details below the image */}
              <View style={styles.productDetails}>
                <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail"><Text>{item.title}</Text></Text>
                
                <View style={styles.ratingContainer}>
                  <Text style={styles.rating}><Text>{item.rating.toFixed(1)}</Text><Text> </Text><Text>★</Text></Text>
                  <Text style={styles.reviews}><Text>(</Text><Text>{item.reviews_count}</Text><Text> reviews)</Text></Text>
                </View>
                
                <View style={styles.priceContainer}>
                  <Text style={styles.price}><Text>{item.currency}</Text> <Text>{item.price.toFixed(2)}</Text></Text>
                  
                  {/* Always show price_initial */}
                  <Text style={item.price_initial && item.price_initial > item.price ? styles.originalPrice : styles.regularPrice}>
                    <Text>Original: </Text><Text>{item.currency}</Text> <Text>{item.price_initial ? item.price_initial.toFixed(2) : item.price.toFixed(2)}</Text>
                  </Text>
                  
                  {/* Show discount badge only when there is an actual discount */}
                  {item.price_initial && item.price_initial > item.price && (
                    <Text style={styles.discountBadge}>
                      <Text>{Math.floor(((item.price_initial - item.price) / item.price_initial) * 100)}</Text><Text>%</Text><Text> OFF</Text>
                    </Text>
                  )}
                </View>
                
                {item.is_prime && <Text style={styles.prime}>Prime</Text>}
                
                <Text style={styles.shipping}><Text>{item.shipping_info}</Text></Text>
                
                <View style={styles.buttonGroup}>
                  <TouchableOpacity 
                    style={styles.viewButton} 
                    onPress={() => openAmazonLink(item.product_url)}
                  >
                    <Text style={styles.viewButtonText}>View on Amazon</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.trackButton} 
                    onPress={() => trackProduct(item)}
                    disabled={trackingProduct === item.id}
                  >
                    <Text style={styles.trackButtonText}>
                      {trackingProduct === item.id ? 'Adding...' : 'Track Product'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListHeaderComponent={
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsText}>Found {totalResults} results for "{searchQuery}"</Text>
            </View>
          }
        />
      ) : productInfo ? (
        <View style={styles.productContainer}>
          {/* Product image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: productInfo.images && productInfo.images.length > 0 ? productInfo.images[0] : '' }}
              style={styles.productImage}
              resizeMode="contain"
              onLoad={() => console.log(`Product image loaded: ${productInfo.images && productInfo.images.length > 0 ? productInfo.images[0] : 'No image'}`)}
              onError={() => console.error(`Product image failed to load: ${productInfo.images && productInfo.images.length > 0 ? productInfo.images[0] : 'No image'}`)}
            />
          </View>
          
          {/* Product details below the image */}
          <View style={styles.productDetails}>
            <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail"><Text>{productInfo.title}</Text></Text>
            
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}><Text>{productInfo.rating?.toFixed(1)}</Text><Text> </Text><Text>★</Text></Text>
              <Text style={styles.reviews}><Text>(</Text><Text>{productInfo.reviews_count}</Text><Text> reviews)</Text></Text>
            </View>
            
            <View style={styles.priceContainer}>
              <Text style={styles.price}><Text>{productInfo.currency || '$'}</Text> <Text>{productInfo.price.toFixed(2)}</Text></Text>
              
              {/* Always show price_initial */}
              <Text style={productInfo.price_initial && productInfo.price_initial > productInfo.price ? styles.originalPrice : styles.regularPrice}>
                <Text>Original: </Text><Text>{productInfo.currency || '$'}</Text> <Text>{productInfo.price_initial ? productInfo.price_initial.toFixed(2) : productInfo.price.toFixed(2)}</Text>
              </Text>
              
              {/* Show discount badge only when there is an actual discount */}
              {productInfo.price_initial && productInfo.price_initial > productInfo.price && (
                <Text style={styles.discountBadge}>
                  <Text>{Math.floor(((productInfo.price_initial - productInfo.price) / productInfo.price_initial) * 100)}</Text><Text>%</Text><Text> OFF</Text>
                </Text>
              )}
            </View>
            
            {productInfo.is_prime && <Text style={styles.prime}>Prime</Text>}
            
            <Text style={styles.shipping}><Text>{productInfo.shipping_info}</Text></Text>
            
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={styles.viewButton} 
                onPress={() => openAmazonLink(productInfo.url)}
              >
                <Text style={styles.viewButtonText}>View on Amazon</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.trackButton} 
                onPress={() => trackProductFromInfo(productInfo)}
              >
                <Text style={styles.trackButtonText}>Track Product</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        !loading && <Text>No product information available</Text>
      )}
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  // Browser modal styles
  browserContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  browserHeader: {
    backgroundColor: '#232F3E', // Amazon dark blue
    padding: 8,
    paddingTop: 10, // Reduced top padding
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  browserControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  browserControlButton: {
    backgroundColor: '#FF9900', // Amazon orange
    padding: 8,
    paddingHorizontal: 8,
    borderRadius: 5,
    marginHorizontal: 3,
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  browserControlText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  webView: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  browserButton: {
    backgroundColor: '#232F3E', // Amazon dark blue
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '90%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  browserButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    width: '100%',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginRight: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  productIdContainer: {
    flexDirection: 'column',
    marginBottom: 20,
    width: '100%',
  },
  productIdInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  resultsHeader: {
    width: '100%',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 10,
  },
  resultsText: {
    fontSize: 16,
    fontWeight: '500',
  },
  productContainer: {
    marginBottom: 10,
    marginHorizontal: 5,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    width: '48%', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden', 
  },
  columnWrapper: {
    justifyContent: 'space-between', 
    paddingHorizontal: 5, 
  }, 
  productHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  priceContainer: {
    marginVertical: 5,
    alignItems: 'center',
    width: '100%',
  },
  discountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
    color: '#7f8c8d',
    marginTop: 2,
  },
  regularPrice: {
    fontSize: 12,
    color: '#333',
    marginTop: 2,
  },
  discountBadge: {
    backgroundColor: '#CC0C39',
    color: 'white',
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
  },
  sponsored: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    marginRight: 6,
  },
  amazonChoice: {
    backgroundColor: '#232F3E',
    color: 'white',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    marginRight: 6,
  },
  bestSeller: {
    backgroundColor: '#FF9900',
    color: 'white',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
  },
  imageContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  productImage: {
    width: 100, 
    height: 100,
    marginVertical: 5,
  },
  productDetails: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 12, 
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    height: 36, 
    overflow: 'hidden', 
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rating: {
    color: '#FF9900',
    fontWeight: 'bold',
    marginRight: 4,
  },
  reviews: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  brand: {
    fontSize: 14,
    color: '#333',
    marginTop: 5,
  },
  stock: {
    fontSize: 14,
    color: '#333',
    marginTop: 3,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B12704',
  },
  prime: {
    color: '#00A8E1',
    fontWeight: 'bold',
  },
  shipping: {
    fontSize: 14,
    color: '#565959',
    marginBottom: 12,
    textAlign: 'center',
  },
  buttonGroup: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 5,
    width: '100%',
  },
  viewButton: {
    backgroundColor: '#FFD814',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
    width: '100%',
  },
  viewButtonText: {
    color: '#111',
    fontWeight: '600',
    fontSize: 12,
  },
  trackButton: {
    backgroundColor: '#008577',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  trackButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  link: {
    color: '#007185',
    textDecorationLine: 'underline',
    marginTop: 10,
    fontSize: 16,
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
});
