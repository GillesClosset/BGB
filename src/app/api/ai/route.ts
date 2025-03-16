import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { BoardGame } from '@/app/types';

// Store the base URL and path separately to ensure we're using the complete path
const AI_ENDPOINT_BASE = process.env.OVHCLOUD_AI_ENDPOINT_BASE || 'https://llama-3-3-70b-instruct.endpoints.kepler.ai.cloud.ovh.net';
const AI_ENDPOINT_PATH = '/api/openai_compat/v1/chat/completions';
const API_KEY = process.env.OVHCLOUD_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    console.log('Received request body:', body);
    
    const { boardGame } = body;
    
    // Validate board game data
    if (!boardGame) {
      console.error('Board game information is missing');
      return NextResponse.json(
        { error: 'Board game information is required' },
        { status: 400 }
      );
    }
    
    // Log the board game data for debugging
    console.log('Board game data:', boardGame);
    
    // Validate required fields with more detailed error messages
    if (!boardGame.id) {
      console.error('Board game ID is missing');
      return NextResponse.json(
        { error: 'Board game ID is required' },
        { status: 400 }
      );
    }
    
    if (!boardGame.name) {
      console.error('Board game name is missing');
      return NextResponse.json(
        { error: 'Board game name is required' },
        { status: 400 }
      );
    }
    
    // Create the prompt
    const prompt = createAIPrompt(boardGame);
    
    // Construct the full URL for the API call
    const fullUrl = `${AI_ENDPOINT_BASE}${AI_ENDPOINT_PATH}`;
    console.log('Sending request to AI endpoint with FULL URL:', fullUrl);
    
    // Create the request payload for chat completions
    const requestPayload = {
      model: null, // Important: Set to null, not a specific model name
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that provides music recommendations based on board game themes. You MUST respond with a single valid JSON object FOLLOWED BY a brief explanation of 2-3 sentences. The explanation must not be part of the JSON. First the JSON, then the explanation."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
      top_p: 1,
      // Remove stop sequences that might be causing premature termination
      stream: false
    };
    
    console.log('Request payload:', requestPayload);
    
    // Make a POST request with the correct format and FULL URL path explicitly defined
    const response = await axios.post(
      fullUrl, // Using the explicitly constructed full URL
      requestPayload,
      {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        }
      }
    );
    
    console.log('AI response received:', response.data);
    
    // Check if we have a valid response with choices
    if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
      console.error('Invalid response format from AI endpoint:', response.data);
      throw new Error('Invalid response format from AI endpoint');
    }
    
    // Parse the AI response - chat completions endpoint returns text in choices[0].message.content
    const aiResponse = parseAIResponse(response.data.choices[0].message.content, boardGame);
    
    return NextResponse.json(aiResponse);
  } catch (error: any) {
    console.error('Error in AI API route:', error);
    
    // Provide more detailed error information
    if (error.response) {
      console.error('Error response from AI endpoint:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      
      // Log the request configuration for debugging
      if (error.config) {
        console.error('Request configuration:', {
          url: error.config.url,
          method: error.config.method,
          baseURL: error.config.baseURL,
          headers: error.config.headers
        });
      }
    }
    
    // Return fallback response with default genres and audio features
    return NextResponse.json({
      genres: ['instrumental', 'soundtrack', 'ambient', 'electronic', 'classical'],
      explanation: "Fallback response due to API error. These genres provide a balanced soundtrack suitable for most board games."
    });
  }
}

/**
 * Create a prompt for the AI based on board game information
 */
function createAIPrompt(boardGame: BoardGame): string {
  return `
Generate music recommendations for a board game playlist with the following details:

BOARD GAME:
- Name: ${boardGame.name}
- Description: ${boardGame.description.substring(0, 900)}...
- Categories: ${boardGame.categories.join(', ')}
- Mechanics: ${boardGame.mechanics.join(', ')}

Please provide:
1. The best 5 Spotify music genres that would match this board game's theme and gameplay
2. 5 keywords or phrases (can be multi-word like "Epic Orchestral" or "Viking Metal") for searching music that matches this game

CRITICAL INSTRUCTIONS - FOLLOW EXACTLY:
1. FIRST provide a single valid JSON object with the structure shown below
2. THEN provide 2-3 sentences explaining your choices. You should not mention the JSON in your explanation, nor "search" or "keywords". Instead, explain your choices in terms of the board game's theme and gameplay, or your "recommendations" or "suggestions".
3. DO NOT include any text, examples, or self-dialogue before the JSON
4. DO NOT include multiple JSON objects or code blocks
5. DO NOT ask questions or seek confirmation

JSON FORMAT:
{
  "genres": ["genre1", "genre2", "genre3", "genre4", "genre5"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}
`;
}

/**
 * Parse the AI response into a structured format
 */
