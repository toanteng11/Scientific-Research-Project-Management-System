package com.researchsystem.backend.util;

import java.text.Normalizer;
import java.util.Locale;

/**
 * Computes normalized Levenshtein similarity:
 * Similarity(A,B) = 1 - (levenshteinDistance(A,B) / max(|A|,|B|))
 */
public final class LevenshteinSimilarity {

    private LevenshteinSimilarity() {}

    public static String normalizeForSimilarity(String input) {
        if (input == null) return "";

        // Normalize for lexical similarity:
        // - lowercase
        // - trim + collapse whitespace
        // - remove Vietnamese/Unicode diacritics
        String s = input.trim().toLowerCase(Locale.ROOT);
        s = Normalizer.normalize(s, Normalizer.Form.NFD);
        s = s.replaceAll("\\p{M}+", "");
        s = s.replaceAll("\\s+", " ");
        return s;
    }

    public static int levenshteinDistance(String a, String b) {
        if (a == null) a = "";
        if (b == null) b = "";

        int aLen = a.length();
        int bLen = b.length();

        // Fast-paths for empty strings
        if (aLen == 0) return bLen;
        if (bLen == 0) return aLen;

        // Memory-optimized DP: only keep previous row.
        int[] prev = new int[bLen + 1];
        int[] curr = new int[bLen + 1];

        for (int j = 0; j <= bLen; j++) {
            prev[j] = j;
        }

        for (int i = 1; i <= aLen; i++) {
            curr[0] = i;
            char ca = a.charAt(i - 1);

            for (int j = 1; j <= bLen; j++) {
                int cost = (ca == b.charAt(j - 1)) ? 0 : 1;
                curr[j] = Math.min(
                        Math.min(curr[j - 1] + 1, prev[j] + 1),
                        prev[j - 1] + cost
                );
            }

            int[] tmp = prev;
            prev = curr;
            curr = tmp;
        }

        return prev[bLen];
    }

    public static double normalizedSimilarity(String a, String b) {
        String na = normalizeForSimilarity(a);
        String nb = normalizeForSimilarity(b);

        int maxLen = Math.max(na.length(), nb.length());
        if (maxLen == 0) return 1.0d;

        int dist = levenshteinDistance(na, nb);
        return 1.0d - ((double) dist / (double) maxLen);
    }
}

