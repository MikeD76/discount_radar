import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { Button } from 'react-native';
import Index from '../../app/index';
import ProductList from '../../app/ProductList';

type DrawerParamList = {
  Home: undefined;
  ProductList: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();
const Stack = createStackNavigator<DrawerParamList>();

const HomeScreen = ({ navigation }: any) => (
  <Stack.Navigator>
    <Stack.Screen
      name="Home"
      component={Index}
      options={{
        title: 'Home',
        headerRight: () => (
          <Button
            onPress={() => navigation.openDrawer()}
            title="Menu"
            color="#000"
          />
        ),
      }}
    />
  </Stack.Navigator>
);

const ProductListScreen = ({ navigation }: any) => (
  <Stack.Navigator>
    <Stack.Screen
      name="ProductList"
      component={ProductList}
      options={{
        title: 'Product List',
        headerRight: () => (
          <Button
            onPress={() => navigation.openDrawer()}
            title="Menu"
            color="#000"
          />
        ),
      }}
    />
  </Stack.Navigator>
);

const AppNavigator = () => {
  return (
    <Drawer.Navigator initialRouteName="Home">
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="ProductList" component={ProductListScreen} />
    </Drawer.Navigator>
  );
};

export default AppNavigator;
