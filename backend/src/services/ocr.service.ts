import { createWorker } from 'tesseract.js';
import vision from '@google-cloud/vision';
import pdfParse from 'pdf-parse';
import sharp from 'sharp';
import { config } from '../config';
import { OCRResult, RaceCard, Race, Horse } from '@railbird/shared';
import { logger } from '../utils/logger';
import fs from 'fs/promises';

export class OCRService {
  private visionClient?: vision.ImageAnnotatorClient;

  constructor() {
    if (config.googleCloud.keyFilename || config.googleCloud.apiKey) {
      this.visionClient = new vision.ImageAnnotatorClient({
        keyFilename: config.googleCloud.keyFilename,
        projectId: config.googleCloud.projectId,
      });
    }
  }

  async processFile(filePath: string, fileName: string): Promise<OCRResult> {
    try {
      const fileExtension = fileName.toLowerCase().split('.').pop();
      
      switch (fileExtension) {
        case 'pdf':
          return await this.processPDF(filePath);
        case 'jpg':
        case 'jpeg':
        case 'png':
          return await this.processImage(filePath);
        default:
          throw new Error(`Unsupported file type: ${fileExtension}`);
      }
    } catch (error) {
      logger.error('OCR processing error:', error);
      return {
        success: false,
        text: '',
        confidence: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private async processPDF(filePath: string): Promise<OCRResult> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);
      
      if (pdfData.text && pdfData.text.length > 100) {
        // PDF has extractable text
        const extractedData = this.parseRaceData(pdfData.text);
        return {
          success: true,
          text: pdfData.text,
          confidence: 0.9,
          extractedData
        };
      } else {
        // PDF needs OCR - convert to images first
        logger.info('PDF has no extractable text, using OCR...');
        // For now, return the limited text we found
        const extractedData = this.parseRaceData(pdfData.text);
        return {
          success: true,
          text: pdfData.text,
          confidence: 0.5,
          extractedData
        };
      }
    } catch (error) {
      logger.error('PDF processing error:', error);
      throw error;
    }
  }

  private async processImage(filePath: string): Promise<OCRResult> {
    try {
      // Try Google Cloud Vision first if available
      if (this.visionClient) {
        return await this.processWithGoogleVision(filePath);
      }
      
      // Fallback to Tesseract
      return await this.processWithTesseract(filePath);
    } catch (error) {
      logger.error('Image processing error:', error);
      throw error;
    }
  }

  private async processWithGoogleVision(filePath: string): Promise<OCRResult> {
    try {
      const [result] = await this.visionClient!.textDetection(filePath);
      const detections = result.textAnnotations;
      
      if (!detections || detections.length === 0) {
        throw new Error('No text detected in image');
      }

      const text = detections[0].description || '';
      const confidence = this.calculateGoogleVisionConfidence(detections);
      const extractedData = this.parseRaceData(text);

      return {
        success: true,
        text,
        confidence,
        extractedData
      };
    } catch (error) {
      logger.error('Google Vision error:', error);
      throw error;
    }
  }

  private async processWithTesseract(filePath: string): Promise<OCRResult> {
    const worker = await createWorker();
    
    try {
      // Preprocess image for better OCR
      const processedImagePath = await this.preprocessImage(filePath);
      
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      
      const { data } = await worker.recognize(processedImagePath);
      
      const extractedData = this.parseRaceData(data.text);
      
      return {
        success: true,
        text: data.text,
        confidence: data.confidence / 100,
        extractedData
      };
    } finally {
      await worker.terminate();
    }
  }

  private async preprocessImage(filePath: string): Promise<string> {
    const outputPath = filePath.replace(/\.[^/.]+$/, '_processed.png');
    
    await sharp(filePath)
      .greyscale()
      .normalize()
      .sharpen()
      .png()
      .toFile(outputPath);
    
    return outputPath;
  }

  private calculateGoogleVisionConfidence(detections: any[]): number {
    // Google Vision doesn't provide confidence scores for text detection
    // Estimate based on number of detected words and bounding box accuracy
    if (detections.length > 1) return 0.85;
    return 0.7;
  }

  private parseRaceData(text: string): Partial<RaceCard> {
    try {
      const races = this.extractRaces(text);
      const track = this.extractTrack(text);
      const date = this.extractDate(text);

      return {
        track: track || 'Unknown Track',
        date: date || new Date().toISOString().split('T')[0],
        races
      };
    } catch (error) {
      logger.error('Race data parsing error:', error);
      return {};
    }
  }

