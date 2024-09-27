'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CameraIcon, PlusIcon, CookingPotIcon } from 'lucide-react'

// Mocking API calls
const detectIngredientsFromImage = async (image: File): Promise<string[]> => {
  // Simulating API call delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  return ['tomato', 'cheese', 'eggs', 'milk']
}

const generateRecipe = async (ingredients: string[]): Promise<string> => {
  // Simulating API call delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  return `Recipe: ${ingredients.join(', ')} omelette\n\n1. Beat the eggs with milk\n2. Add cheese\n3. Cook in a pan\n4. Add sliced tomatoes on top`
}

export default function RecipeGenerator() {
  const [image, setImage] = useState<File | null>(null)
  const [ingredients, setIngredients] = useState<string[]>([])
  const [newIngredient, setNewIngredient] = useState('')
  const [recipe, setRecipe] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsLoading(true)
      const file = e.target.files[0]
      setImage(file)
      const detectedIngredients = await detectIngredientsFromImage(file)
      setIngredients(detectedIngredients)
      setIsLoading(false)
    }
  }

  const addIngredient = () => {
    if (newIngredient && !ingredients.includes(newIngredient)) {
      setIngredients([...ingredients, newIngredient])
      setNewIngredient('')
    }
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
          <div>
            <Label htmlFor="image-upload">Upload Refrigerator Image</Label>
            <div className="mt-1 flex items-center space-x-4">
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button asChild>
                <label htmlFor="image-upload" className="cursor-pointer">
                  <CameraIcon className="mr-2 h-4 w-4" />
                  Upload Image
                </label>
              </Button>
              {image && <span className="text-sm text-gray-500">{image.name}</span>}
            </div>
          </div>

          {ingredients.length > 0 && (
            <div>
              <Label>Detected Ingredients</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {ingredients.map((ingredient, index) => (
                  <span key={index} className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-sm">
                    {ingredient}
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
        </CardContent>
      </Card>
    </div>
  )
}