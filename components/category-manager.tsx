"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface Category {
  id: string
  name: string
  color: string
}

interface CategoryManagerProps {
  categories: Category[]
  onCategoriesChange: (categories: Category[]) => void
}

export function CategoryManager({ categories, onCategoriesChange }: CategoryManagerProps) {
  const [open, setOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
  ]

  const [selectedColor, setSelectedColor] = useState(colors[0])

  const addCategory = () => {
    if (!newCategoryName.trim()) return

    const newCategory: Category = {
      id: `category-${Date.now()}`,
      name: newCategoryName.trim(),
      color: selectedColor,
    }

    onCategoriesChange([...categories, newCategory])
    setNewCategoryName("")
    setSelectedColor(colors[0])
  }

  const startEditing = (category: Category) => {
    setEditingCategory(category.id)
    setEditName(category.name)
  }

  const saveEdit = (categoryId: string) => {
    if (!editName.trim()) return

    onCategoriesChange(
      categories.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              name: editName.trim(),
            }
          : cat,
      ),
    )
    setEditingCategory(null)
  }

  const cancelEdit = () => {
    setEditingCategory(null)
  }

  const deleteCategory = (categoryId: string) => {
    onCategoriesChange(categories.filter((cat) => cat.id !== categoryId))
  }

  const changeColor = (categoryId: string, color: string) => {
    onCategoriesChange(
      categories.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              color,
            }
          : cat,
      ),
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Gérer les catégories
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gérer les catégories</DialogTitle>
          <DialogDescription>Créez et gérez des catégories pour organiser vos dépôts GitHub.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Ajouter une nouvelle catégorie</h3>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Nom de la catégorie"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1"
              />
              <div className="flex gap-1">
                {colors.slice(0, 5).map((color) => (
                  <button
                    key={color}
                    className={`w-6 h-6 rounded-full ${color} ${
                      selectedColor === color ? "ring-2 ring-offset-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedColor(color)}
                    aria-label={`Sélectionner la couleur ${color}`}
                  />
                ))}
                <div className="relative group">
                  <button
                    className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
                    aria-label="Plus de couleurs"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-wrap gap-1 bg-background p-2 rounded-md shadow-md z-10 w-[120px]">
                    {colors.map((color) => (
                      <button
                        key={color}
                        className={`w-5 h-5 rounded-full ${color} ${
                          selectedColor === color ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => setSelectedColor(color)}
                        aria-label={`Sélectionner la couleur ${color}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <Button onClick={addCategory} disabled={!newCategoryName.trim()}>
                Ajouter
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Catégories existantes</h3>
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune catégorie créée.</p>
            ) : (
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between gap-2 p-2 bg-muted rounded-md">
                      {editingCategory === category.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1"
                            autoFocus
                          />
                          <Button size="icon" variant="ghost" onClick={() => saveEdit(category.id)}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={cancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 flex-1">
                            <div className={`w-4 h-4 rounded-full ${category.color}`} />
                            <span>{category.name}</span>
                          </div>
                          <div className="flex items-center">
                            <div className="relative group">
                              <Button size="icon" variant="ghost" className="h-8 w-8">
                                <div className={`w-4 h-4 rounded-full ${category.color}`} />
                              </Button>
                              <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-wrap gap-1 bg-background p-2 rounded-md shadow-md z-10 w-[120px]">
                                {colors.map((color) => (
                                  <button
                                    key={color}
                                    className={`w-5 h-5 rounded-full ${color}`}
                                    onClick={() => changeColor(category.id, color)}
                                    aria-label={`Changer la couleur en ${color}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => startEditing(category)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteCategory(category.id)}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
