import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import Dictionary from './Dictionary'

// Mock the sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
}
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage })

const handlers = [
  http.get('https://api.dictionaryapi.dev/api/v2/entries/en/:word', ({ params }) => {
    const { word } = params

    if (word === 'example') {
      return HttpResponse.json([
        {
          word: 'example',
          phonetics: [
            {
              audio: 'https://api.dictionaryapi.dev/media/pronunciations/en/example-uk.mp3',
            },
          ],
          meanings: [
            {
              partOfSpeech: 'noun',
              definitions: [
                {
                  definition: 'Something that is representative of all such things in a group.',
                  example: 'This is an example of a red car.',
                },
              ],
            },
          ],
        },
      ])
    }

    return HttpResponse.json(
      {
        title: 'No Definitions Found',
        message: "Sorry pal, we couldn't find definitions for the word you were looking for.",
        resolution: 'You can try the search again at a later time or head to the web instead.',
      },
      { status: 404 }
    )
  }),
]

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
})
afterAll(() => server.close())

describe('Dictionary Component', () => {
  it('renders the search input and button', () => {
    render(<Dictionary />)
    expect(screen.getByPlaceholderText('Enter a word')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
  })

  it('displays an error message when searching with an empty input', async () => {
    render(<Dictionary />)
    fireEvent.click(screen.getByRole('button', { name: /search/i }))
    expect(await screen.findByText('Please enter a word to search')).toBeInTheDocument()
  })

  it('fetches and displays the definition when a word is searched', async () => {
    render(<Dictionary />)
    fireEvent.change(screen.getByPlaceholderText('Enter a word'), {
      target: { value: 'example' },
    })
    fireEvent.click(screen.getByRole('button', { name: /search/i }))

    await waitFor(() => {
      expect(screen.getByText('example')).toBeInTheDocument()
      expect(screen.getByText(/representative of all such things/i)).toBeInTheDocument()
      expect(screen.getByText(/this is an example of a red car/i)).toBeInTheDocument()
    })
  })

  it('displays an error message when a word is not found', async () => {
    render(<Dictionary />)
    fireEvent.change(screen.getByPlaceholderText('Enter a word'), {
      target: { value: 'nonexistentword' },
    })
    fireEvent.click(screen.getByRole('button', { name: /search/i }))

    await waitFor(() => {
      expect(screen.getByText('Word not found')).toBeInTheDocument()
    })
  })

  it('allows adding and removing favorites', async () => {
    mockSessionStorage.getItem.mockReturnValue('[]')
    render(<Dictionary />)

    fireEvent.change(screen.getByPlaceholderText('Enter a word'), { target: { value: 'example' } })
    fireEvent.click(screen.getByRole('button', { name: /search/i }))

    await waitFor(() => {
      expect(screen.getByText('example')).toBeInTheDocument()
    })

    const addToFavoritesButton = screen.getByRole('button', { name: /add to favorites/i })
    fireEvent.click(addToFavoritesButton)

    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('favorites', expect.any(String))

    const removeFromFavoritesButton = screen.getByRole('button', { name: /remove from favorites/i })
    expect(removeFromFavoritesButton).toBeInTheDocument()

    fireEvent.click(removeFromFavoritesButton)

    expect(screen.getByRole('button', { name: /add to favorites/i })).toBeInTheDocument()
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('favorites', '[]')
  })

  it('loads favorites from sessionStorage on mount', () => {
    const favorites = [{ word: 'test', definition: { word: 'test', meanings: [] } }]
    mockSessionStorage.getItem.mockReturnValue(JSON.stringify(favorites))

    render(<Dictionary />)

    expect(screen.getByText('test')).toBeInTheDocument()
  })

  it('clears the search field after each search', async () => {
    render(<Dictionary />)
    const searchInput = screen.getByPlaceholderText('Enter a word')

    fireEvent.change(searchInput, { target: { value: 'example' } })
    fireEvent.click(screen.getByRole('button', { name: /search/i }))

    await waitFor(() => {
      expect(screen.getByText('example')).toBeInTheDocument()
    })

    expect(searchInput).toHaveValue('')

    // Test with a failed search
    fireEvent.change(searchInput, { target: { value: 'nonexistentword' } })
    fireEvent.click(screen.getByRole('button', { name: /search/i }))

    await waitFor(() => {
      expect(screen.getByText('Word not found')).toBeInTheDocument()
    })

    expect(searchInput).toHaveValue('')
  })
})

describe('Audio playback', () => {
  it('plays the audio when the pronunciation button is clicked', async () => {
    const playMock = vi.fn()
    window.Audio = vi.fn(() => ({
      play: playMock,
    }))

    render(<Dictionary />)

    fireEvent.change(screen.getByPlaceholderText('Enter a word'), {
      target: { value: 'example' },
    })
    fireEvent.click(screen.getByRole('button', { name: /search/i }))

    await waitFor(() => {
      expect(screen.getByText('example')).toBeInTheDocument()
    })

    const playButton = screen.getByRole('button', { name: /play pronunciation/i })
    fireEvent.click(playButton)

    expect(playMock).toHaveBeenCalled()
    expect(window.Audio).toHaveBeenCalledWith(
      'https://api.dictionaryapi.dev/media/pronunciations/en/example-uk.mp3'
    )
  })
})

export default function Component() {
  return <Dictionary />
}
