"use client"

import { Check, Plus, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import type { Category } from "./category-manager"

interface CategorySelectorProps {
  categories: Category[]
  selectedCategories: string[]
  onCategoriesChange: (categoryIds: string[]) => void
  onOpenCategoryManager: () => void
}

export function CategorySelector({
  categories,
  selectedCategories,
  onCategoriesChange,
  onOpenCategoryManager,
}: CategorySelectorProps) {
  const [open, setOpen] = useState(false)

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoriesChange(selectedCategories.filter((id) => id !== categoryId))
    } else {
      onCategoriesChange([...selectedCategories, categoryId])
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Tag className="h-3.5 w-3.5" />
          <span>Catégories</span>
          {selectedCategories.length > 0 && (
            <Badge variant="secondary" className="ml-1 rounded-sm px-1 font-normal">
              {selectedCategories.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher..." />
          <CommandList>
            <CommandEmpty>Aucune catégorie trouvée.</CommandEmpty>
            <CommandGroup>
              {categories.map((category) => (
                <CommandItem
                  key={category.id}
                  onSelect={() => toggleCategory(category.id)}
                  className="flex items-center gap-2"
                >
                  <div className={`w-3 h-3 rounded-full ${category.color}`} />
                  <span>{category.name}</span>
                  {selectedCategories.includes(category.id) && <Check className="ml-auto h-4 w-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup>
              <CommandItem onSelect={onOpenCategoryManager} className="text-sm">
                <Plus className="mr-2 h-4 w-4" />
                Gérer les catégories
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
