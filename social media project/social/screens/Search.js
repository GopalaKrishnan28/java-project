import React, { useState } from "react";
import { View, TextInput, Button, FlatList, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import CONFIG from './config'; 
import PostCard from './PostCard';  // Import PostCard component

const Search = ({ navigation }) => {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch users based on search query
      const userResponse = await fetch(`${CONFIG.BACKEND_URL}/searchUsers?query=${query}`);
      if (!userResponse.ok) {
        throw new Error(`Error fetching users: ${userResponse.status}`);
      }
      const userData = await userResponse.json();
      setUsers(userData);

      // Fetch posts based on search query
      const postResponse = await fetch(`${CONFIG.BACKEND_URL}/searchPosts?query=${query}`);
      if (!postResponse.ok) {
        throw new Error(`Error fetching posts: ${postResponse.status}`);
      }
      const postData = await postResponse.json();
      setPosts(postData);

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search users or posts"
        value={query}
        onChangeText={setQuery}
      />
      <Button title="Search" onPress={handleSearch} />
      
      {loading && <Text>Loading...</Text>}
      {error && <Text>Error: {error}</Text>}
     
      <View>
  <Text style={styles.sectionTitle}>Users</Text>
  <FlatList
    data={users}
    keyExtractor={(item) => item.userid}
    renderItem={({ item }) => {
      const imageUri = `data:image/jpeg;base64,${item.profilepicture}`;
      console.log(imageUri);
      return (
        <TouchableOpacity onPress={() => navigation.navigate('Profile', { ownerid: item.userid })} style={styles.card}>
          <Image source={{ uri: item.profilepicture ? `data:image/jpeg;base64,${item.profilepicture}` : require('D:/social media project/social/assets/u.png')  }} style={styles.profilePicture} />
          <Text>{item.username}</Text>
        </TouchableOpacity>
      );
    }}
  />
</View>

      <View>
        <Text style={styles.sectionTitle}>Posts</Text>
        <FlatList
          data={posts}
          keyExtractor={(item) => item.postid}
          renderItem={({ item }) => (
            <PostCard post={item} navigation={navigation} /> 
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8f8f8",
  },
  searchInput: {
    height: 40,
    borderColor: "#ddd",
    borderWidth: 1,
    marginBottom: 16,
    paddingLeft: 8,
    borderRadius: 5,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginVertical: 8,
  },
  card: {
    padding: 10,
    backgroundColor: "white",
    marginBottom: 8,
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    resizeMode: 'cover',
  },
});

export default Search;
