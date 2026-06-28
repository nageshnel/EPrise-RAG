package com.v76.gems.retrieval;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/retrieve")
public class RetrievalController {
    private static final Logger log = LoggerFactory.getLogger(RetrievalController.class);
    private final RetrievalService retrievalService;

    public RetrievalController(RetrievalService retrievalService) {
        this.retrievalService = retrievalService;
    }

    @PostMapping
    public RetrieveResponse retrieve(@RequestBody RetrieveRequest request) {
        log.info("Received request to retrieve context for query: '{}'", request.query());
        RetrieveResponse response = retrievalService.retrieve(request);
        log.info("Successfully completed retrieval for query: '{}' (found {} matching chunks)", request.query(), response.chunks() != null ? response.chunks().size() : 0);
        return response;
    }
}
