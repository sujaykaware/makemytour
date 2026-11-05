package com.makemytrip.makemytrip;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ReviewRepository extends MongoRepository<Review, String> {

    List<Review> findByItemIdAndRemovedFalse(String itemId);

}