// screens/PoliciesListPage.tsx

import { useAppTheme } from '@/hooks/useAppTheme';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const policies = [
  { title: 'Security', icon: 'shield', route: '/screens/legal/security' },
  { title: 'Privacy Policy', icon: 'lock', route: '/screens/legal/policy' },
  { title: 'Terms & Conditions', icon: 'file-text', route: '/screens/legal/Terms' },
  { title: 'Support', icon: 'help-circle', route: '/screens/legal/HelpPage' },

];

const LegalPage = () => {
const router = useRouter();
  const theme = useAppTheme();
  return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>

      <FlatList
        data={policies}
        keyExtractor={(item) => item.route}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.item,{borderBottomColor:theme.border}]}
            onPress={() => router.push(item.route as any)}
          >
            <Feather name={item.icon as any} size={20} color={theme.text} style={styles.icon} />
            <Text style={[styles.itemText,{color:theme.text}]}>{item.title}</Text>
            <Feather name="chevron-right" size={20} color={theme.text}/>
          </TouchableOpacity>
        )}
      />
            <Text style={[styles.version,{color:theme.subtext}]}>App Version 1.0.0</Text>
      
    </View>
  );
};
export default LegalPage;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  icon: {
    marginRight: 15,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
  },
   version: {
    textAlign: 'center',
    color: '#999',
    marginTop: 28,
    fontSize: 12,
  },
});

