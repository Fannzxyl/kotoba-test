import Tesseract from 'tesseract.js';

export interface OCRResult {
    text: string;
    confidence: number;
}

export const recognizeText = async (image: File | string, onProgress?: (progress: number) => void): Promise<OCRResult> => {
    try {
        const result = await Tesseract.recognize(
            image,
            'jpn+eng', // Japanese and English
            {
                logger: (m) => {
                    if (m.status === 'recognizing text' && onProgress) {
                        onProgress(Math.round(m.progress * 100));
                    }
                },
            }
        );

        return {
            text: result.data.text,
            confidence: result.data.confidence,
        };
    } catch (error) {
        console.error('OCR Error:', error);
        throw new Error('Failed to recognize text from image.');
    }
};
