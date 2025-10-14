// Utility functions for pronunciation analysis and simulation

/**
 * Simulates a transcription by picking a random variation of the expected text.
 * @param expectedText The text the user was prompted to say.
 * @returns A simulated transcription result.
 */
export function simulateTranscription(expectedText: string) {
    const variations: { [key: string]: string[] } = {
      'مرحبا': ['مرحبا', 'مرحبا', 'مرحباً', 'مرحبة'],
      'شكرا': ['شكرا', 'شكراً', 'شكرة'],
      'كيف الحال': ['كيف الحال', 'كيف الحالة', 'كيف حالك']
    };

    const possibleTranscriptions = variations[expectedText] || [expectedText];
    const randomTranscription = possibleTranscriptions[
      Math.floor(Math.random() * possibleTranscriptions.length)
    ];

    return {
      transcribed: randomTranscription,
      confidence: 0.85 + Math.random() * 0.1, // Random confidence 85-95%
      phonemes: generatePhonemeAnalysis(expectedText, randomTranscription)
    };
}

/**
 * Calculates a simple pronunciation score based on string similarity.
 * @param transcribed The transcribed text.
 * @param expected The expected text.
 * @returns A score between 0.3 and 1.0.
 */
export function calculatePronunciationScore(transcribed: string, expected: string): number {
    if (transcribed === expected) return 0.95;

    const similarity = calculateStringSimilarity(transcribed, expected);
    return Math.max(0.3, similarity);
}

/**
 * Generates feedback text based on a pronunciation score.
 * @param score The pronunciation score.
 * @returns A feedback string.
 */
export function generateFeedback(score: number): string {
    if (score >= 0.9) return 'Excellent pronunciation! 🎉';
    if (score >= 0.8) return 'Very good! Small improvements possible. 👍';
    if (score >= 0.7) return 'Good effort! Keep practicing. 😊';
    if (score >= 0.6) return 'Not bad! Focus on clarity. 🤔';
    return 'Keep trying! Listen to the pronunciation guide. 💪';
}

/**
 * Calculates string similarity using Levenshtein distance.
 * @param str1 First string.
 * @param str2 Second string.
 * @returns A similarity score between 0.0 and 1.0.
 */
function calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
}

/**
 * Generates a simplified phoneme analysis.
 * @param expected The expected text.
 * @param transcribed The transcribed text.
 * @returns A basic phoneme analysis object.
 */
function generatePhonemeAnalysis(expected: string, transcribed: string) {
    return {
      total_phonemes: expected.length,
      correct_phonemes: Math.floor(expected.length * calculateStringSimilarity(expected, transcribed)),
      problem_areas: transcribed !== expected ? ['vowel_sounds'] : []
    };
}

// Note: The levenshteinDistance function is kept private to this module as it's an implementation detail.
function levenshteinDistance(a: string, b: string): number {
    const matrix = Array.from({ length: b.length + 1 }, () => Array(a.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let i = 0; i <= b.length; i++) matrix[i][0] = i;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            const cost = a[j - 1] === b[i - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return matrix[b.length][a.length];
}
