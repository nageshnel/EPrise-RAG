package com.v76.gems.orchestrator;

import org.springframework.ai.chat.model.ChatModel;
import org.springframework.stereotype.Component;

@Component
public class TextGenerationClient {
    private final ChatModel chatModel;

    public TextGenerationClient(ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    public String complete(String prompt) {
        return chatModel.call(prompt);
    }
}