function parseAIResponse(responseText: string, boardGame?: BoardGame): any {
  try {
    console.log('Parsing AI response text:', responseText);
    
    // First, try to extract the first JSON object in the response
    // This regex looks for the first complete JSON object with proper structure
    const jsonRegex = /\{[\s\S]*?("genres"\s*:\s*\[[\s\S]*?\]|"keywords"\s*:\s*\[[\s\S]*?\])[\s\S]*?\}/;
    const jsonMatch = responseText.match(jsonRegex);
    
    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[0]);
        console.log('Successfully extracted JSON data:', jsonData);
        
        // Extract explanation if it exists after the JSON
        let explanation = extractExplanation(responseText, jsonMatch[0]);
        console.log('Extracted explanation:', explanation);
        
        // If no explanation was found, generate a default one based on the board game
        if (!explanation && boardGame) {
          explanation = `These genre and keyword recommendations are chosen to match the ${boardGame.categories.join(', ')} themes in ${boardGame.name}, creating an atmosphere that enhances the gameplay experience.`;
        } else if (!explanation) {
          explanation = "These genres and keywords were selected to create an immersive atmosphere that complements the board game's theme and mechanics.";
        }
        
        return {
          genres: jsonData.genres || [],
          keywords: jsonData.keywords || [],
          explanation: explanation
        };
      } catch (jsonError) {
        console.error('Error parsing extracted JSON:', jsonError);
        console.log('Extracted text that failed to parse:', jsonMatch[0]);
      }
    }
    
    // If JSON parsing fails, try to extract genres and explanation separately
    console.log('JSON match not found or invalid, using fallback extraction');
    const genres = extractGenres(responseText);
    const explanation = extractExplanation(responseText, "");
    
    return {
      genres: genres,
      keywords: [],
      explanation: explanation
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    
    return {
      genres: ['instrumental', 'soundtrack', 'ambient', 'electronic', 'classical'],
      keywords: ['board game music', 'tabletop soundtrack', 'game night ambiance', 'strategic background', 'immersive soundtrack'],
      explanation: "Fallback response due to parsing error. These genres provide a balanced soundtrack suitable for most board games."
    };
  }
}

/**
 * Extract genres from text if JSON parsing fails
 */
function extractGenres(text: string): string[] {
  // Try to find genres in various formats
  const genrePatterns = [
    /genres?["\s:]*\[(.*?)\]/i,  // Look for "genres": ["genre1", "genre2", ...]
    /genres?:?\s*([^.]*)/i       // Look for genres: genre1, genre2, ...
  ];
  
  for (const pattern of genrePatterns) {
    const genreMatches = text.match(pattern);
    if (genreMatches && genreMatches[1]) {
      // Clean up the extracted genres
      return genreMatches[1]
        .replace(/"/g, '')  // Remove quotes
        .split(/,|\n/)      // Split by comma or newline
        .map(genre => genre.trim())
        .filter(Boolean)
        .slice(0, 5);       // Limit to 5 genres
    }
  }
  
  return ['instrumental', 'soundtrack', 'ambient', 'electronic', 'classical'];
}

/**
 * Extract explanation from text
 */
function extractExplanation(text: string, jsonString: string): string {
  // If we have a JSON string, look for text after it
  if (jsonString) {
    const jsonEndIndex = text.indexOf(jsonString) + jsonString.length;
    if (jsonEndIndex < text.length) {
      let explanationText = text.substring(jsonEndIndex).trim();
      
      // Clean up the explanation - remove code blocks, quotes, etc.
      explanationText = explanationText
        .replace(/```(?:json)?[\s\S]*?```/g, '') // Remove code blocks
        .replace(/^["\s,.]+|["\s,.]+$/g, '')     // Trim quotes, spaces, commas, periods
        .replace(/However[\s\S]*?valid response[\s\S]*?requirements:/i, '') // Remove self-dialogue
        .replace(/Here is the valid response[\s\S]*?requirements:/i, '')
        .replace(/I need a confirmation[\s\S]*?not\./i, '')
        .replace(/Please confirm[\s\S]*?gameplay\./i, '')
        .trim();
      
      // If the explanation is too long, truncate it
      if (explanationText.length > 1000) {
        explanationText = explanationText.substring(0, 997) + '...';
      }
      
      return explanationText;
    }
  }
  
  // If no JSON string or no text after JSON, try to find explanation-like text
  const explanationPatterns = [
    /(?:These genres|The music genres|These recommendations|The chosen genres)([\s\S]*?)(?:$|```)/i,
    /(?:explanation|reasoning|rationale):([\s\S]*?)(?:$|```)/i
  ];
  
  for (const pattern of explanationPatterns) {
    const explanationMatch = text.match(pattern);
    if (explanationMatch && explanationMatch[1]) {
      let explanation = explanationMatch[1].trim();
      
      // If the explanation is too long, truncate it
      if (explanation.length > 1000) {
        explanation = explanation.substring(0, 997) + '...';
      }
      
      return explanation;
    }
  }
  
  return '';
} 