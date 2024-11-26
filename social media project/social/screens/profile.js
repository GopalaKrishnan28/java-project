import React, { useState, useEffect } from "react";
import { View, Text, Image, Button, StyleSheet } from "react-native";
import CONFIG from './config';

const Profile = ({ route }) => {
    const { ownerid } = route.params; 
    const [profile, setProfile] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch(`${CONFIG.BACKEND_URL}/getUserProfile?userid=${ownerid}`);
                const data = await response.json();
                setProfile(data);
                setFollowersCount(data.followers.length);
                setFollowingCount(data.following.length);
                checkIfFollowing();
            } catch (error) {
                console.error("Error fetching profile:", error);
            }
        };

        const checkIfFollowing = async () => {
            const currentUserId = await getCurrentUserId();
            const response = await fetch(`${CONFIG.BACKEND_URL}/isFollowing?profileUserId=${ownerid}&currentUserId=${currentUserId}`);
            const data = await response.json();
            setIsFollowing(data.isFollowing);
        };

        fetchProfile();
    }, [ownerid]);

    const getCurrentUserId = async () => {
        const response = await fetch(`${CONFIG.BACKEND_URL}/getCurrentUserId`);
        const data = await response.json();
        return data.userid;
    };

    const handleFollow = async () => {
        try {
            const currentUserId = await getCurrentUserId();
            
            const response = await fetch(`${CONFIG.BACKEND_URL}/addFollow`, {
                method: "POST",
                body: JSON.stringify({ profileUserId: ownerid }),
                headers: { "Content-Type": "application/json" },
            });
    
            const data = await response.json();
    
            if (response.ok) {
                console.log(data.message); // Log success message from the backend
                setIsFollowing(true);
                setFollowersCount(followersCount + 1);
            } else {
                console.error(data.error); // Log error message from the backend
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error("Error during follow operation:", error);
            alert("Something went wrong. Please try again.");
        }
    };
    

    const handleUnfollow = async () => {
        try {
            const currentUserId = await getCurrentUserId();
    
            const response = await fetch(`${CONFIG.BACKEND_URL}/removeFollow`, {
                method: "POST",
                body: JSON.stringify({ profileUserId: ownerid }),
                headers: { "Content-Type": "application/json" },
            });
    
            const data = await response.json();
    
            if (response.ok) {
                console.log(data.message); // Log success message
                setIsFollowing(false);
                setFollowersCount(followersCount - 1);
            } else {
                console.error(data.error); // Log backend error
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error("Error during unfollow operation:", error);
            alert("Something went wrong. Please try again.");
        }
    };
    
    if (!profile) {
        return (
            <View style={styles.container}>
                <Text>Loading profile...</Text>
            </View>
        );
    }
    const imageUri = `data:image/jpeg;base64,${ profile.profilepicture }`;
    return (
        <View style={styles.container}>
            <View style={styles.profileHeader}>
                <Image source={{ uri: imageUri }} style={styles.profilePicture} />
                <Text style={styles.username}>{profile.username}</Text>
            </View>
            <Text>Followers: {followersCount}</Text>
            <Text>Following: {followingCount}</Text>
            <Button 
                title={isFollowing ? "Unfollow" : "Follow"} 
                onPress={isFollowing ? handleUnfollow : handleFollow} 
            />
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
});

export default Profile;
