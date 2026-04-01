package com.hh.finance.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "hh.ai")
public class AiProperties {

    private String openaiApiKey = "";
    private String model = "gpt-4o-mini";

    public String getOpenaiApiKey() {
        return openaiApiKey;
    }

    public void setOpenaiApiKey(String openaiApiKey) {
        this.openaiApiKey = openaiApiKey;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public boolean hasOpenAiKey() {
        return openaiApiKey != null && !openaiApiKey.isBlank();
    }
}
