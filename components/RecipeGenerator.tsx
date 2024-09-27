'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { detectIngredientsFromImageApi, generateRecipe as generateRecipeApi } from "@/lib/service"
import { PlusIcon, XIcon } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'

// Mocking API calls
const detectIngredientsFromImage = async (image: File, context: string): Promise<string[]> => {
  // Create a FormData object to hold the image and context

  function convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
  }

  const formData = new FormData();
  const base64Image = await convertToBase64(image); // Await the promise
  formData.append('image', base64Image); // Append the image file
  formData.append('context', context); // Append the context as a string

  // Simulating API call delay
  const response = await detectIngredientsFromImageApi(formData); // Pass FormData to the API

  console.log(response);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return response;
}

export default function RecipeGenerator() {
  const [images, setImages] = useState<File[]>([])
  const [ingredients, setIngredients] = useState<string[]>([])
  const [newIngredient, setNewIngredient] = useState('')
  const [recipe, setRecipe] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [cookingMethod, setCookingMethod] = useState('stove')
  const [cookingTime, setCookingTime] = useState(30)
  const [cookingMethods, setCookingMethods] = useState({
    stove: false,
    oven: false,
    microwave: false
  })

  const [cookingDifficulty, setCookingDifficulty] = useState('medium')
  const [cuisine, setCuisine] = useState('any')
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([])

  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [inputMessage, setInputMessage] = useState('')
  const [highlightedInput, setHighlightedInput] = useState('')

  useEffect(() => {
    return () => {
      imageUrls.forEach(URL.revokeObjectURL);
    };
  }, [imageUrls]);

  const handleImageUpload = useCallback(async (files: File[]) => {
    setIsLoading(true)
    setImages(prevImages => [...prevImages, ...files])
    
    for (const file of files) {
      const detectedIngredients = await detectIngredientsFromImage(file, "context")
      setIngredients(prevIngredients => [...new Set([...prevIngredients, ...detectedIngredients])])
      
      const url = URL.createObjectURL(file);
      setImageUrls(prevUrls => [...prevUrls, url]);
    }
    
    setIsLoading(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      handleImageUpload(Array.from(e.dataTransfer.files))
    }
  }, [handleImageUpload])

  const addIngredient = () => {
    if (newIngredient) {
      const ingredientsToAdd = newIngredient.split(',').map(i => i.trim()).filter(i => i && !ingredients.includes(i));
      setIngredients(prevIngredients => [...new Set([...prevIngredients, ...ingredientsToAdd])]);
      setNewIngredient('');
    }
  }

  const removeIngredient = (ingredientToRemove: string) => {
    setIngredients(ingredients.filter(ingredient => ingredient !== ingredientToRemove))
  }

  const toggleCookingMethod = (method: 'stove' | 'oven' | 'microwave') => {
    setCookingMethods(prev => ({ ...prev, [method]: !prev[method] }))
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Remove the check for empty input
    setMessages(prevMessages => [...prevMessages, { role: 'user', content: inputMessage }])
    setInputMessage('')
    setIsLoading(true)

    try {
      console.log(ingredients, messages, {
        cookingMethods: Object.entries(cookingMethods).filter(([_, value]) => value).map(([key]) => key),
        cookingTime,
        cookingDifficulty,
        cuisine,
        dietaryRestrictions
      })
      const generatedRecipe = await generateRecipeApi(ingredients,  [...messages, { role: 'user', content: inputMessage }], {
        cookingMethods: Object.entries(cookingMethods).filter(([_, value]) => value).map(([key]) => key),
        cookingTime,
        cookingDifficulty,
        cuisine,
        dietaryRestrictions
      })
      setRecipe(generatedRecipe)
      setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: generatedRecipe }])
    } catch (error) {
      console.error('Error generating recipe:', error)
      setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: 'Sorry, there was an error generating the recipe.' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Recipe Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer"
          >
            <Label htmlFor="image-upload">Upload or Drop Refrigerator Image</Label>
            <div className="mt-1 flex items-center justify-center space-x-4">
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => e.target.files && handleImageUpload(Array.from(e.target.files))}
                className="hidden"
              />
              {images.length > 0 && <span className="text-sm text-gray-500">{images[0].name}</span>}
            </div>
          </div>

          {imageUrls.length > 0 && (
            <div>
              <h3>Uploaded Images:</h3>
              <div className="flex flex-wrap gap-2">
                {imageUrls.map((url, index) => (
                  <Image
                    key={index}
                    src={url}
                    alt={`Uploaded ingredient ${index + 1}`}
                    width={100}
                    height={100}
                    style={{ objectFit: 'cover' }}
                  />
                ))}
              </div>
            </div>
          )}

          {ingredients.length > 0 && (
            <div>
              <Label>Detected Ingredients</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {ingredients.map((ingredient, index) => (
                  <span key={index} className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-sm flex items-center">
                    {ingredient}
                    <button onClick={() => removeIngredient(ingredient)} className="ml-2 text-primary-foreground hover:text-red-500">
                      <XIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="new-ingredient">Add Ingredient(s)</Label>
            <div className="flex mt-1">
              <Input
                id="new-ingredient"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                className="flex-grow"
                placeholder="Enter ingredient(s), separated by commas"
              />
              <Button onClick={addIngredient} className="ml-2">
                <PlusIcon className="h-4 w-4" />
                Add
              </Button>
            </div>
          </div>

          <div>
            <Label>Cooking Methods</Label>
            <div className="flex space-x-4 mt-1">
              {['stove', 'oven', 'microwave'].map((method) => (
                <div key={method} className="flex items-center">
                  <Checkbox
                    id={`cooking-method-${method}`}
                    checked={cookingMethods[method as keyof typeof cookingMethods]}
                    onCheckedChange={() => toggleCookingMethod(method as keyof typeof cookingMethods)}
                  />
                  <Label htmlFor={`cooking-method-${method}`} className="ml-2">
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="cooking-time">Cooking Time (minutes)</Label>
            <Slider
              id="cooking-time"
              min={5}
              max={120}
              step={5}
              value={[cookingTime]}
              onValueChange={(value) => setCookingTime(value[0])}
            />
            <span className="text-sm text-gray-500">{cookingTime} minutes</span>
          </div>

          {/* New options */}
          <div>
            <Label htmlFor="cooking-difficulty">Cooking Difficulty</Label>
            <select
              id="cooking-difficulty"
              value={cookingDifficulty}
              onChange={(e) => setCookingDifficulty(e.target.value)}
              className="w-full mt-1 p-2 border rounded"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <Label htmlFor="cuisine">Cuisine</Label>
            <select
              id="cuisine"
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className="w-full mt-1 p-2 border rounded"
            >
              <option value="any">Any</option>
              <option value="italian">Italian</option>
              <option value="mexican">Mexican</option>
              <option value="chinese">Chinese</option>
              <option value="indian">Indian</option>
              {/* Add more cuisine options as needed */}
            </select>
          </div>

          <div>
            <Label>Dietary Restrictions</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free'].map((restriction) => (
                <div key={restriction} className="flex items-center">
                  <Checkbox
                    id={`dietary-${restriction}`}
                    checked={dietaryRestrictions.includes(restriction)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setDietaryRestrictions(prev => [...prev, restriction])
                      } else {
                        setDietaryRestrictions(prev => prev.filter(r => r !== restriction))
                      }
                    }}
                  />
                  <Label htmlFor={`dietary-${restriction}`} className="ml-2">
                    {restriction.charAt(0).toUpperCase() + restriction.slice(1)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Highlighted user input */}
          {highlightedInput && (
            <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded">
              <h2 className="font-bold mb-2">User Input:</h2>
              <p>{highlightedInput}</p>
            </div>
          )}

          {/* Chat messages */}
          <div className="mb-4 space-y-2">
            {messages.map((message, index) => (
              <div key={index} className={`p-2 rounded ${message.role === 'user' ? 'bg-blue-100 text-right' : 'bg-gray-100'}`}>
                              <pre className="mt-1 p-4 bg-gray-100 rounded-md whitespace-pre-wrap overflow-x-auto">
                {message.content}
              </pre>

              </div>
            ))}
          </div>
          {isLoading && <div className="text-center">Loading...</div>}

          {/* Chat input */}
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about the recipe or request modifications..."
              className="flex-grow"
            />
            <Button type="submit">Send</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}