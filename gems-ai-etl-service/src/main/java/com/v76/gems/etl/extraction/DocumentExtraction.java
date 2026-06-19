package com.v76.gems.etl.extraction;

import java.util.Map;

public record DocumentExtraction(String text, Map<String, Object> metadata) {
}
