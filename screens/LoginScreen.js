// screens/LoginScreen.js

import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Missing info', 'Please enter both username and password.');
      return;
    }

    if (username.length < 6) {
      Alert.alert(
        'Invalid username',
        'Username must be at least 6 characters long.'
      );
      return;
    }

    if (password.length < 7) {
      Alert.alert(
        'Invalid password',
        'Password must be at least 7 characters long.'
      );
      return;
    }

    try {
      await login(username, password);
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login failed', error.message || 'Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
        />
      </View>
    
      <Text style={styles.title}>Soundscape</Text>
      <Text style={styles.subtitle}>Log in to continue</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.linkText}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  
  logoContainer: {
    width: 140,
    height: 140,
    borderRadius: 20, 
    overflow: 'hidden', 
    alignSelf: 'center',
    marginBottom: 10,
  },
  
  // Image itself
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover', 
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1DB954',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#1DB954',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  linkText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#1DB954',
    fontSize: 14,
  },
});
