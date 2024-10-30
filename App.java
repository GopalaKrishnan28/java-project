package com.example;
import com.datastax.oss.driver.api.core.CqlSession;
import com.datastax.oss.driver.api.core.cql.ResultSet;
import com.datastax.oss.driver.api.core.cql.Row;
import spark.Spark;

import java.nio.file.Paths;
import java.util.UUID;

public class App {
    public static void main(String[] args) {
        // Allow connections from any IP address
        Spark.ipAddress("0.0.0.0");

        // Set the desired port number
        Spark.port(4567);

        // Define API routes
        Spark.post("/addName", (req, res) -> {
            String name = req.queryParams("name");
            if (name != null && !name.isEmpty()) {
                try (CqlSession session = createSession()) {
                    String insertQuery = "INSERT INTO users (id, name) VALUES (?, ?)";
                    session.execute(insertQuery, UUID.randomUUID(), name);
                    return "Name added: " + name;
                } catch (Exception e) {
                    e.printStackTrace();
                    return "Error adding name: " + e.getMessage();
                }
            }
            return "Name cannot be null or empty";
        });

        Spark.get("/getNames", (req, res) -> {
            StringBuilder names = new StringBuilder("Names in database:\n");
            try (CqlSession session = createSession()) {
                ResultSet rs = session.execute("SELECT * FROM name.users");
                for (Row row : rs) {
                    names.append("ID: ").append(row.getUuid("id")).append(", Name: ").append(row.getString("name")).append("\n");
                }
            } catch (Exception e) {
                e.printStackTrace();
                return "Error retrieving names: " + e.getMessage();
            }
            return names.toString();
        });

        createSession(); // Initialize session and create table if necessary
        System.out.println("Server is running on port 4567");
    }

    private static CqlSession createSession() {
        // Your DataStax settings
        String secureConnectBundlePath = "secure-connect-social-db.zip"; // Update path
        String clientId = "QbQYZdJzXAteoNEisXPEXnzv";
        String clientSecret = "DIF-IOP4Q8ZMjfGJ9g9SdlC3+D.RXhhgg6jc_iax2SS_dQhZ9LpiYUDvXN9Ym8+,BJN8sJFOPkZTbyhFLL,.K9vjUv9OZSuy7KI30iFppJRR1dSWFRm,ui0S_APoJdZM";
        String keyspace = "name"; // Your keyspace

        CqlSession session = CqlSession.builder()
                .withCloudSecureConnectBundle(Paths.get(secureConnectBundlePath))
                .withAuthCredentials(clientId, clientSecret)
                .withKeyspace(keyspace)
                .build();

        String createTableQuery = "CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY, name text);";
        session.execute(createTableQuery);
        System.out.println("Table 'users' created in keyspace '" + keyspace + "'.");

        return session;
    }
}
