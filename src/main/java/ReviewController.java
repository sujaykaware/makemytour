package com.makemytrip.makemytrip;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    private final ReviewRepository reviewRepository;

    public ReviewController(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    // Get reviews
    @GetMapping("/{itemId}")
    public List<Review> getReviews(
            @PathVariable String itemId,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(required = false) Integer rating) {

        List<Review> reviews =
                reviewRepository.findByItemIdAndRemovedFalse(itemId);

        if (rating != null) {
            reviews.removeIf(review ->
                    review.getRating() != rating.intValue());
        }

        if ("highest".equalsIgnoreCase(sort)) {

            reviews.sort(
                    Comparator.comparingInt(
                            Review::getRating
                    ).reversed()
            );

        } else if ("helpful".equalsIgnoreCase(sort)) {

            reviews.sort(
                    Comparator.comparingInt(
                            Review::getHelpfulCount
                    ).reversed()
            );

        } else {

            reviews.sort(
                    Comparator.comparing(
                            Review::getCreatedAt
                    ).reversed()
            );
        }

        return reviews;
    }

    // Add review
    @PostMapping
    public Review addReview(@RequestBody Review review) {

        if (review.getRating() < 1 ||
                review.getRating() > 5) {

            throw new RuntimeException(
                    "Rating must be between 1 and 5"
            );
        }

        return reviewRepository.save(review);
    }

    // Mark review as helpful
    @PutMapping("/{id}/helpful")
    public Review markHelpful(@PathVariable String id) {

        Review review = reviewRepository
                .findById(id)
                .orElseThrow();

        review.setHelpfulCount(
                review.getHelpfulCount() + 1
        );

        return reviewRepository.save(review);
    }

    // Flag review
    @PutMapping("/{id}/flag")
    public Review flagReview(@PathVariable String id) {

        Review review = reviewRepository
                .findById(id)
                .orElseThrow();

        review.setFlagged(true);

        return reviewRepository.save(review);
    }

    // Reply to review
    @PostMapping("/{id}/reply")
    public Review replyToReview(
            @PathVariable String id,
            @RequestBody Review.Reply reply) {

        Review review = reviewRepository
                .findById(id)
                .orElseThrow();

        review.getReplies().add(reply);

        return reviewRepository.save(review);
    }

    // Moderator removes review
    @DeleteMapping("/{id}/moderate")
    public String moderateReview(
            @PathVariable String id) {

        Review review = reviewRepository
                .findById(id)
                .orElseThrow();

        review.setRemoved(true);

        reviewRepository.save(review);

        return "Review removed by moderator";
    }

    // Upload review photo
    @PostMapping("/upload-photo")
    public String uploadPhoto(
            @RequestParam("file") MultipartFile file)
            throws IOException {

        if (file.isEmpty()) {
            throw new RuntimeException(
                    "Please select a photo."
            );
        }

        String contentType = file.getContentType();

        if (contentType == null ||
                !contentType.startsWith("image/")) {

            throw new RuntimeException(
                    "Only image files are allowed."
            );
        }

        if (file.getSize() > 5 * 1024 * 1024) {

            throw new RuntimeException(
                    "Image size must be less than 5 MB."
            );
        }

        String base64 = Base64.getEncoder()
                .encodeToString(file.getBytes());

        return "data:" + contentType + ";base64," + base64;
    }
}