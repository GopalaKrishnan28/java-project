package com.example;
import com.datastax.oss.driver.api.core.CqlSession;
import com.datastax.oss.driver.api.core.cql.Row;
import com.datastax.oss.driver.api.core.cql.ResultSet;
import com.datastax.oss.driver.api.core.config.DefaultDriverOption;
import com.datastax.oss.driver.api.core.config.DriverConfigLoader;
import java.time.Duration;
import com.google.gson.Gson;
import spark.Spark;

import java.nio.file.Paths;
import java.util.*;

public class App {

    private static final Gson gson = new Gson();

    public static void main(String[] args) {
        Spark.ipAddress("0.0.0.0");
        Spark.port(4567);

        Spark.before((request, response) -> {
            if (request.session(false) == null) {
                request.session(true);
            }
        });

       
        Spark.post("/register", (req, res) -> {
            String username = req.queryParams("username");
            String email = req.queryParams("email");
            String password = req.queryParams("password");
            String profilePicture = req.queryParams("profilePicture");

            try (CqlSession session = createSession()) {
                String insertQuery = "INSERT INTO users (userid, username, email, password, profilepicture, followers, following) VALUES (?, ?, ?, ?, ?, ?, ?)";
session.execute(insertQuery, UUID.randomUUID(), username, email, password, profilePicture, new ArrayList<>(), new ArrayList<>());
                return gson.toJson(Map.of("success", true));
            } catch (Exception e) {
                e.printStackTrace();
                return gson.toJson(Map.of("success", false, "message", "Error during registration."));
            }
        });

       
        Spark.post("/login", (req, res) -> {
    String email = req.queryParams("email");
    String password = req.queryParams("password");

    try (CqlSession session = createSession()) {
        String query = "SELECT userid FROM users WHERE email = ? AND password = ? ALLOW FILTERING";
        Row result = session.execute(query, email, password).one();

      
        if (result != null) {
             UUID ownerId = result.getUuid("userid"); 
            req.session().attribute("ownerId", ownerId.toString()); 
            return gson.toJson(Map.of("success", true, "ownerId", ownerId.toString()));
        } else {
            return gson.toJson(Map.of("success", false, "error", "Invalid email/password"));
        }
    } catch (Exception e) {
        e.printStackTrace();
        return gson.toJson(Map.of("success", false, "error", "Error during login."));
    }
});

       
        Spark.post("/addPost", (req, res) -> {
            String ownerId = req.session().attribute("ownerId");
            if (ownerId == null) {
                res.status(401);
                return gson.toJson(Map.of("error", "User not logged in"));
            }

            String description = req.queryParams("description");
            String image = req.queryParams("image");

            List<UUID> likes = new ArrayList<>();
            List<UUID> comments = new ArrayList<>();

            try (CqlSession session = createSession()) {
                String insertQuery = "INSERT INTO posts (postid, ownerid, image, description, likes, comments, posttime) " +
                                     "VALUES (?, ?, ?, ?, ?, ?, toTimestamp(now()))";
                session.execute(insertQuery, UUID.randomUUID(), ownerId, image, description, likes, comments);
                return gson.toJson(Map.of("success", true));
            } catch (Exception e) {
                e.printStackTrace();
                return gson.toJson(Map.of("error", "Error adding post"));
            }
        });
Spark.get("/getPosts", (req, res) -> {
            String ownerId = req.session().attribute("ownerId");
            if (ownerId == null) {
                res.status(401);
                return gson.toJson(Map.of("error", "User not logged in"));
            }
        
            UUID userId = UUID.fromString(ownerId);
        
            try (CqlSession session = createSession()) {
                List<Map<String, Object>> posts = new ArrayList<>();
                ResultSet resultSet = session.execute("SELECT * FROM posts ALLOW FILTERING");
        
                for (Row row : resultSet) {
                    Map<String, Object> post = new HashMap<>();
                    post.put("postid", row.getUuid("postid").toString());
                    post.put("ownerid", row.getString("ownerid"));
                    post.put("image", row.getString("image"));
                    post.put("description", row.getString("description"));
                    post.put("likes", row.getList("likes", UUID.class).size());
                    post.put("comments", row.getList("comments", UUID.class).size());
                    
                    // Check if the post is liked by the current user
                    List<UUID> likes = row.getList("likes", UUID.class);
                    post.put("isLikedByUser", likes.contains(userId));
        
                    // Fetch ownername and profilepicture from users table
                    UUID ownerUUID = UUID.fromString(row.getString("ownerid"));
                    Row userRow = session.execute("SELECT username, profilepicture FROM users WHERE userid = ?", ownerUUID).one();
                    if (userRow != null) {
                        post.put("ownername", userRow.getString("username"));
                        
                        post.put("profilepicture", userRow.getString("profilepicture"));
                        
                    }
                    
                    posts.add(post);
                }
                return gson.toJson(posts);
            } catch (Exception e) {
                e.printStackTrace();
                res.status(500);
                return gson.toJson(Map.of("error", "Internal Server Error: " + e.getMessage()));
            }
        });
        Spark.get("/searchPosts", (req, res) -> {
            String ownerId = req.session().attribute("ownerId");
            if (ownerId == null) {
                res.status(401);
                return gson.toJson(Map.of("error", "User not logged in"));
            }
        
            UUID userId = UUID.fromString(ownerId);
            String searchQuery = req.queryParams("query");
        
            if (searchQuery == null || searchQuery.isEmpty()) {
                res.status(400);
                return gson.toJson(Map.of("error", "Search query cannot be empty"));
            }
        
            try (CqlSession session = createSession()) {
                List<Map<String, Object>> posts = new ArrayList<>();
        
                // Fetch all posts from the database
                String query = "SELECT * FROM posts";
                ResultSet resultSet = session.execute(query);
        
                // Iterate over all posts and filter them in Java
                for (Row row : resultSet) {
                    String description = row.getString("description");
                    if (description != null && description.toLowerCase().contains(searchQuery.toLowerCase())) {
                        Map<String, Object> post = new HashMap<>();
                        post.put("postid", row.getUuid("postid").toString());
                        post.put("ownerid", row.getString("ownerid"));
                        post.put("image", row.getString("image"));
                        post.put("description", row.getString("description"));
                        post.put("likes", row.getList("likes", UUID.class).size());
                        post.put("comments", row.getList("comments", UUID.class).size());
        
                        // Check if the post is liked by the current user
                        List<UUID> likes = row.getList("likes", UUID.class);
                        post.put("isLikedByUser", likes.contains(userId));
        
                        // Fetch ownername and profilepicture from users table
                        UUID ownerUUID = UUID.fromString(row.getString("ownerid"));
                        Row userRow = session.execute("SELECT username, profilepicture FROM users WHERE userid = ?", ownerUUID).one();
                        if (userRow != null) {
                            post.put("ownername", userRow.getString("username"));
                            post.put("profilepicture", userRow.getString("profilepicture"));
                        }
        
                        posts.add(post);
                    }
                }
        
                return gson.toJson(posts);
            } catch (Exception e) {
                e.printStackTrace();
                res.status(500);
                return gson.toJson(Map.of("error", "Internal Server Error: " + e.getMessage()));
            }
        });
        
        
        Spark.get("/searchUsers", (req, res) -> {
            String searchQuery = req.queryParams("query");
            if (searchQuery == null || searchQuery.isEmpty()) {
                res.status(400);
                return gson.toJson(Map.of("error", "Search query is required"));
            }
        
            try (CqlSession session = createSession()) {
                // Fetch all users from the database
                String query = "SELECT * FROM users";
                ResultSet resultSet = session.execute(query);
        
                List<Map<String, Object>> users = new ArrayList<>();
                // Iterate over all users and filter them in Java
                for (Row row : resultSet) {
                    String username = row.getString("username");
                    if (username != null && username.toLowerCase().contains(searchQuery.toLowerCase())) {
                        Map<String, Object> user = new HashMap<>();
                        user.put("userid", row.getUuid("userid").toString());
                        user.put("username", row.getString("username"));
                        user.put("profilepicture", row.getString("profilepicture"));
                        users.add(user);
                    }
                }
        
                return gson.toJson(users);
            } catch (Exception e) {
                e.printStackTrace();
                res.status(500);
                return gson.toJson(Map.of("error", "Error during search"));
            }
        });
        
        
                
        Spark.get("/getUserPosts", (req, res) -> {
            String userIdParam = req.queryParams("userid");
            String currentUserId = req.session().attribute("ownerId");
        
            if (currentUserId == null) {
                res.status(401);
                return gson.toJson(Map.of("error", "User not logged in"));
            }
        
            if (userIdParam == null) {
                res.status(400);
                return gson.toJson(Map.of("error", "Missing userid parameter"));
            }
        
            try (CqlSession session = createSession()) {
                UUID requestedUserId = UUID.fromString(userIdParam);
                UUID currentUserUUID = UUID.fromString(currentUserId);
        
                List<Map<String, Object>> userPosts = new ArrayList<>();
                ResultSet resultSet = session.execute(
                    "SELECT * FROM posts WHERE ownerid = ? ALLOW FILTERING", 
                    userIdParam 
                );
        
                for (Row row : resultSet) {
                    Map<String, Object> post = new HashMap<>();
                    post.put("postid", row.getUuid("postid").toString());
                    post.put("ownerid", row.getString("ownerid"));
                    post.put("image", row.getString("image"));
                    post.put("description", row.getString("description"));
                    post.put("likes", row.getList("likes", UUID.class).size());
                    post.put("comments", row.getList("comments", UUID.class).size());
        
                    // Check if the post is liked by the current user
                    List<UUID> likes = row.getList("likes", UUID.class);
                    post.put("isLikedByUser", likes.contains(currentUserUUID));
        
                    // Fetch ownername and profilepicture from users table
                    Row userRow = session.execute(
                        "SELECT username, profilepicture FROM users WHERE userid = ?",
                        requestedUserId
                    ).one();
                    if (userRow != null) {
                        post.put("ownername", userRow.getString("username"));
                        post.put("profilepicture", userRow.getString("profilepicture"));
                    }
        
                    userPosts.add(post);
                }
        
                return gson.toJson(userPosts);
            } catch (Exception e) {
                e.printStackTrace();
                res.status(500);
                return gson.toJson(Map.of("error", "Internal Server Error: " + e.getMessage()));
            }
        });
        
        Spark.get("/getUserProfile", (req, res) -> {
            String userId = req.queryParams("userid");
            UUID ownerUUID = UUID.fromString(userId);
        
            if (userId == null || userId.isEmpty()) {
                res.status(400);
                return gson.toJson(Map.of("error", "userid is required"));
            }
        
            try (CqlSession session = createSession()) {
                // Query user data including followers and following lists from the users table
                ResultSet resultSet = session.execute(
                    "SELECT username, profilepicture, followers, following FROM users WHERE userid = ?", 
                    ownerUUID
                );
                Row row = resultSet.one();
        
                if (row == null) {
                    res.status(404);
                    return gson.toJson(Map.of("error", "User not found"));
                }
        
                // Build the response with followers and following data
                Map<String, Object> userProfile = new HashMap<>();
                userProfile.put("userid", userId);
                userProfile.put("username", row.getString("username"));
                userProfile.put("profilepicture", row.getString("profilepicture"));
                userProfile.put("followers", row.getList("followers", UUID.class));  // List of followers (UUID)
                userProfile.put("following", row.getList("following", UUID.class));  // List of following (UUID)
        
                return gson.toJson(userProfile);
            } catch (Exception e) {
                e.printStackTrace();
                res.status(500);
                return gson.toJson(Map.of("error", "Internal Server Error: " + e.getMessage()));
            }
        });
        
        
Spark.post("/toggleLike", (req, res) -> {
    String ownerId = req.session().attribute("ownerId");
    if (ownerId == null) return gson.toJson(Map.of("error", "User not logged in"));

    UUID userId = UUID.fromString(ownerId);
    UUID postId = UUID.fromString(req.queryParams("postId"));

    try (CqlSession session = createSession()) {
        Row postRow = session.execute("SELECT likes FROM posts WHERE postid = ? ALLOW FILTERING", postId).one();
        if (postRow == null) return gson.toJson(Map.of("error", "Post not found"));

        List<UUID> likes = postRow.getList("likes", UUID.class);
        if (likes.contains(userId)) {
            likes.remove(userId);
        } else {
            likes.add(userId);
        }
        session.execute("UPDATE posts SET likes = ? WHERE postid = ?", likes, postId);
        return gson.toJson(Map.of("success", true));
    }
});


Spark.get("/getComments", (req, res) -> {
    UUID postId = UUID.fromString(req.queryParams("postId"));
    try (CqlSession session = createSession()) {
        Row postRow = session.execute("SELECT comments FROM posts WHERE postid = ? ALLOW FILTERING", postId).one();
        if (postRow == null) return gson.toJson(Map.of("error", "Post not found"));

        List<UUID> commentIds = postRow.getList("comments", UUID.class);

        List<Map<String, Object>> comments = new ArrayList<>();
        for (UUID commentId : commentIds) {
            Row commentRow = session.execute("SELECT * FROM comments WHERE commentid = ? ALLOW FILTERING", commentId).one();
            if (commentRow != null) {
                Map<String, Object> comment = new HashMap<>();
                comment.put("commentid", commentRow.getUuid("commentid").toString());
                comment.put("comment", commentRow.getString("comment"));
                comment.put("ownerid", commentRow.getString("ownerid"));
                
                // Fetch the username and profile picture from the users table using ownerid
                UUID ownerId = UUID.fromString(commentRow.getString("ownerid"));
                Row userRow = session.execute("SELECT username, profilepicture FROM users WHERE userid = ?", ownerId).one();
                if (userRow != null) {
                    comment.put("username", userRow.getString("username"));
                    comment.put("profilepicture", userRow.getString("profilepicture"));
                }

                comments.add(comment);
            }
        }
        return gson.toJson(comments);
    }
});


Spark.get("/getCurrentUserId", (req, res) -> {
    // Retrieve the current user's ID from the session
    String currentUserId = req.session().attribute("ownerId");
    
    // Check if the user is logged in (session attribute is not null)
    if (currentUserId == null) {
        // If no user is logged in, return an error response
        res.status(401);  // Unauthorized
        return gson.toJson(Map.of("error", "User not logged in"));
    }
    
    // If logged in, return the user ID
    return gson.toJson(Map.of("userid", currentUserId));
});
Spark.get("/isFollowing", (req, res) -> {
    String currentUserId = req.queryParams("currentUserId");
    String profileUserId = req.queryParams("profileUserId");

    try (CqlSession session = createSession()) {
        Row profileUserRow = session.execute("SELECT followers FROM users WHERE userid = ?", UUID.fromString(profileUserId)).one();
        if (profileUserRow == null) {
            return gson.toJson(Map.of("error", "Profile user not found"));
        }

        List<UUID> followers = profileUserRow.getList("followers", UUID.class);
        boolean isFollowing = followers.contains(UUID.fromString(currentUserId));

        return gson.toJson(Map.of("isFollowing", isFollowing));
    }
});
Spark.post("/addFollow", (req, res) -> {
    String ownerId = req.session().attribute("ownerId");
    if (ownerId == null) {
        res.status(401); // Unauthorized
        return gson.toJson(Map.of("error", "User not logged in"));
    }

    String body = req.body();
    Map<String, String> requestBody = gson.fromJson(body, Map.class);
    UUID currentUserId = UUID.fromString(ownerId);
    UUID profileUserId = UUID.fromString(requestBody.get("profileUserId"));

    try (CqlSession session = createSession()) {
        // Update the followers list of the profile user
        session.execute("UPDATE users SET followers = followers + ? WHERE userid = ?", 
            Arrays.asList(currentUserId), profileUserId);

        // Update the following list of the current user
        session.execute("UPDATE users SET following = following + ? WHERE userid = ?", 
            Arrays.asList(profileUserId), currentUserId);

        res.status(200); // OK
        return gson.toJson(Map.of("message", "Followed successfully"));
    } catch (Exception e) {
        e.printStackTrace();
        res.status(500); // Internal Server Error
        return gson.toJson(Map.of("error", "Error following user"));
    }
});

Spark.post("/removeFollow", (req, res) -> {
    String ownerId = req.session().attribute("ownerId");
    if (ownerId == null) {
        res.status(401); // Unauthorized
        return gson.toJson(Map.of("error", "User not logged in"));
    }

    String body = req.body();
    Map<String, String> requestBody = gson.fromJson(body, Map.class);

    UUID currentUserId = UUID.fromString(ownerId);
    UUID profileUserId = UUID.fromString(requestBody.get("profileUserId"));

    try (CqlSession session = createSession()) {
        // Fetch the current followers list of the profile user
        ResultSet profileUserResult = session.execute(
            "SELECT followers FROM users WHERE userid = ?",
            profileUserId
        );
        Row profileRow = profileUserResult.one();
        if (profileRow == null) {
            res.status(404); // Not Found
            return gson.toJson(Map.of("error", "Profile user not found"));
        }
        List<UUID> followers = profileRow.getList("followers", UUID.class);
        if (followers != null && followers.contains(currentUserId)) {
            followers.remove(currentUserId);
        }

        // Update the followers list of the profile user
        session.execute(
            "UPDATE users SET followers = ? WHERE userid = ?",
            followers, profileUserId
        );

        // Fetch the current following list of the current user
        ResultSet currentUserResult = session.execute(
            "SELECT following FROM users WHERE userid = ?",
            currentUserId
        );
        Row currentRow = currentUserResult.one();
        if (currentRow == null) {
            res.status(404); // Not Found
            return gson.toJson(Map.of("error", "Current user not found"));
        }
        List<UUID> following = currentRow.getList("following", UUID.class);
        if (following != null && following.contains(profileUserId)) {
            following.remove(profileUserId);
        }

        // Update the following list of the current user
        session.execute(
            "UPDATE users SET following = ? WHERE userid = ?",
            following, currentUserId
        );

        res.status(200); // OK
        return gson.toJson(Map.of("message", "Unfollowed successfully"));
    } catch (Exception e) {
        e.printStackTrace();
        res.status(500); // Internal Server Error
        return gson.toJson(Map.of("error", "Error unfollowing user: " + e.getMessage()));
    }
});

Spark.post("/deletePost", (req, res) -> {
    String ownerId = req.session().attribute("ownerId");
    if (ownerId == null) {
        res.status(401); // Unauthorized
        return gson.toJson(Map.of("error", "User not logged in"));
    }

    UUID postId = UUID.fromString(req.queryParams("postId"));

    try (CqlSession session = createSession()) {
        // Step 1: Fetch the post to get associated comments
        Row postRow = session.execute("SELECT comments FROM posts WHERE postid = ? ALLOW FILTERING", postId).one();
        if (postRow == null) {
            res.status(404); // Not Found
            return gson.toJson(Map.of("error", "Post not found"));
        }

        // Step 2: Delete associated comments
        List<UUID> commentIds = postRow.getList("comments", UUID.class);
        if (commentIds != null && !commentIds.isEmpty()) {
            for (UUID commentId : commentIds) {
                // Delete each comment from the comments table
                session.execute("DELETE FROM comments WHERE commentid = ?", commentId);
            }
        }

        // Step 3: Delete the post
        session.execute("DELETE FROM posts WHERE postid = ?", postId);

        return gson.toJson(Map.of("success", true));
    } catch (Exception e) {
        e.printStackTrace();
        res.status(500); // Internal Server Error
        return gson.toJson(Map.of("error", "Error deleting post: " + e.getMessage()));
    }
});

Spark.post("/addComment", (req, res) -> {
    String ownerId = req.session().attribute("ownerId");
    if (ownerId == null) return gson.toJson(Map.of("error", "User not logged in"));

    UUID postId = UUID.fromString(req.queryParams("postId"));
    String commentText = req.queryParams("comment");

    try (CqlSession session = createSession()) {
        UUID commentId = UUID.randomUUID();
        String insertCommentQuery = "INSERT INTO comments (commentid, comment, ownerid) VALUES (?, ?, ?)";
        session.execute(insertCommentQuery, commentId, commentText, ownerId);

        Row postRow = session.execute("SELECT comments FROM posts WHERE postid = ? ALLOW FILTERING", postId).one();
        if (postRow == null) return gson.toJson(Map.of("error", "Post not found"));

        List<UUID> comments = postRow.getList("comments", UUID.class);
        comments.add(commentId);
        session.execute("UPDATE posts SET comments = ? WHERE postid = ?", comments, postId);

        return gson.toJson(Map.of("success",true));
    }
});

        createSession();  
    }

