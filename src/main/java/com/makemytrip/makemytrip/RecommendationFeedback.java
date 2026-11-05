package com.makemytrip.makemytrip;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "recommendation_feedback")
public class RecommendationFeedback {

    @Id
    private String id;
    private String userId;
    private String recommendationId;
    private String itemType;
    private String city;
    private String theme;
    private boolean helpful;
    private LocalDateTime createdAt = LocalDateTime.now();

    public String getId() { return id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getRecommendationId() { return recommendationId; }
    public void setRecommendationId(String recommendationId) { this.recommendationId = recommendationId; }
    public String getItemType() { return itemType; }
    public void setItemType(String itemType) { this.itemType = itemType; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }
    public boolean isHelpful() { return helpful; }
    public void setHelpful(boolean helpful) { this.helpful = helpful; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}