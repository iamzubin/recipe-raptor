"use server"
import { HfInference } from "@huggingface/inference";

export async function detectIngredientsFromImageApi(formData: FormData): Promise<string[]> {
    const bearerToken = process.env.BEARER_TOKEN;
    const inference = new HfInference(bearerToken);

    const base64Image = formData.get('image');
    const context = formData.get('context');

    if (typeof base64Image !== 'string') {
        throw new Error('The image data must be a base64 string.');
    }

    if (typeof context !== 'string') {
        throw new Error('The context must be a string.');
    }

    // Convert base64 to Blob
    const byteCharacters = atob(base64Image.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {type: 'image/jpeg'});

    const response = await fetch("https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-11B-Vision-Instruct/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${bearerToken}`
        },
        body: JSON.stringify({
            model: "meta-llama/Llama-3.2-11B-Vision-Instruct",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Only output the ingredients in the photo, comma separated, write nothing else.`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: base64Image
                            }
                        }
                    ]
                }
            ]
        })
    });

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