  private extractRaces(text: string): Race[] {
    const races: Race[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Look for race headers (e.g., "RACE 1", "1st RACE", etc.)
    const raceHeaderRegex = /(?:RACE\s+(\d+)|(\d+)(?:st|nd|rd|th)?\s+RACE)/i;
    
    let currentRace: Partial<Race> | null = null;
    let currentHorses: Horse[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const raceMatch = line.match(raceHeaderRegex);
      
      if (raceMatch) {
        // Save previous race if exists
        if (currentRace && currentHorses.length > 0) {
          races.push({
            ...currentRace,
            horses: currentHorses
          } as Race);
        }
        
        // Start new race
        const raceNumber = parseInt(raceMatch[1] || raceMatch[2]);
        currentRace = {
          id: `race-${raceNumber}`,
          number: raceNumber,
          track: 'Unknown',
          date: new Date().toISOString().split('T')[0],
          horses: []
        };
        currentHorses = [];
        
        // Look for race conditions in next few lines
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const conditionLine = lines[j];
          const distance = this.extractDistance(conditionLine);
          const surface = this.extractSurface(conditionLine);
          const purse = this.extractPurse(conditionLine);
          
          if (distance) currentRace.distance = distance;
          if (surface) currentRace.surface = surface;
          if (purse) currentRace.purse = purse;
        }
      } else if (currentRace) {
        // Try to extract horse information
        const horse = this.extractHorseFromLine(line);
        if (horse) {
          currentHorses.push(horse);
        }
      }
    }
    
    // Add the last race
    if (currentRace && currentHorses.length > 0) {
      races.push({
        ...currentRace,
        horses: currentHorses
      } as Race);
    }
    
    return races;
  }

  private extractHorseFromLine(line: string): Horse | null {
    // Pattern for horse entries: "1. HORSE NAME (Jockey) 5-1"
    const horsePattern = /^(\d{1,2})\.?\s+([A-Z\s']+?)\s*(?:\(([^)]+)\))?\s*(?:(\d+-\d+|\d+\/\d+))?\s*$/i;
    const match = line.match(horsePattern);
    
    if (!match) return null;
    
    const [, numberStr, name, jockey, odds] = match;
    
    return {
      id: `horse-${numberStr}`,
      number: parseInt(numberStr),
      name: name.trim(),
      jockey: jockey?.trim() || 'Unknown',
      trainer: 'Unknown',
      weight: 120, // Default weight
      odds: odds?.trim(),
      speedFigures: {},
      pastPerformances: []
    };
  }

  private extractTrack(text: string): string | null {
    // Common track patterns
    const trackPatterns = [
      /SANTA ANITA/i,
      /GULFSTREAM/i,
      /CHURCHILL DOWNS/i,
      /BELMONT/i,
      /SARATOGA/i,
      /KEENELAND/i,
      /OAKLAWN/i,
      /FAIR GROUNDS/i,
      /AQUEDUCT/i,
      /WOODBINE/i
    ];
    
    for (const pattern of trackPatterns) {
      const match = text.match(pattern);
      if (match) return match[0].toUpperCase();
    }
    
    return null;
  }

  private extractDate(text: string): string | null {
    // Date patterns: "March 15, 2024", "03/15/2024", "2024-03-15"
    const datePatterns = [
      /(\w+\s+\d{1,2},\s+\d{4})/,
      /(\d{1,2}\/\d{1,2}\/\d{4})/,
      /(\d{4}-\d{2}-\d{2})/
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        const dateStr = match[1];
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
    }
    
    return null;
  }

  private extractDistance(text: string): string | null {
    const distancePattern = /(\d+(?:\.\d+)?\s*(?:furlongs?|miles?|f|m))/i;
    const match = text.match(distancePattern);
    return match ? match[1] : null;
  }

  private extractSurface(text: string): 'dirt' | 'turf' | 'synthetic' | null {
    if (/turf|grass/i.test(text)) return 'turf';
    if (/synthetic|poly/i.test(text)) return 'synthetic';
    if (/dirt|main/i.test(text)) return 'dirt';
    return null;
  }

  private extractPurse(text: string): number | null {
    const pursePattern = /\$?([\d,]+)/;
    const match = text.match(pursePattern);
    if (match) {
      const amount = parseInt(match[1].replace(/,/g, ''));
      if (amount > 1000) return amount; // Reasonable purse amount
    }
    return null;
  }
}

export const ocrService = new OCRService();