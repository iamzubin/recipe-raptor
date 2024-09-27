'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CameraIcon, PlusIcon, CookingPotIcon, XIcon } from 'lucide-react'
import { detectIngredientsFromImageApi } from '@/lib/service'
import Image from 'next/image';

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

const generateRecipe = async (ingredients: string[]): Promise<string> => {
  // Simulating API call delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  return `Recipe: ${ingredients.join(', ')} omelette\n\n1. Beat the eggs with milk\n2. Add cheese\n3. Cook in a pan\n4. Add sliced tomatoes on top`
}

export default function RecipeGenerator() {
  const [images, setImages] = useState<File[]>([])
  const [ingredients, setIngredients] = useState<string[]>([])
  const [newIngredient, setNewIngredient] = useState('')
  const [recipe, setRecipe] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([]);

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
    if (newIngredient && !ingredients.includes(newIngredient)) {
      setIngredients([...ingredients, newIngredient])
      setNewIngredient('')
    }
  }

  const removeIngredient = (ingredientToRemove: string) => {
    setIngredients(ingredients.filter(ingredient => ingredient !== ingredientToRemove))
  }

  const handleGenerateRecipe = async () => {
    setIsLoading(true)
    const generatedRecipe = await generateRecipe(ingredients)
    setRecipe(generatedRecipe)
    setIsLoading(false)
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
            <Label htmlFor="new-ingredient">Add Ingredient</Label>
            <div className="mt-1 flex space-x-2">
              <Input
                id="new-ingredient"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                placeholder="Enter an ingredient"
              />
              <Button onClick={addIngredient}>
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button onClick={handleGenerateRecipe} disabled={ingredients.length === 0 || isLoading} className="w-full">
            <CookingPotIcon className="mr-2 h-4 w-4" />
            Generate Recipe
          </Button>

          {recipe && (
            <div>
              <Label>Generated Recipe</Label>
              <Textarea value={recipe} readOnly className="mt-1 h-40" />
            </div>
          )}

          {isLoading && <div className="text-center">Loading...</div>}

          {/* Removed the imageUrls section from here */}
        </CardContent>
      </Card>
    </div>
  )
}