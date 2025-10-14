import { calculatePronunciationScore, generateFeedback, simulateTranscription } from './pronunciation';

describe('calculatePronunciationScore', () => {
  it('should return a high score (0.95) for identical strings', () => {
    expect(calculatePronunciationScore('مرحبا', 'مرحبا')).toBe(0.95);
  });

  it('should return a score based on Levenshtein similarity for different strings', () => {
    // 'مرحباً' vs 'مرحبا' -> 1 edit distance, length 5. Similarity = (5-1)/5 = 0.8
    expect(calculatePronunciationScore('مرحباً', 'مرحبا')).toBeCloseTo(0.8);
  });

  it('should return the minimum score (0.3) for very different strings', () => {
    // Similarity will be very low, so it should default to 0.3
    expect(calculatePronunciationScore('hello', 'مرحبا')).toBe(0.3);
  });

  it('should handle empty strings gracefully', () => {
    expect(calculatePronunciationScore('', '')).toBe(0.95);
    expect(calculatePronunciationScore('abc', '')).toBe(0.3);
  });
});

describe('generateFeedback', () => {
  it.each([
    [0.95, 'Excellent pronunciation! 🎉'],
    [0.9, 'Excellent pronunciation! 🎉'],
    [0.85, 'Very good! Small improvements possible. 👍'],
    [0.8, 'Very good! Small improvements possible. 👍'],
    [0.75, 'Good effort! Keep practicing. 😊'],
    [0.7, 'Good effort! Keep practicing. 😊'],
    [0.65, 'Not bad! Focus on clarity. 🤔'],
    [0.6, 'Not bad! Focus on clarity. 🤔'],
    [0.59, 'Keep trying! Listen to the pronunciation guide. 💪'],
    [0.3, 'Keep trying! Listen to the pronunciation guide. 💪'],
  ])('should return the correct feedback for a score of %f', (score, expectedFeedback) => {
    expect(generateFeedback(score)).toBe(expectedFeedback);
  });
});

describe('simulateTranscription', () => {
  it('should return a valid transcription object structure', () => {
    const result = simulateTranscription('شكرا');
    expect(result).toHaveProperty('transcribed');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('phonemes');
    expect(typeof result.transcribed).toBe('string');
    expect(typeof result.confidence).toBe('number');
    expect(typeof result.phonemes).toBe('object');
  });

  it('should return a transcription from the known variations for "مرحبا"', () => {
    const variations = ['مرحبا', 'مرحباً', 'مرحبة'];
    const result = simulateTranscription('مرحبا');
    expect(variations).toContain(result.transcribed);
  });
});
