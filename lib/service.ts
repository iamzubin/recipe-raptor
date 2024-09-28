"use server"

export async function detectIngredientsFromImageApi(formData: FormData): Promise<string[]> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error('OpenAI API key is not set');
    }

    const base64Image = formData.get('image');

    if (typeof base64Image !== 'string') {
        throw new Error('The image data must be a base64 string.');
    }

    const response = await fetch(
        "https://llama9587334652.openai.azure.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-02-15-preview",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": apiKey,
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "system",
                        content: [
                            {
                                type: "text",
                                text: "Only output the ingredients in the photo, comma separated, write nothing else.",
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Image}`,
                                },
                            },
                        ],
                    },
                ],
                temperature: 0.7,
                top_p: 0.95,
                max_tokens: 300,
            }),
        }
    );

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Split the content into an array of ingredients
    const ingredients = content.split(',').map((ingredient: string) => ingredient.trim());

    // Remove any empty strings and duplicates
    return Array.from(new Set(ingredients.filter(Boolean)));
}

export async function detectIngredientsFromImageApiOld(formData: FormData): Promise<string[]> {
    const bearerToken = process.env.BEARER_TOKEN;

    const base64Image = formData.get('image');
    const context = formData.get('context');

    if (typeof base64Image !== 'string') {
        throw new Error('The image data must be a base64 string.');
    }

    if (typeof context !== 'string') {
        throw new Error('The context must be a string.');
    }

    const response = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/Phi-3.5-vision-instruct",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${bearerToken}`,
        },
        body: JSON.stringify({
          model: "meta-llama/Llama-3.2-11B-Vision-Instruct",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Only output the ingredients in the photo, comma separated, write nothing else.`,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: base64Image,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let result = '';

    if (reader) {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            result += decoder.decode(value, { stream: true });
        }
    }

    // Parse the JSON response
    const jsonResponse = JSON.parse(result);

    // Extract the content from the response
    const content = jsonResponse.choices[0].message.content;

    // Split the content into an array of ingredients
    const ingredients = content.split(',').map((ingredient: string) => ingredient.trim());

    // Remove any empty strings and duplicates
    return Array.from(new Set(ingredients.filter(Boolean)));
}
export async function generateRecipe(ingredients: string[], messages: any[], options: {
  cookingMethods: string[],
  cookingTime: number,
  cookingDifficulty: string,
  cuisine: string,
  dietaryRestrictions: string[]
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log(apiKey);

  if (!apiKey) {
    throw new Error('OpenAI API key is not set');
  }

  const systemMessage = {
    role: "system",
    content: "You are a helpful assistant that generates recipes based on given ingredients and preferences."
  };

  const userMessage = {
    role: "user",
    content: `Generate a recipe using these ingredients: ${ingredients.join(', ')}. 
    Cooking methods: ${options.cookingMethods.join(', ')}. 
    Cooking time: ${options.cookingTime} minutes. 
    Difficulty: ${options.cookingDifficulty}. 
    Cuisine: ${options.cuisine}. 
    Dietary restrictions: ${options.dietaryRestrictions.join(', ')}. 
    Be creative and consider the previous conversation context.`
  };

  const allMessages = [systemMessage, ...messages, userMessage];
  console.log(allMessages);

  const response = await fetch('https://virtualwin11clovis.tail326aa5.ts.net:10000/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      "api-key": apiKey,
    },
    body: JSON.stringify({
      model: "llava:latest",
      messages: allMessages,
      temperature: 0.7,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}