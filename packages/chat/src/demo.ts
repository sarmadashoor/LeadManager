// packages/chat/src/demo.ts

import * as dotenv from 'dotenv';
dotenv.config();

import { AIService } from './ai/AIService';

async function demo() {
  console.log('🚀 AI Provider Demo\n');
  
  // Create AI service (will use env vars)
  const aiService = new AIService();
  
  // Test context
  const context = {
    customer: {
      name: 'Sarah Johnson',
      vehicle: '2023 Tesla Model 3'
    },
    services: [
      {
        name: 'Premium Tint Package',
        price: 300,
        description: 'Carbon tint for all windows'
      },
      {
        name: 'Supreme Tint Package',
        price: 450,
        description: 'Ceramic tint for all windows'
      }
    ],
    conversationHistory: []
  };
  
  // Generate response
  console.log('📝 User: "How much for ceramic tint?"\n');
  
  try {
    const response = await aiService.generateResponse(
      context,
      'How much for ceramic tint?'
    );
    
    console.log(`🤖 AI (${response.provider}):`);
    console.log(response.content);
    console.log('\n📊 Metadata:');
    console.log(`- Tokens: ${response.metadata.tokens_used.total}`);
    console.log(`- Latency: ${response.metadata.latency_ms}ms`);
    console.log(`- Model: ${response.metadata.model}`);
    
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
  }
  
  // Health check
  console.log('\n🏥 Health Check:');
  const health = await aiService.checkHealth();
  console.log(health);
}

demo();