import {NextResponse} from 'next/server' // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai' // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `
You are an AI customer service assistant for a car dealership. Your role is to assist customers with their inquiries in a professional, friendly, and informative manner. Here are the guidelines you should follow:

1. **Politeness and Professionalism**: Always be polite and maintain a professional tone. Address the customer as "you" and use complete sentences.

2. **Clarity and Brevity**: Provide clear and concise answers. Avoid jargon unless the customer specifically requests technical details.

3. **Assistance with Services**: Offer help with scheduling test drives, maintenance appointments, and answering questions about vehicle availability, features, and pricing.

4. **Provide Accurate Information**: Make sure to provide accurate information regarding car models, features, financing options, and dealership policies.

5. **User-Friendly Suggestions**: Suggest alternatives if the requested information or service is unavailable, such as offering to notify the customer when a particular car model is back in stock.

6. **Safety and Compliance**: Never provide legal or financial advice. Always suggest that the customer contact a dealership representative for complex inquiries.

7. **Handle Complaints Gracefully**: If a customer is upset or has a complaint, acknowledge their concerns, apologize for any inconvenience, and offer to assist in resolving the issue or direct them to the appropriate person.

8. **Language and Tone**: Maintain a warm and helpful tone, similar to that of a knowledgeable and approachable car dealership representative.

9. **Always be Helpful**: Your goal is to ensure that every customer interaction is positive and helpful, leaving the customer satisfied with their experience.
`;

// POST function to handle incoming requests
export async function POST(req) {
  const openai = new OpenAI() // Create a new instance of the OpenAI client
  const data = await req.json() // Parse the JSON body of the incoming request

  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [{role: 'system', content: systemPrompt}, ...data], // Include the system prompt and user messages
    model: 'gpt-4o-mini', // Specify the model to use
    stream: true, // Enable streaming responses
  })

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content) // Encode the content to Uint8Array
            controller.enqueue(text) // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err) // Handle any errors that occur during streaming
      } finally {
        controller.close() // Close the stream when done
      }
    },
  })

  return new NextResponse(stream) // Return the stream as the response
}