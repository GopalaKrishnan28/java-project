import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, Button, Text, TouchableOpacity, Image } from "react-native";
import PostCard from "./PostCard";
import CONFIG from './config'; 

const Home = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 

  const fetchPosts = async () => {
    setLoading(true); 
    setError(null);

    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/getPosts`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json(); 
      console.log("Fetched posts:", data); 
      setPosts(data); 
    } catch (error) {
      console.error("Error fetching posts:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []); // This effect runs once when the component mounts.

  // Refetch posts when the screen comes back into focus.
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchPosts(); // Fetch posts when the screen is focused.
    });

    return unsubscribe; // Clean up the listener on unmount.
  }, [navigation]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <>
          <TouchableOpacity onPress={() => navigation.navigate('Search')} style={styles.userIconContainer}>
            <Image 
              source={require('D:/social media project/social/assets/u.png')} 
              style={styles.userIcon} 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('MyProfile')} style={styles.userIconContainer}>
            <Image 
              source={require('D:/social media project/social/assets/u.png')} 
              style={styles.userIcon} 
            />
          </TouchableOpacity>
        </>
      ),
    });
  }, [navigation]);

  if (loading) {
    return <Text>Loading...</Text>; 
  }

  if (error) {
    return <Text>Error: {error}</Text>; 
  }

  return (
    <View style={styles.container}>
      {posts.length === 0 ? ( 
        <Text>No posts available.</Text> 
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.postid}
          renderItem={({ item }) => <PostCard post={item} navigation={navigation} />}
        />
      )}
      <Button 
        title="Add Post" 
        onPress={() => navigation.navigate('Addpost')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8f8f8",
  },
  userIconContainer: {
    marginRight: 16,
  },
  userIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
});

export default Home;
