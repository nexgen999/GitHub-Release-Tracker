"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import {
  Settings,
  Moon,
  Sun,
  BellRing,
  BellOff,
  Download,
  Upload,
  Key,
  Package,
  Globe,
  Monitor,
  Check,
} from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTheme } from "next-themes"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

export interface AppOptions {
  checkFrequency: number // en minutes
  maxReleasesToShow: number
  notificationsEnabled: boolean
  language: "fr" | "en"
  githubToken: string // Ajout du jeton d'accès personnel GitHub
}

interface OptionsDialogProps {
  options: AppOptions
  onOptionsChange: (newOptions: AppOptions) => void
  repositories: any[] // Pour l'exportation/importation
  starredUsers: any[] // Pour l'exportation/importation
  onDataImport: (data: { repositories: any[]; starredUsers: any[] }) => void
  categories: any[] // Pour la gestion des catégories
  onCategoriesChange: (categories: any[]) => void
}

// Liste des icônes FontAwesome populaires
const fontAwesomeIcons = [
  { name: "star", label: "Étoile" },
  { name: "heart", label: "Cœur" },
  { name: "thumbs-up", label: "Pouce en haut" },
  { name: "check", label: "Coche" },
  { name: "times", label: "Croix" },
  { name: "circle", label: "Cercle" },
  { name: "square", label: "Carré" },
  { name: "triangle", label: "Triangle" },
  { name: "bookmark", label: "Marque-page" },
  { name: "flag", label: "Drapeau" },
  { name: "tag", label: "Étiquette" },
  { name: "folder", label: "Dossier" },
  { name: "file", label: "Fichier" },
  { name: "image", label: "Image" },
  { name: "video", label: "Vidéo" },
  { name: "music", label: "Musique" },
  { name: "code", label: "Code" },
  { name: "terminal", label: "Terminal" },
  { name: "database", label: "Base de données" },
  { name: "server", label: "Serveur" },
  { name: "cloud", label: "Nuage" },
  { name: "download", label: "Téléchargement" },
  { name: "upload", label: "Envoi" },
  { name: "sync", label: "Synchronisation" },
  { name: "cog", label: "Engrenage" },
  { name: "wrench", label: "Clé" },
  { name: "tools", label: "Outils" },
  { name: "bell", label: "Cloche" },
  { name: "envelope", label: "Enveloppe" },
  { name: "comment", label: "Commentaire" },
  { name: "user", label: "Utilisateur" },
  { name: "users", label: "Utilisateurs" },
  { name: "lock", label: "Cadenas" },
  { name: "key", label: "Clé" },
  { name: "shield", label: "Bouclier" },
  { name: "chart-bar", label: "Graphique à barres" },
  { name: "chart-line", label: "Graphique linéaire" },
  { name: "chart-pie", label: "Graphique circulaire" },
  { name: "calendar", label: "Calendrier" },
  { name: "clock", label: "Horloge" },
]

