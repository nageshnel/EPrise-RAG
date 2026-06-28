package com.v76.gems.orchestrator;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Component;
import org.apache.skywalking.apm.toolkit.trace.ActiveSpan;

@Component
public class TextGenerationClient {
    private static final Logger log = LoggerFactory.getLogger(TextGenerationClient.class);
    private final ChatModel chatModel;

    public TextGenerationClient(ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    public reactor.core.publisher.Flux<org.springframework.ai.chat.model.ChatResponse> stream(String promptText) {
        log.info("Requesting streaming completion from ChatModel (prompt length: {} characters)", promptText != null ? promptText.length() : 0);
        return chatModel.stream(new org.springframework.ai.chat.prompt.Prompt(promptText))
                .onErrorResume(e -> {
                    log.error("Error occurred during text generation stream", e);
                    return reactor.core.publisher.Flux.error(e);
                });
    }

    public String complete(String promptText) {
        log.info("Requesting blocking completion from ChatModel (prompt length: {} characters)", promptText != null ? promptText.length() : 0);
        long startTime = System.currentTimeMillis();
        ChatResponse response;
        try {
            response = chatModel.call(new Prompt(promptText));
        } catch (Exception e) {
            log.error("Failed to complete prompt via generative AI model", e);
            throw e;
        }
        long duration = System.currentTimeMillis() - startTime;

        ActiveSpan.tag("llm.time_ms", String.valueOf(duration));
        if (response != null && response.getMetadata() != null && response.getMetadata().getUsage() != null) {
            var usage = response.getMetadata().getUsage();
            Integer promptTokens = usage.getPromptTokens();
            Integer generationTokens = usage.getCompletionTokens();
            Integer totalTokens = usage.getTotalTokens();

            log.info("Blocking completion successful in {} ms. Tokens used: [Prompt: {}, Generation: {}, Total: {}]", 
                    duration, promptTokens, generationTokens, totalTokens);

            ActiveSpan.tag("token.usage.prompt", String.valueOf(promptTokens != null ? promptTokens : 0));
            ActiveSpan.tag("token.usage.completion", String.valueOf(generationTokens != null ? generationTokens : 0));
            ActiveSpan.tag("token.usage.total", String.valueOf(totalTokens != null ? totalTokens : 0));

            // Estimate cost: e.g. $2.50 per 1M input, $10.00 per 1M output tokens (standard pricing estimate)
            double cost = 0.0;
            if (promptTokens != null) cost += (promptTokens * 0.0000025);
            if (generationTokens != null) cost += (generationTokens * 0.00001);
            ActiveSpan.tag("llm.cost_usd", String.format("%.6f", cost));
        } else {
            log.info("Blocking completion successful in {} ms (no token metadata returned)", duration);
        }

        return response != null && response.getResult() != null ? response.getResult().getOutput().getText() : "";
    }
}
