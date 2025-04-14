"use client"

import { useState, useEffect } from "react"
import { PlusCircle, Trash2, Download, RefreshCw, Github, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { OptionsDialog, type AppOptions } from "@/components/options-dialog"
import { CategoryManager, type Category } from "@/components/category-manager"
import { CategorySelector } from "@/components/category-selector"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Repository {
  id: string
  owner: string
  name: string
  url: string
  releases: Release[]
  lastChecked: string
  hasNewRelease: boolean
  addedVia?: string
  categoryIds: string[] // Ajout des catégories
}

interface Release {
  id: string
  tag_name: string
  name: string
  published_at: string
  html_url: string
  assets: {
    id: string
    name: string
    browser_download_url: string
    size: number
  }[]
  isNew?: boolean
}

interface StarredUser {
  username: string
  avatarUrl: string
  addedAt: string
}

export default function Home() {
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [newRepo, setNewRepo] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const [newUser, setNewUser] = useState("")
  const [starredUsers, setStarredUsers] = useState<StarredUser[]>([])
  const [loadingStars, setLoadingStars] = useState(false)
  const [userError, setUserError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"repos" | "users">("repos")
  const [options, setOptions] = useState<AppOptions>({
    checkFrequency: 60,
    maxReleasesToShow: 3,
    notificationsEnabled: true,
    language: "fr",
    githubToken: "", // Ajout du jeton d'accès par défaut (vide)
  })

  // Ajoutons l'état pour les catégories
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [showCategoryManager, setShowCategoryManager] = useState(false)

  // Load repositories from localStorage on initial render
  useEffect(() => {
    const savedRepos = localStorage.getItem("trackedRepositories")
    if (savedRepos) {
      setRepositories(JSON.parse(savedRepos))
    }
  }, [])

  useEffect(() => {
    const savedUsers = localStorage.getItem("starredUsers")
    if (savedUsers) {
      setStarredUsers(JSON.parse(savedUsers))
    }
  }, [])

  // Ajoutons un useEffect pour charger les catégories
  useEffect(() => {
    const savedCategories = localStorage.getItem("repoCategories")
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories))
    }
  }, [])

  useEffect(() => {
    // Charger les options depuis localStorage
    const savedOptions = localStorage.getItem("appOptions")
    if (savedOptions) {
      setOptions(JSON.parse(savedOptions))
    }
  }, [])

  // Save repositories to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("trackedRepositories", JSON.stringify(repositories))
  }, [repositories])

  useEffect(() => {
    localStorage.setItem("starredUsers", JSON.stringify(starredUsers))
  }, [starredUsers])

  // Ajoutons un useEffect pour sauvegarder les catégories
  useEffect(() => {
    localStorage.setItem("repoCategories", JSON.stringify(categories))
  }, [categories])

  useEffect(() => {
    localStorage.setItem("appOptions", JSON.stringify(options))
  }, [options])

  // Check for new releases periodically
  useEffect(() => {
    const checkInterval = setInterval(
      () => {
        if (repositories.length > 0) {
          checkForNewReleases()
        }
      },
      options.checkFrequency * 60 * 1000,
    ) // Convertir minutes en millisecondes

    return () => clearInterval(checkInterval)
  }, [repositories, options.checkFrequency])

  const handleDataImport = (data: { repositories: Repository[]; starredUsers: StarredUser[] }) => {
    // Mettre à jour les dépôts
    setRepositories((prev) => {
      // Fusionner les dépôts importés avec les dépôts existants en évitant les doublons
      const existingIds = new Set(prev.map((repo) => repo.id))
      const newRepos = data.repositories.filter((repo) => !existingIds.has(repo.id))
      return [...prev, ...newRepos]
    })

    // Mettre à jour les utilisateurs étoilés
    setStarredUsers((prev) => {
      // Fusionner les utilisateurs importés avec les utilisateurs existants en évitant les doublons
      const existingUsernames = new Set(prev.map((user) => user.username))
      const newUsers = data.starredUsers.filter((user) => !existingUsernames.has(user.username))
      return [...prev, ...newUsers]
    })

    // Mettre à jour la liste des releases pour chaque nouveau dépôt importé
    data.repositories.forEach((repo) => {
      fetchRepositoryReleases(repo.owner, repo.name)
    })

    toast({
      title: "Importation terminée",
      description: `${data.repositories.length} dépôts et ${data.starredUsers.length} utilisateurs ont été importés.`,
    })
  }

  // Ajouter une fonction pour récupérer les releases d'un dépôt
  const fetchRepositoryReleases = async (owner: string, name: string) => {
    try {
      // Construire l'URL de l'API
      const apiUrl = `https://api.github.com/repos/${owner}/${name}/releases`

      // Préparer les en-têtes avec le token si disponible
      const headers: HeadersInit = {}
      if (options.githubToken) {
        headers.Authorization = `token ${options.githubToken}`
      }

      const response = await fetch(apiUrl, { headers })

      if (!response.ok) {
        throw new Error(`Failed to fetch releases for ${owner}/${name}`)
      }

      const releases = await response.json()

      // Mettre à jour le dépôt avec les releases récupérées
      setRepositories((prev) =>
        prev.map((repo) =>
          repo.owner === owner && repo.name === name
            ? { ...repo, releases, lastChecked: new Date().toISOString() }
            : repo,
        ),
      )
    } catch (error) {
      console.error(`Error fetching releases for ${owner}/${name}:`, error)
    }
  }

  const addRepository = async () => {
    if (!newRepo) return

    setLoading(true)
    setError(null)

    try {
      // Extract owner and repo name from input
      let owner, name

      if (newRepo.includes("github.com")) {
        // Handle full GitHub URL
        const url = new URL(newRepo)
        const pathParts = url.pathname.split("/").filter(Boolean)
        if (pathParts.length >= 2) {
          owner = pathParts[0]
          name = pathParts[1]
        }
      } else if (newRepo.includes("/")) {
        // Handle owner/repo format
        ;[owner, name] = newRepo.split("/")
      }

      if (!owner || !name) {
        throw new Error("Invalid repository format. Use 'owner/repo' or a GitHub URL.")
      }

      // Check if repo already exists
      if (repositories.some((repo) => repo.owner === owner && repo.name === name)) {
        throw new Error("Repository already being tracked.")
      }

      // Préparer les en-têtes avec le token si disponible
      const headers: HeadersInit = {}
      if (options.githubToken) {
        headers.Authorization = `token ${options.githubToken}`
      }

      // Fetch repository data from GitHub API
      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${name}`, { headers })

      if (!repoResponse.ok) {
        throw new Error("Repository not found or not accessible.")
      }

      // Fetch releases
      const releasesResponse = await fetch(`https://api.github.com/repos/${owner}/${name}/releases`, { headers })

      if (!releasesResponse.ok) {
        throw new Error("Could not fetch releases for this repository.")
      }

      const releases = await releasesResponse.json()

      // Add repository to state
      const newRepository: Repository = {
        id: `${owner}/${name}`,
        owner,
        name,
        url: `https://github.com/${owner}/${name}`,
        releases: releases,
        lastChecked: new Date().toISOString(),
        hasNewRelease: false,
        categoryIds: [], // Initialiser avec un tableau vide
      }

      setRepositories((prev) => [...prev, newRepository])
      setNewRepo("")

      toast({
        title: "Repository added",
        description: `Now tracking ${owner}/${name} for new releases.`,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const addStarredUser = async () => {
    if (!newUser) return

    setLoadingStars(true)
    setUserError(null)

    try {
      // Préparer les en-têtes avec le token si disponible
      const headers: HeadersInit = {}
      if (options.githubToken) {
        headers.Authorization = `token ${options.githubToken}`
      }

      // Vérifier si l'utilisateur existe
      const userResponse = await fetch(`https://api.github.com/users/${newUser}`, { headers })

      if (!userResponse.ok) {
        throw new Error("Utilisateur GitHub introuvable.")
      }

      const userData = await userResponse.json()

      // Vérifier si l'utilisateur est déjà suivi
      if (starredUsers.some((user) => user.username === newUser)) {
        throw new Error("Cet utilisateur est déjà suivi.")
      }

      // Récupérer les dépôts étoilés par l'utilisateur
      const starredResponse = await fetch(`https://api.github.com/users/${newUser}/starred?per_page=100`, { headers })

      if (!starredResponse.ok) {
        throw new Error("Impossible de récupérer les dépôts étoilés.")
      }

      const starredRepos = await starredResponse.json()

      // Ajouter l'utilisateur à la liste des utilisateurs suivis
      const newStarredUser: StarredUser = {
        username: newUser,
        avatarUrl: userData.avatar_url,
        addedAt: new Date().toISOString(),
      }

      setStarredUsers((prev) => [...prev, newStarredUser])

      // Ajouter les dépôts étoilés qui ne sont pas déjà suivis
      const newRepos = await Promise.all(
        starredRepos.map(async (repo: any) => {
          // Vérifier si le dépôt est déjà suivi
          const isAlreadyTracked = repositories.some((r) => r.owner === repo.owner.login && r.name === repo.name)

          if (isAlreadyTracked) {
            return null
          }

          // Récupérer les releases du dépôt
          const releasesResponse = await fetch(
            `https://api.github.com/repos/${repo.owner.login}/${repo.name}/releases`,
            { headers },
          )
          let releases = []

          if (releasesResponse.ok) {
            releases = await releasesResponse.json()
          }

          return {
            id: `${repo.owner.login}/${repo.name}`,
            owner: repo.owner.login,
            name: repo.name,
            url: repo.html_url,
            releases: releases,
            lastChecked: new Date().toISOString(),
            hasNewRelease: false,
            addedVia: newUser, // Pour indiquer que ce dépôt a été ajouté via un utilisateur
            categoryIds: [], // Initialiser avec un tableau vide
          }
        }),
      )

      // Filtrer les dépôts null (déjà suivis)
      const validNewRepos = newRepos.filter(Boolean)

      setRepositories((prev) => [...prev, ...validNewRepos])
      setNewUser("")

      toast({
        title: "Utilisateur ajouté",
        description: `${validNewRepos.length} nouveaux dépôts de ${newUser} sont maintenant suivis.`,
      })
    } catch (err) {
      setUserError(err instanceof Error ? err.message : "Une erreur inconnue s'est produite")
    } finally {
      setLoadingStars(false)
    }
  }

  const removeRepository = (id: string) => {
    setRepositories((prev) => prev.filter((repo) => repo.id !== id))
    toast({
      title: "Repository removed",
      description: "The repository has been removed from tracking.",
    })
  }

  const removeStarredUser = (username: string) => {
    // Supprimer l'utilisateur
    setStarredUsers((prev) => prev.filter((user) => user.username !== username))

    // Supprimer tous les dépôts ajoutés via cet utilisateur
    setRepositories((prev) => prev.filter((repo) => repo.addedVia !== username))

    toast({
      title: "Utilisateur supprimé",
      description: `L'utilisateur ${username} et ses dépôts ont été supprimés du suivi.`,
    })
  }

  const checkForNewReleases = async () => {
    setLoading(true)

    try {
      // Préparer les en-têtes avec le token si disponible
      const headers: HeadersInit = {}
      if (options.githubToken) {
        headers.Authorization = `token ${options.githubToken}`
      }

      const updatedRepos = await Promise.all(
        repositories.map(async (repo) => {
          try {
            const response = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.name}/releases`, {
              headers,
            })

            if (!response.ok) {
              throw new Error(`Failed to fetch releases for ${repo.owner}/${repo.name}`)
            }

            const latestReleases = await response.json()

            // Check if there are any new releases
            const hasNewRelease =
              latestReleases.length > 0 &&
              (!repo.releases.length ||
                new Date(latestReleases[0].published_at) > new Date(repo.releases[0].published_at))

            // Mark new releases
            const updatedReleases = latestReleases.map((release: Release) => {
              const existingRelease = repo.releases.find((r) => r.id === release.id)
              return {
                ...release,
                isNew: !existingRelease,
              }
            })

            // Modifions la fonction toast dans checkForNewReleases pour respecter l'option de notification:
            if (hasNewRelease && !repo.hasNewRelease && options.notificationsEnabled) {
              toast({
                title: "New release available!",
                description: `${repo.owner}/${repo.name} has a new release: ${latestReleases[0].tag_name}`,
              })
            }

            return {
              ...repo,
              releases: updatedReleases,
              lastChecked: new Date().toISOString(),
              hasNewRelease,
            }
          } catch (error) {
            console.error(`Error checking ${repo.owner}/${repo.name}:`, error)
            return repo
          }
        }),
      )

      setRepositories(updatedRepos)
    } catch (err) {
      console.error("Error checking for new releases:", err)
    } finally {
      setLoading(false)
    }
  }

  // Ajoutons les fonctions pour gérer les catégories
  const updateRepositoryCategories = (repoId: string, categoryIds: string[]) => {
    setRepositories((prev) =>
      prev.map((repo) =>
        repo.id === repoId
          ? {
              ...repo,
              categoryIds,
            }
          : repo,
      ),
    )
  }

  const getFilteredRepositories = () => {
    if (!categoryFilter) return repositories

    return repositories.filter((repo) => repo.categoryIds.includes(categoryFilter))
  }

  const downloadRelease = (url: string, filename: string) => {
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Filtrer les dépôts en fonction de la catégorie sélectionnée
  const filteredRepositories = getFilteredRepositories()

  return (
    <main className="container mx-auto py-6 px-4 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Github className="h-8 w-8" />
          <h1 className="text-3xl font-bold">GitHub Release Tracker</h1>
        </div>
        <OptionsDialog
          options={options}
          onOptionsChange={setOptions}
          repositories={repositories}
          starredUsers={starredUsers}
          onDataImport={handleDataImport}
          categories={categories}
          onCategoriesChange={setCategories}
        />
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex gap-4 border-b">
          <button
            className={`pb-2 px-1 ${activeTab === "repos" ? "border-b-2 border-primary font-medium" : "text-muted-foreground"}`}
            onClick={() => setActiveTab("repos")}
          >
            Dépôts
          </button>
          <button
            className={`pb-2 px-1 ${activeTab === "users" ? "border-b-2 border-primary font-medium" : "text-muted-foreground"}`}
            onClick={() => setActiveTab("users")}
          >
            Utilisateurs étoilés
          </button>
        </div>

        {activeTab === "repos" ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Ajouter un dépôt</CardTitle>
                <CardDescription>
                  Entrez une URL de dépôt GitHub ou utilisez le format propriétaire/dépôt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="vercel/next.js"
                    value={newRepo}
                    onChange={(e) => setNewRepo(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addRepository()}
                  />
                  <Button onClick={addRepository} disabled={loading}>
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />}
                    Ajouter
                  </Button>
                </div>
                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Dépôts suivis ({filteredRepositories.length})</h2>

                {/* Ajout du filtre par catégorie */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="ml-2 gap-1">
                      <Filter className="h-3.5 w-3.5" />
                      <span>Filtrer</span>
                      {categoryFilter && (
                        <Badge variant="secondary" className="ml-1 rounded-sm px-1 font-normal">
                          {categories.find((c) => c.id === categoryFilter)?.name || ""}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => setCategoryFilter(null)}>Tous les dépôts</DropdownMenuItem>
                    {categories.map((category) => (
                      <DropdownMenuItem
                        key={category.id}
                        onClick={() => setCategoryFilter(category.id)}
                        className="flex items-center gap-2"
                      >
                        <div className={`w-3 h-3 rounded-full ${category.color}`} />
                        {category.name}
                        {category.icon && <i className={`fa fa-${category.icon} ml-1 text-xs`}></i>}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <CategoryManager categories={categories} onCategoriesChange={setCategories} />
              </div>
              <Button variant="outline" onClick={checkForNewReleases} disabled={loading || repositories.length === 0}>
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Vérifier les mises à jour
              </Button>
            </div>

            {filteredRepositories.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Aucun dépôt {categoryFilter ? "dans cette catégorie" : "ajouté pour le moment"}.</p>
                    <p>
                      {categoryFilter
                        ? "Ajoutez des dépôts à cette catégorie ou sélectionnez une autre catégorie."
                        : "Ajoutez un dépôt GitHub pour commencer à suivre les releases."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredRepositories.map((repo) => (
                <Card key={repo.id} className={repo.hasNewRelease ? "border-green-500" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2 flex-wrap">
                          <a href={repo.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {repo.owner}/{repo.name}
                          </a>
                          {repo.hasNewRelease && <Badge className="bg-green-500">Nouvelle Release</Badge>}
                          {repo.addedVia && (
                            <Badge variant="outline" className="ml-2">
                              via {repo.addedVia}
                            </Badge>
                          )}
                          {/* Affichage des badges de catégorie */}
                          {repo.categoryIds.map((catId) => {
                            const category = categories.find((c) => c.id === catId)
                            if (!category) return null
                            return (
                              <Badge key={catId} className={`${category.color} text-white`}>
                                {category.name}
                                {category.icon && <i className={`fa fa-${category.icon} ml-1`}></i>}
                              </Badge>
                            )
                          })}
                        </CardTitle>
                        <CardDescription>Dernière vérification: {formatDate(repo.lastChecked)}</CardDescription>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Sélecteur de catégories */}
                        <CategorySelector
                          categories={categories}
                          selectedCategories={repo.categoryIds}
                          onCategoriesChange={(categoryIds) => updateRepositoryCategories(repo.id, categoryIds)}
                          onOpenCategoryManager={() => setShowCategoryManager(true)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRepository(repo.id)}
                          aria-label="Supprimer le dépôt"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {repo.releases.length > 0 ? (
                      <div className="space-y-4">
                        {/* Modifions l'affichage des releases pour utiliser maxReleasesToShow des options: */}
                        {repo.releases.slice(0, options.maxReleasesToShow).map((release) => (
                          <div key={release.id} className="space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium flex items-center gap-2">
                                  {release.name || release.tag_name}
                                  {release.isNew && <Badge className="bg-green-500">Nouveau</Badge>}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Publié le: {formatDate(release.published_at)}
                                </p>
                              </div>
                              <a
                                href={release.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-500 hover:underline"
                              >
                                Voir sur GitHub
                              </a>
                            </div>

                            {release.assets.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium">Téléchargements:</h4>
                                <div className="grid gap-2">
                                  {release.assets.map((asset) => (
                                    <div
                                      key={asset.id}
                                      className="flex justify-between items-center p-2 bg-muted rounded-md"
                                    >
                                      <div className="truncate max-w-[70%]">
                                        <span className="text-sm">{asset.name}</span>
                                        <span className="text-xs text-muted-foreground ml-2">
                                          ({formatFileSize(asset.size)})
                                        </span>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => downloadRelease(asset.browser_download_url, asset.name)}
                                      >
                                        <Download className="h-3 w-3 mr-1" />
                                        Télécharger
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <Separator className="my-2" />
                          </div>
                        ))}

                        {/* Modifions l'affichage des releases pour utiliser maxReleasesToShow des options: */}
                        {repo.releases.length > options.maxReleasesToShow && (
                          <a
                            href={`${repo.url}/releases`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:underline"
                          >
                            Voir toutes les {repo.releases.length} releases
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Aucune release trouvée pour ce dépôt.</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Ajouter un utilisateur GitHub</CardTitle>
                <CardDescription>Suivez tous les dépôts étoilés par un utilisateur GitHub</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="octocat"
                    value={newUser}
                    onChange={(e) => setNewUser(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addStarredUser()}
                  />
                  <Button onClick={addStarredUser} disabled={loadingStars}>
                    {loadingStars ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <PlusCircle className="h-4 w-4 mr-2" />
                    )}
                    Ajouter
                  </Button>
                </div>
                {userError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>{userError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Utilisateurs suivis ({starredUsers.length})</h2>
            </div>

            {starredUsers.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Aucun utilisateur ajouté pour le moment.</p>
                    <p>Ajoutez un utilisateur GitHub pour suivre ses dépôts étoilés.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {starredUsers.map((user) => (
                  <Card key={user.username}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatarUrl || "/placeholder.svg"}
                            alt={`${user.username}'s avatar`}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <CardTitle className="text-lg">
                              <a
                                href={`https://github.com/${user.username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                {user.username}
                              </a>
                            </CardTitle>
                            <CardDescription>Ajouté le: {formatDate(user.addedAt)}</CardDescription>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStarredUser(user.username)}
                          aria-label="Supprimer l'utilisateur"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {repositories.filter((repo) => repo.addedVia === user.username).length} dépôts suivis
                        </span>
                        <a
                          href={`https://github.com/${user.username}?tab=stars`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:underline"
                        >
                          Voir les étoiles
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
