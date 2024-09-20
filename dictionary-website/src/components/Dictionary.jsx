import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { ThemeToggle } from './ThemeToggle'
import { BookOpen, Volume2, Star, Trash2 } from 'lucide-react'

export default function Dictionary() {
  const [word, setWord] = useState('')
  const [definition, setDefinition] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [favorites, setFavorites] = useState([])

  useEffect(() => {
    const storedFavorites = JSON.parse(sessionStorage.getItem('favorites') || '[]')
    setFavorites(storedFavorites)
  }, [])

  const searchWord = async () => {
    if (!word.trim()) {
      setError('Please enter a word to search')
      return
    }

    setLoading(true)
    setError('')
    setDefinition(null)

    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
      const data = await response.json()

      if (response.ok) {
        setDefinition(data[0])
      } else {
        setError('Word not found')
      }
    } catch (err) {
      setError(`An error occurred: ${err.message}`)
    } finally {
      setLoading(false)
      setWord('')
    }
  }

  const playAudio = audioUrl => {
    new Audio(audioUrl).play()
  }

  const toggleFavorite = (word, def) => {
    const newFavorites = favorites.some(fav => fav.word === word)
      ? favorites.filter(fav => fav.word !== word)
      : [...favorites, { word, definition: def }]

    setFavorites(newFavorites)
    sessionStorage.setItem('favorites', JSON.stringify(newFavorites))
  }

  const removeFavorite = word => {
    const newFavorites = favorites.filter(fav => fav.word !== word)
    setFavorites(newFavorites)
    sessionStorage.setItem('favorites', JSON.stringify(newFavorites))
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <Card className="mb-8 shadow-lg">
        <CardHeader className="bg-primary text-primary-foreground">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl sm:text-3xl font-bold flex items-center">
              <BookOpen className="mr-2" />
              Dictionary App
            </CardTitle>
            <ThemeToggle />
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex space-x-2">
            <Input
              type="text"
              value={word}
              onChange={e => setWord(e.target.value)}
              placeholder="Enter a word"
              className="flex-grow"
              onKeyPress={e => e.key === 'Enter' && searchWord()}
            />
            <Button onClick={searchWord} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
          {error && <p className="text-destructive mt-2">{error}</p>}
        </CardContent>
      </Card>

      {definition && (
        <Card className="mb-8 shadow-lg">
          <CardHeader className="bg-secondary text-secondary-foreground">
            <CardTitle className="text-xl sm:text-2xl font-bold flex items-center justify-between">
              <span>{definition.word}</span>
              <div className="flex items-center space-x-2">
                {definition.phonetics[0]?.audio && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => playAudio(definition.phonetics[0].audio)}
                    aria-label="Play pronunciation"
                  >
                    <Volume2 className="h-6 w-6" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleFavorite(definition.word, definition)}
                  aria-label={
                    favorites.some(fav => fav.word === definition.word)
                      ? 'Remove from favorites'
                      : 'Add to favorites'
                  }
                >
                  <Star
                    className={`h-6 w-6 ${
                      favorites.some(fav => fav.word === definition.word) ? 'fill-yellow-400' : ''
                    }`}
                  />
                </Button>
              </div>
            </CardTitle>
            {definition.phonetic && <p className="text-muted-foreground">{definition.phonetic}</p>}
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {definition.meanings.map((meaning, index) => (
              <div key={index} className="mb-6">
                <h3 className="font-bold text-lg text-primary mb-2">{meaning.partOfSpeech}</h3>
                <ul className="list-disc list-inside space-y-2">
                  {meaning.definitions.map((def, i) => (
                    <li key={i} className="text-foreground">
                      <span>{def.definition}</span>
                      {def.example && (
                        <p className="text-muted-foreground mt-1 ml-4 italic">
                          &ldquo;{def.example}&rdquo;
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-xl font-bold">Favorite Words</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {favorites.length === 0 ? (
            <p>No favorite words yet.</p>
          ) : (
            <ul className="space-y-2">
              {favorites.map(fav => (
                <li key={fav.word} className="flex items-center justify-between">
                  <Button
                    variant="link"
                    onClick={() => {
                      setWord(fav.word)
                      setDefinition(fav.definition)
                    }}
                  >
                    {fav.word}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFavorite(fav.word)}
                    aria-label={`Remove ${fav.word} from favorites`}
                  >
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}