import React, { useState } from 'react';
import { View, Text, TextInput, Button, Image, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import CONFIG from './config'; 

export default function AddPost() {
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission to access the gallery is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].base64);
    }
  };

  const handleSubmit = async () => {
    if (!description && !image) {
      Alert.alert("Please enter a description or choose an image.");
      return;
    }

    try {
      const formData = new URLSearchParams();
      formData.append("description", description);
      formData.append("image", image);

      const response = await fetch(`${CONFIG.BACKEND_URL}/addPost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = await response.json(); // Parse the JSON response

      // Check the response for success
      if (data.success) {
        Alert.alert("Post uploaded successfully");
        setDescription('');
        setImage(null);
      } else {
        Alert.alert("Failed to upload post: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error uploading post.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.promptText}>What's on your mind?</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your post here..."
        value={description}
        onChangeText={setDescription}
      />
      {image && (
        <Image
          source={{ uri: `data:image/png;base64,${image}` }}
          style={styles.image}
        />
      )}
      <TouchableOpacity style={styles.addButton} onPress={pickImage}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
      <Button title="Post" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  promptText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 100,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  addButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 100,
    right: 30,
  },
  addButtonText: {
    color: 'white',
    fontSize: 30,
  },
});