export function OptionsDialog({
  options,
  onOptionsChange,
  repositories,
  starredUsers,
  onDataImport,
  categories,
  onCategoriesChange,
}: OptionsDialogProps) {
  const [open, setOpen] = useState(false)
  const [localOptions, setLocalOptions] = useState<AppOptions>(options)
  const { theme, setTheme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [activeTab, setActiveTab] = useState("general")
  const [localCategories, setLocalCategories] = useState(categories)
  const [searchTerm, setSearchTerm] = useState("")
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null)

  // Mettre à jour les catégories locales lorsque les catégories externes changent
  useEffect(() => {
    setLocalCategories(categories)
  }, [categories])

  const handleSave = () => {
    onOptionsChange(localOptions)
    onCategoriesChange(localCategories)
    setOpen(false)
    setImportStatus(null)
    setDownloadStatus(null)
  }

  // Fonction pour exporter les données au format XML
  const exportData = () => {
    // Créer le contenu XML
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<githubReleaseTracker>
  <repositories>
    ${repositories
      .map(
        (repo) => `
    <repository>
      <id>${escapeXML(repo.id)}</id>
      <owner>${escapeXML(repo.owner)}</owner>
      <name>${escapeXML(repo.name)}</name>
      <url>${escapeXML(repo.url)}</url>
      <lastChecked>${escapeXML(repo.lastChecked)}</lastChecked>
      <hasNewRelease>${repo.hasNewRelease}</hasNewRelease>
      ${repo.addedVia ? `<addedVia>${escapeXML(repo.addedVia)}</addedVia>` : ""}
      <categoryIds>
        ${repo.categoryIds.map((id: string) => `<categoryId>${escapeXML(id)}</categoryId>`).join("\n        ")}
      </categoryIds>
    </repository>`,
      )
      .join("")}
  </repositories>
  <starredUsers>
    ${starredUsers
      .map(
        (user) => `
    <starredUser>
      <username>${escapeXML(user.username)}</username>
      <avatarUrl>${escapeXML(user.avatarUrl)}</avatarUrl>
      <addedAt>${escapeXML(user.addedAt)}</addedAt>
    </starredUser>`,
      )
      .join("")}
  </starredUsers>
  <categories>
    ${localCategories
      .map(
        (category) => `
    <category>
      <id>${escapeXML(category.id)}</id>
      <name>${escapeXML(category.name)}</name>
      <color>${escapeXML(category.color)}</color>
      ${category.icon ? `<icon>${escapeXML(category.icon)}</icon>` : ""}
    </category>`,
      )
      .join("")}
  </categories>
</githubReleaseTracker>`

    // Créer un Blob et un lien de téléchargement
    const blob = new Blob([xmlContent], { type: "application/xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "github-release-tracker-data.xml"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Fonction d'échappement pour XML
  const escapeXML = (str: string) => {
    if (!str) return ""
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;")
  }

  // Fonction pour gérer l'importation
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const xmlContent = e.target?.result as string
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(xmlContent, "text/xml")

        // Vérifier si le XML est valide
        const parserError = xmlDoc.querySelector("parsererror")
        if (parserError) {
          throw new Error("Format XML invalide")
        }

        // Extraire les repositories
        const repoNodes = xmlDoc.querySelectorAll("repository")
        const importedRepos = Array.from(repoNodes).map((repoNode) => {
          const getCategoryIds = () => {
            const categoryIdsElements = repoNode.querySelectorAll("categoryId")
            return Array.from(categoryIdsElements).map((el) => el.textContent || "")
          }

          return {
            id: repoNode.querySelector("id")?.textContent || "",
            owner: repoNode.querySelector("owner")?.textContent || "",
            name: repoNode.querySelector("name")?.textContent || "",
            url: repoNode.querySelector("url")?.textContent || "",
            lastChecked: repoNode.querySelector("lastChecked")?.textContent || new Date().toISOString(),
            hasNewRelease: repoNode.querySelector("hasNewRelease")?.textContent === "true",
            addedVia: repoNode.querySelector("addedVia")?.textContent || undefined,
            categoryIds: getCategoryIds(),
            releases: [], // Les releases seront récupérées après import
          }
        })

        // Extraire les utilisateurs étoilés
        const userNodes = xmlDoc.querySelectorAll("starredUser")
        const importedUsers = Array.from(userNodes).map((userNode) => {
          return {
            username: userNode.querySelector("username")?.textContent || "",
            avatarUrl: userNode.querySelector("avatarUrl")?.textContent || "",
            addedAt: userNode.querySelector("addedAt")?.textContent || new Date().toISOString(),
          }
        })

        // Extraire les catégories
        const categoryNodes = xmlDoc.querySelectorAll("category")
        const importedCategories = Array.from(categoryNodes).map((categoryNode) => {
          return {
            id: categoryNode.querySelector("id")?.textContent || "",
            name: categoryNode.querySelector("name")?.textContent || "",
            color: categoryNode.querySelector("color")?.textContent || "",
            icon: categoryNode.querySelector("icon")?.textContent || undefined,
          }
        })

        // Mettre à jour les catégories locales
        if (importedCategories.length > 0) {
          setLocalCategories((prev) => {
            // Fusionner les catégories importées avec les catégories existantes en évitant les doublons
            const existingIds = new Set(prev.map((cat) => cat.id))
            const newCategories = importedCategories.filter((cat) => !existingIds.has(cat.id))
            return [...prev, ...newCategories]
          })
        }

        // Importer les données
        onDataImport({
          repositories: importedRepos,
          starredUsers: importedUsers,
        })

        setImportStatus({
          success: true,
          message: `Importation réussie : ${importedRepos.length} dépôts, ${importedUsers.length} utilisateurs et ${importedCategories.length} catégories importés.`,
        })

        // Réinitialiser le champ de fichier
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } catch (error) {
        setImportStatus({
          success: false,
          message: `Erreur lors de l'importation : ${error instanceof Error ? error.message : "Erreur inconnue"}`,
        })
      }
    }
    reader.readAsText(file)
  }

  // Fonction pour mettre à jour une catégorie
  const updateCategory = (categoryId: string, updates: Partial<any>) => {
    setLocalCategories((prev) => prev.map((cat) => (cat.id === categoryId ? { ...cat, ...updates } : cat)))
  }

  // Fonction pour supprimer une catégorie
  const deleteCategory = (categoryId: string) => {
    setLocalCategories((prev) => prev.filter((cat) => cat.id !== categoryId))
  }

  // Fonction pour simuler le téléchargement du projet
  const downloadProject = (type: "source" | "web" | "windows") => {
    setDownloadStatus(`Préparation du téléchargement ${type}...`)

    // Simuler un délai de téléchargement
    setTimeout(() => {
      let fileName = ""
      switch (type) {
        case "source":
          fileName = "github-release-tracker-source.zip"
          break
        case "web":
          fileName = "github-release-tracker-web.zip"
          break
        case "windows":
          fileName = "github-release-tracker-windows-x64.zip"
          break
      }

      setDownloadStatus(`Téléchargement de ${fileName} terminé!`)

      // Réinitialiser le statut après quelques secondes
      setTimeout(() => {
        setDownloadStatus(null)
      }, 3000)

      // Créer un faux téléchargement pour l'exemple
      const blob = new Blob(["Contenu factice pour démonstration"], { type: "application/zip" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 1500)
  }

  // Filtrer les icônes en fonction du terme de recherche
  const filteredIcons = searchTerm
    ? fontAwesomeIcons.filter(
        (icon) =>
          icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          icon.label.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : fontAwesomeIcons

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Options</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">Options</DialogTitle>
          <DialogDescription>Configurez les paramètres de l'application selon vos préférences.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="categories">Catégories</TabsTrigger>
            <TabsTrigger value="import-export">Import/Export</TabsTrigger>
            <TabsTrigger value="download">Télécharger</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] pr-4">
            <TabsContent value="general" className="space-y-4 pr-4">
              <div className="space-y-3">
                <h3 className="text-base font-medium">Paramètres généraux</h3>
                <div className="grid grid-cols-4 items-center gap-5">
                  <Label htmlFor="check-frequency" className="col-span-2">
                    Fréquence de vérification
                  </Label>
                  <Select
                    value={localOptions.checkFrequency.toString()}
                    onValueChange={(value) =>
                      setLocalOptions({ ...localOptions, checkFrequency: Number.parseInt(value) })
                    }
                    className="col-span-2"
                  >
                    <SelectTrigger id="check-frequency">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 heure</SelectItem>
                      <SelectItem value="180">3 heures</SelectItem>
                      <SelectItem value="360">6 heures</SelectItem>
                      <SelectItem value="720">12 heures</SelectItem>
                      <SelectItem value="1440">24 heures</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-5">
                  <Label htmlFor="max-releases" className="col-span-2">
                    Releases à afficher
                  </Label>
                  <Select
                    value={localOptions.maxReleasesToShow.toString()}
                    onValueChange={(value) =>
                      setLocalOptions({ ...localOptions, maxReleasesToShow: Number.parseInt(value) })
                    }
                    className="col-span-2"
                  >
                    <SelectTrigger id="max-releases">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 release</SelectItem>
                      <SelectItem value="3">3 releases</SelectItem>
                      <SelectItem value="5">5 releases</SelectItem>
                      <SelectItem value="10">10 releases</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-5">
                  <Label htmlFor="notifications" className="col-span-2">
                    Notifications
                  </Label>
                  <div className="col-span-2 flex items-center space-x-2">
                    <Switch
                      id="notifications"
                      checked={localOptions.notificationsEnabled}
                      onCheckedChange={(checked) => setLocalOptions({ ...localOptions, notificationsEnabled: checked })}
                    />
                    {localOptions.notificationsEnabled ? (
                      <BellRing className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <BellOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>

              <Separator className="my-2" />

              <div className="space-y-3">
                <h3 className="text-base font-medium">Apparence</h3>
                <div className="grid grid-cols-4 items-center gap-5">
                  <Label className="col-span-2">Thème</Label>
                  <div className="col-span-2">
                    <RadioGroup value={theme} onValueChange={setTheme} className="flex space-x-2">
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="light" id="theme-light" />
                        <Label htmlFor="theme-light" className="flex items-center">
                          <Sun className="h-4 w-4 mr-1" /> Clair
                        </Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="dark" id="theme-dark" />
                        <Label htmlFor="theme-dark" className="flex items-center">
                          <Moon className="h-4 w-4 mr-1" /> Sombre
                        </Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="system" id="theme-system" />
                        <Label htmlFor="theme-system">Système</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-5">
                  <Label htmlFor="language" className="col-span-2">
                    Langue
                  </Label>
                  <Select
                    value={localOptions.language}
                    onValueChange={(value) => setLocalOptions({ ...localOptions, language: value as "fr" | "en" })}
                    className="col-span-2"
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="my-2" />

              {/* Section pour le jeton GitHub */}
              <div className="space-y-3">
                <h3 className="text-base font-medium">Jeton d'accès personnel GitHub</h3>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="github-token" className="col-span-2">
                    Jeton d'accès
                  </Label>
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="github-token"
                          type="password"
                          value={localOptions.githubToken || ""}
                          onChange={(e) => setLocalOptions({ ...localOptions, githubToken: e.target.value })}
                          placeholder="ghp_..."
                          className="pr-8"
                        />
                        <Key className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Nécessaire pour accéder aux dépôts privés et augmenter les limites d'API.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="categories" className="space-y-4 pr-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium">Gestion des catégories</h3>
                  <Badge variant="outline">{localCategories.length} catégories</Badge>
                </div>

                <div className="space-y-4">
                  {localCategories.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Aucune catégorie créée.</p>
                      <p>Créez des catégories pour organiser vos dépôts GitHub.</p>
                    </div>
                  ) : (
                    <Accordion type="multiple" className="w-full">
                      {localCategories.map((category) => (
                        <AccordionItem key={category.id} value={category.id}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full ${category.color}`}></div>
                              <span>{category.name}</span>
                              {category.icon && (
                                <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                  <i className={`fa fa-${category.icon}`}></i> {category.icon}
                                </span>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3 p-2">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor={`category-name-${category.id}`} className="col-span-1">
                                  Nom
                                </Label>
                                <Input
                                  id={`category-name-${category.id}`}
                                  value={category.name}
                                  onChange={(e) => updateCategory(category.id, { name: e.target.value })}
                                  className="col-span-3"
                                />
                              </div>

                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor={`category-color-${category.id}`} className="col-span-1">
                                  Couleur
                                </Label>
                                <div className="col-span-3 flex flex-wrap gap-2">
                                  {[
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
                                  ].map((color) => (
                                    <button
                                      key={color}
                                      className={`w-6 h-6 rounded-full ${color} ${
                                        category.color === color ? "ring-2 ring-offset-2 ring-primary" : ""
                                      }`}
                                      onClick={() => updateCategory(category.id, { color })}
                                      aria-label={`Sélectionner la couleur ${color}`}
                                    />
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor={`category-icon-${category.id}`} className="col-span-1">
                                  Icône
                                </Label>
                                <div className="col-span-3">
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button variant="outline" className="w-full justify-start">
                                        {category.icon ? (
                                          <>
                                            <i className={`fa fa-${category.icon} mr-2`}></i>
                                            {category.icon}
                                          </>
                                        ) : (
                                          "Sélectionner une icône"
                                        )}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0" align="start">
                                      <Command>
                                        <CommandInput
                                          placeholder="Rechercher une icône..."
                                          value={searchTerm}
                                          onValueChange={setSearchTerm}
                                        />
                                        <CommandList>
                                          <CommandEmpty>Aucune icône trouvée.</CommandEmpty>
                                          <CommandGroup className="max-h-[200px] overflow-y-auto">
                                            {filteredIcons.map((icon) => (
                                              <CommandItem
                                                key={icon.name}
                                                onSelect={() => {
                                                  updateCategory(category.id, { icon: icon.name })
                                                  setSearchTerm("")
                                                }}
                                                className="flex items-center gap-2"
                                              >
                                                <i className={`fa fa-${icon.name}`}></i>
                                                <span>{icon.label}</span>
                                                {category.icon === icon.name && <Check className="ml-auto h-4 w-4" />}
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Sélectionnez une icône FontAwesome pour cette catégorie.
                                  </p>
                                </div>
                              </div>

                              <div className="flex justify-end">
                                <Button variant="destructive" size="sm" onClick={() => deleteCategory(category.id)}>
                                  Supprimer cette catégorie
                                </Button>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="import-export" className="space-y-4 pr-4">
              <div className="space-y-3">
                <h3 className="text-base font-medium">Importation / Exportation</h3>
                <p className="text-sm text-muted-foreground">
                  Exportez vos dépôts et utilisateurs suivis pour une sauvegarde ou importez depuis un fichier XML.
                </p>

                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                      <Button variant="outline" onClick={exportData} className="flex gap-1 items-center">
                        <Download className="h-4 w-4" />
                        Exporter les données (XML)
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex gap-1 items-center"
                      >
                        <Upload className="h-4 w-4" />
                        Importer des données
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImport}
                          accept=".xml"
                          className="hidden"
                        />
                      </Button>
                    </div>

                    {importStatus && (
                      <Alert variant={importStatus.success ? "default" : "destructive"} className="mt-2">
                        <AlertDescription>{importStatus.message}</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Statistiques</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-muted p-3 rounded-md">
                      <div className="text-sm text-muted-foreground">Dépôts suivis</div>
                      <div className="text-2xl font-bold">{repositories.length}</div>
                    </div>
                    <div className="bg-muted p-3 rounded-md">
                      <div className="text-sm text-muted-foreground">Utilisateurs suivis</div>
                      <div className="text-2xl font-bold">{starredUsers.length}</div>
                    </div>
                    <div className="bg-muted p-3 rounded-md">
                      <div className="text-sm text-muted-foreground">Catégories</div>
                      <div className="text-2xl font-bold">{localCategories.length}</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="download" className="space-y-4 pr-4">
              <div className="space-y-3">
                <h3 className="text-base font-medium">Télécharger le projet</h3>
                <p className="text-sm text-muted-foreground">
                  Téléchargez différentes versions du GitHub Release Tracker pour une utilisation hors ligne.
                </p>

                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Package className="h-8 w-8 text-primary" />
                        <div>
                          <h4 className="font-medium">Code source</h4>
                          <p className="text-sm text-muted-foreground">
                            Code source complet du projet pour les développeurs
                          </p>
                        </div>
                      </div>
                      <Button onClick={() => downloadProject("source")}>
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Globe className="h-8 w-8 text-primary" />
                        <div>
                          <h4 className="font-medium">Version web</h4>
                          <p className="text-sm text-muted-foreground">Application web autonome sans base de données</p>
                        </div>
                      </div>
                      <Button onClick={() => downloadProject("web")}>
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Monitor className="h-8 w-8 text-primary" />
                        <div>
                          <h4 className="font-medium">Application Windows</h4>
                          <p className="text-sm text-muted-foreground">
                            Exécutable pour Windows x64 (installation non requise)
                          </p>
                        </div>
                      </div>
                      <Button onClick={() => downloadProject("windows")}>
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </Button>
                    </CardContent>
                  </Card>

                  {downloadStatus && (
                    <Alert className="mt-2">
                      <AlertDescription>{downloadStatus}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter>
          <Button type="submit" onClick={handleSave}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