    private static CqlSession createSession() {
        String secureConnectBundlePath = "C:\\Users\\harin\\Downloads\\casjava\\ConnectDatabaseProject\\ConnectDatabase\\src\\main\\java\\com\\example\\secure-connect-social-db.zip";
        String clientId = "QbQYZdJzXAteoNEisXPEXnzv";
        String clientSecret = "DIF-IOP4Q8ZMjfGJ9g9SdlC3+D.RXhhgg6jc_iax2SS_dQhZ9LpiYUDvXN9Ym8+,BJN8sJFOPkZTbyhFLL,.K9vjUv9OZSuy7KI30iFppJRR1dSWFRm,ui0S_APoJdZM";
        String keyspace = "name";


        DriverConfigLoader loader = DriverConfigLoader.programmaticBuilder()
        .withDuration(DefaultDriverOption.REQUEST_TIMEOUT, Duration.ofSeconds(10)) 
       
        .build();

    CqlSession session = CqlSession.builder()
            .withCloudSecureConnectBundle(Paths.get(secureConnectBundlePath))
            .withAuthCredentials(clientId, clientSecret)
            .withKeyspace(keyspace)
            .withConfigLoader(loader) 
            .build();

            session.execute("CREATE TABLE IF NOT EXISTS users (" +
            "userid UUID PRIMARY KEY, " +
            "username text, " +
            "email text, " +
            "password text, " +
            "profilepicture text, " +
            "followers list<UUID>, " +  // List of follower user IDs
            "following list<UUID>);"); // List of following user IDs

       
        session.execute("CREATE TABLE IF NOT EXISTS posts (" +
                "postid UUID PRIMARY KEY, " +
                "ownerid text, " +
                "image text, " +
                "description text, " +
                "likes list<UUID>, " +
                "comments list<UUID>, " +
                "posttime timestamp);");

     
        session.execute("CREATE TABLE IF NOT EXISTS comments (" +
                "commentid UUID PRIMARY KEY, " +
                "comment text, " +
                "ownerid text);");

        return session;
    }
}