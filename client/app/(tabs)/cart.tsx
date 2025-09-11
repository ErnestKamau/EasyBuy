import React from "react";
import { View, Text, StyleSheet } from 'react-native';

export default function Cart(): React.ReactElement {
  return (
    <View style={styles.container}>
        <Text> welcome to cart</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },

})