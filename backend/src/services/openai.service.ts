import OpenAI from 'openai';
import { config } from '../config';
import { Race, Horse, ChatMessage, AnalysisInsight } from '@railbird/shared';
import { logger } from '../utils/logger';

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  async generateChatResponse(
    messages: ChatMessage[],
    raceData?: Race,
    context?: string
  ): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(raceData, context);
      
      const openaiMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      ];

      const completion = await this.client.chat.completions.create({
        model: config.openai.model,
        messages: openaiMessages,
        max_tokens: config.openai.maxTokens,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      return completion.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';
    } catch (error) {
      logger.error('OpenAI API error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async generateRaceAnalysis(race: Race): Promise<AnalysisInsight[]> {
    try {
      const prompt = this.buildAnalysisPrompt(race);
      
      const completion = await this.client.chat.completions.create({
        model: config.openai.model,
        messages: [{ role: 'system', content: prompt }],
        max_tokens: 1500,
        temperature: 0.5,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) throw new Error('No analysis generated');

      return this.parseAnalysisResponse(response, race);
    } catch (error) {
      logger.error('Race analysis error:', error);
      throw new Error('Failed to generate race analysis');
    }
  }

  private buildSystemPrompt(race?: Race, context?: string): string {
    let prompt = `You are an expert horse racing handicapper with decades of experience. You analyze races like a sharp bettor, focusing on pace, form, class, trainer patterns, and value plays. Your responses should sound like a conversation between two knowledgeable handicappers discussing a race.

Key principles:
- Always consider pace scenarios and how they affect each horse
- Look for class drops, trainer patterns, and form cycles
- Identify value plays and overlay situations
- Be conversational but insightful
- Use racing terminology naturally
- Point out both positives and negatives for horses
- Consider track bias and weather conditions

Response style:
- Conversational and engaging
- Use phrases like "I like", "That horse looks", "The pace sets up for"
- Be specific about why you like or dislike horses
- Mention specific past performances when relevant
- Keep responses focused but thorough`;

    if (race) {
      prompt += `\n\nCurrent Race Information:
Race ${race.number} at ${race.track} - ${race.date}
Distance: ${race.distance} on ${race.surface}
Condition: ${race.condition}
Purse: $${race.purse.toLocaleString()}

Horses in this race:`;

      race.horses.forEach(horse => {
        prompt += `\n${horse.number}. ${horse.name} - ${horse.jockey}/${horse.trainer}`;
        if (horse.morningLine) prompt += ` (ML: ${horse.morningLine})`;
        if (horse.speedFigures.beyer) prompt += ` Beyer: ${horse.speedFigures.beyer}`;
        
        // Add recent form
        if (horse.pastPerformances.length > 0) {
          const recent = horse.pastPerformances.slice(0, 3);
          prompt += `\nRecent: ${recent.map(pp => `${pp.finish}/${pp.track}/${pp.distance}`).join(', ')}`;
        }
      });

      if (race.paceScenario) {
        prompt += `\n\nPace Scenario: ${race.paceScenario}`;
      }
    }

    if (context) {
      prompt += `\n\nAdditional Context: ${context}`;
    }

    return prompt;
  }

  private buildAnalysisPrompt(race: Race): string {
    return `Analyze this horse race and provide structured insights. Return your analysis in this JSON format:

{
  "insights": [
    {
      "type": "pace|value|form|trainer|jockey|bias",
      "confidence": "high|medium|low",
      "summary": "Brief summary",
      "details": "Detailed explanation",
      "affectedHorses": [horse numbers]
    }
  ],
  "topPicks": {
    "win": [horse numbers in order],
    "place": [horse numbers],
    "show": [horse numbers]
  },
  "paceScenario": "Description of pace setup",
  "keyFactors": ["Factor 1", "Factor 2", "Factor 3"]
}

Race Data:
${JSON.stringify(race, null, 2)}

Provide expert handicapping analysis focusing on pace, class, form, and value.`;
  }

  private parseAnalysisResponse(response: string, race: Race): AnalysisInsight[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      const analysis = JSON.parse(jsonMatch[0]);
      return analysis.insights || [];
    } catch (error) {
      logger.error('Failed to parse analysis response:', error);
      
      // Fallback: create basic insights from text response
      return [{
        type: 'general',
        confidence: 'medium',
        summary: 'AI Analysis Generated',
        details: response,
        affectedHorses: race.horses.map(h => h.number)
      }];
    }
  }

  async generateQuickInsight(question: string, race: Race): Promise<string> {
    try {
      const prompt = `You're a sharp handicapper. Answer this question about the race concisely and expertly:

Question: ${question}

Race: ${race.number} at ${race.track}
${race.horses.map(h => `${h.number}. ${h.name} - ${h.jockey}`).join('\n')}

Give a direct, knowledgeable answer in 2-3 sentences.`;

      const completion = await this.client.chat.completions.create({
        model: config.openai.model,
        messages: [{ role: 'system', content: prompt }],
        max_tokens: 300,
        temperature: 0.6,
      });

      return completion.choices[0]?.message?.content || 'Unable to provide insight.';
    } catch (error) {
      logger.error('Quick insight error:', error);
      throw new Error('Failed to generate quick insight');
    }
  }
}

export const openaiService = new OpenAIService();