import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
} from "react-native";
import CONFIG from './config'; 

const PostCard = ({ post, navigation }) => {
  const [liked, setLiked] = useState(post.isLikedByUser);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentCount, setCommentCount] = useState(post.comments);

  const toggleLike = async () => {
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/toggleLike`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `postId=${post.postid}`,
      });
      const result = await response.json();

      if (result.success) {
        post.likes += liked ? -1 : 1;
        setLiked(!liked);
        // Increment or decrement the likes count
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const fetchComments = async () => {
    if (!showComments) {
      try {
        const response = await fetch(`${CONFIG.BACKEND_URL}/getComments?postId=${post.postid}`);
        const data = await response.json();
        setComments(data);
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    }
    setShowComments(!showComments);
  };

  const addComment = async () => {
    if (!newComment.trim()) {
      return;
    }
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/addComment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `postId=${post.postid}&comment=${newComment}`,
      });
      const result = await response.json();

      if (result.success) {
        // Fetch the updated comments list after adding a new comment
        const commentsResponse = await fetch(`${CONFIG.BACKEND_URL}/getComments?postId=${post.postid}`);
        const updatedComments = await commentsResponse.json();
        setComments(updatedComments);

        // Increment the comment count in the frontend
        setCommentCount(commentCount + 1);
        setNewComment(""); // Clear the input field
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const imageUri = `data:image/jpeg;base64,${post.image}`;
  const profileImageUri = `data:image/jpeg;base64,${post.profilepicture}`;

  return (
    <View style={styles.card}>
      {/* Header Section with Profile Picture and Owner Name */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => navigation.navigate("Profile", { ownerid: post.ownerid })}
      >
        <Image source={{ uri: profileImageUri }} style={styles.profilePicture} />
        <Text style={styles.ownerName}>{post.ownername}</Text>
      </TouchableOpacity>

      {/* Post Image */}
      <Image source={{ uri: imageUri }} style={styles.image} />

      {/* Post Details */}
      <View style={styles.info}>
        <Text style={styles.description}>{post.description}</Text>
        <TouchableOpacity onPress={toggleLike} style={styles.likeButton}>
          <Text style={styles.likeText}>
            {liked ? "❤️" : "🤍"} {post.likes} Likes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={fetchComments} style={styles.commentButton}>
          <Text style={styles.commentText}>
            💬 {commentCount} Comments
          </Text>
        </TouchableOpacity>
      </View>

      {/* Comments Section */}
      {showComments && (
        <View style={styles.commentsSection}>
          <FlatList
            data={comments}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.comment}>
                <View style={styles.commentHeader}>
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${item.profilepicture}` }}
                    style={styles.commentProfilePicture}
                  />
                  <Text style={styles.commentUsername}>{item.username}</Text>
                </View>
                <Text style={styles.commentText}>{item.comment}</Text>
              </View>
            )}
          />
          <TextInput
            style={styles.input}
            placeholder="Add your comment..."
            value={newComment}
            onChangeText={setNewComment}
          />
          <TouchableOpacity onPress={addComment} style={styles.addCommentButton}>
            <Text style={styles.addCommentText}>Add Comment</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  image: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  info: {
    padding: 16,
  },
  description: {
    fontSize: 16,
    marginBottom: 8,
  },
  likeButton: {
    marginBottom: 8,
  },
  likeText: {
    fontSize: 16,
  },
  commentButton: {
    marginBottom: 8,
  },
  commentText: {
    fontSize: 16,
  },
  commentsSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  comment: {
    paddingVertical: 4,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  commentProfilePicture: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  commentUsername: {
    fontWeight: "bold",
    fontSize: 14,
  },
  commentText: {
    fontSize: 14,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
  },
  addCommentButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 4,
    alignItems: "center",
  },
  addCommentText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default PostCard;
