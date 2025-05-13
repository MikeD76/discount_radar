import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  productContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  productImage: {
    width: 300,
    height: 300,
    marginTop: 10,
  },
  listContainer: {
    flex: 1,
    padding: 10,
  },
  listItem: {
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    backgroundColor: '#f9c2ff',
    borderRadius: 5,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  listItemBrand: {
    fontSize: 14,
  },
});

export default styles;