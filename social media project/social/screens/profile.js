import React, { useState, useEffect } from "react";
import { View, Text, Image, Button, FlatList, StyleSheet } from "react-native";
import CONFIG from './config';
import PostCard from './PostCard';

const Profile = ({ route, navigation }) => {
    const { ownerid } = route.params; // User ID of the profile being viewed
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    useEffect(() => {
        fetchProfileDetails();
        fetchUserPosts();
    }, [ownerid]);

    const fetchProfileDetails = async () => {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/getUserProfile?userid=${ownerid}`);
            const data = await response.json();

            setProfile(data);
            setFollowersCount(data.followers.length);
            setFollowingCount(data.following.length);
            checkIfFollowing();
        } catch (error) {
            console.error("Error fetching profile details:", error);
        }
    };

    const fetchUserPosts = async () => {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/getUserPosts?userid=${ownerid}`);
            const data = await response.json();
            setPosts(data); // Store posts in state
        } catch (error) {
            console.error("Error fetching user posts:", error);
        }
    };

    const checkIfFollowing = async () => {
        try {
            const currentUserId = await getCurrentUserId();
            const response = await fetch(
                `${CONFIG.BACKEND_URL}/isFollowing?profileUserId=${ownerid}&currentUserId=${currentUserId}`
            );
            const data = await response.json();
            setIsFollowing(data.isFollowing);
        } catch (error) {
            console.error("Error checking follow status:", error);
        }
    };

    const getCurrentUserId = async () => {
        const response = await fetch(`${CONFIG.BACKEND_URL}/getCurrentUserId`);
        const data = await response.json();
        return data.userid;
    };

    const handleFollow = async () => {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/addFollow`, {
                method: "POST",
                body: JSON.stringify({ profileUserId: ownerid }),
                headers: { "Content-Type": "application/json" },
            });

            if (response.ok) {
                setIsFollowing(true);
                setFollowersCount(followersCount + 1);
            }
        } catch (error) {
            console.error("Error during follow operation:", error);
        }
    };

    const handleUnfollow = async () => {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/removeFollow`, {
                method: "POST",
                body: JSON.stringify({ profileUserId: ownerid }),
                headers: { "Content-Type": "application/json" },
            });

            if (response.ok) {
                setIsFollowing(false);
                setFollowersCount(followersCount - 1);
            }
        } catch (error) {
            console.error("Error during unfollow operation:", error);
        }
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
            {/* Profile Details Section */}
            <View style={styles.profileHeader}>
                <Image source={{ uri: profileImageUri }} style={styles.profilePicture} />
                <View>
                    <Text style={styles.username}>{profile.username}</Text>
                    <Text>Followers: {followersCount}</Text>
                    <Text>Following: {followingCount}</Text>
                </View>
            </View>
            <Button 
                title={isFollowing ? "Unfollow" : "Follow"} 
                onPress={isFollowing ? handleUnfollow : handleFollow} 
            />

            {/* User Posts Section */}
            <Text style={styles.postsHeader}>Posts by {profile.username}</Text>
            {posts.length === 0 ? (
                <Text style={styles.noPostsText}>This user hasn't posted anything yet.</Text>
            ) : (
                <FlatList
                    data={posts}
                    keyExtractor={(item) => item.postid}
                    renderItem={({ item }) => <PostCard post={item} navigation={navigation} />}
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

export default Profile;
