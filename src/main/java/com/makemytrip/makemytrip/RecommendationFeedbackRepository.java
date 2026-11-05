package com.makemytrip.makemytrip;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface RecommendationFeedbackRepository
        extends MongoRepository<RecommendationFeedback, String> {

    Optional<RecommendationFeedback> findFirstByUserIdAndRecommendationId(
            String userId, String recommendationId);
}