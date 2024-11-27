import React, { useState, useEffect } from "react";
import { View, Text, Image, FlatList, StyleSheet } from "react-native";
import CONFIG from './config';
import MyPostCard from './MyPostCard';

const MyProfile = () => {
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const currentUserId = await getCurrentUserId();
                const response = await fetch(`${CONFIG.BACKEND_URL}/getUserProfile?userid=${currentUserId}`);
                const data = await response.json();
                setProfile(data);
                setFollowersCount(data.followers.length);
                setFollowingCount(data.following.length);
                fetchUserPosts(currentUserId);
            } catch (error) {
                console.error("Error fetching profile:", error);
            }
        };

        fetchProfile();
    }, []);

    const getCurrentUserId = async () => {
        const response = await fetch(`${CONFIG.BACKEND_URL}/getCurrentUserId`);
        const data = await response.json();
        return data.userid;
    };

    const fetchUserPosts = async (userId) => {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/getUserPosts?userid=${userId}`);
            const data = await response.json();
            setPosts(data);
        } catch (error) {
            console.error("Error fetching user posts:", error);
        }
    };

    const deletePost = (postId) => {
        setPosts((prevPosts) => prevPosts.filter(post => post.postid !== postId));
    };

    if (!profile) {
        return (
            <View style={styles.container}>
                <Text>Loading profile...</Text>
            </View>
        );
    }

    const profileImageUri = `data:image/jpeg;base64,${profile.profilepicture}`;

    return (
        <View style={styles.container}>
            <View style={styles.profileHeader}>
                <Image source={{ uri: profileImageUri }} style={styles.profilePicture} />
                <Text style={styles.username}>{profile.username}</Text>
            </View>
            <Text>Followers: {followersCount}</Text>
            <Text>Following: {followingCount}</Text>

            {/* User Posts */}
            <Text style={styles.postsHeader}>Your Posts</Text>
            {posts.length === 0 ? (
                <Text style={styles.noPostsText}>You haven't posted anything yet.</Text>
            ) : (
                <FlatList
                    data={posts}
                    keyExtractor={(item) => item.postid}
                    renderItem={({ item }) => (
                        <MyPostCard post={item} onDeletePost={deletePost} fetchPosts={fetchUserPosts} />
                    )}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 16,
    },
    profileHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    profilePicture: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginRight: 16,
    },
    username: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
    },
    postsHeader: {
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 16,
        marginBottom: 8,
    },
    noPostsText: {
        fontSize: 16,
        color: "#888",
        textAlign: "center",
        marginTop: 20,
    },
});

export default MyProfile;
