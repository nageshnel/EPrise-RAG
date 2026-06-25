package com.v76.gems.orchestrator;

import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Component;
import org.apache.skywalking.apm.toolkit.trace.ActiveSpan;

@Component
public class TextGenerationClient {
    private final ChatModel chatModel;

    public TextGenerationClient(ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    public String complete(String promptText) {
        long startTime = System.currentTimeMillis();
        ChatResponse response = chatModel.call(new Prompt(promptText));
        long duration = System.currentTimeMillis() - startTime;

        ActiveSpan.tag("llm.time_ms", String.valueOf(duration));
        if (response != null && response.getMetadata() != null && response.getMetadata().getUsage() != null) {
            var usage = response.getMetadata().getUsage();
            Integer promptTokens = usage.getPromptTokens();
            Integer generationTokens = usage.getCompletionTokens();
            Integer totalTokens = usage.getTotalTokens();

            ActiveSpan.tag("token.usage.prompt", String.valueOf(promptTokens != null ? promptTokens : 0));
            ActiveSpan.tag("token.usage.completion", String.valueOf(generationTokens != null ? generationTokens : 0));
            ActiveSpan.tag("token.usage.total", String.valueOf(totalTokens != null ? totalTokens : 0));

            // Estimate cost: e.g. $2.50 per 1M input, $10.00 per 1M output tokens (standard pricing estimate)
            double cost = 0.0;
            if (promptTokens != null) cost += (promptTokens * 0.0000025);
            if (generationTokens != null) cost += (generationTokens * 0.00001);
            ActiveSpan.tag("llm.cost_usd", String.format("%.6f", cost));
        }

        return response != null && response.getResult() != null ? response.getResult().getOutput().getText() : "";
    }
}
