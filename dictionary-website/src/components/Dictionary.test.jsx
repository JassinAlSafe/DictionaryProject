import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import Dictionary from './Dictionary'
import userEvent from '@testing-library/user-event'

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
    const user = userEvent.setup()
    render(<Dictionary />)
    await user.click(screen.getByRole('button', { name: /search/i }))
    expect(await screen.findByText('Please enter a word to search')).toBeInTheDocument()
  })

  it('fetches and displays the definition when a word is searched', async () => {
    const user = userEvent.setup()
    render(<Dictionary />)
    await user.type(screen.getByPlaceholderText('Enter a word'), 'example')
    await user.click(screen.getByRole('button', { name: /search/i }))

    expect(await screen.findByText('example')).toBeInTheDocument()
    expect(screen.getByText(/representative of all such things/i)).toBeInTheDocument()
    expect(screen.getByText(/this is an example of a red car/i)).toBeInTheDocument()
  })

  it('lets the user click enter to search for a word', async () => {
    const user = userEvent.setup()
    render(<Dictionary />)

    const input = screen.getByPlaceholderText('Enter a word')
    await user.type(input, 'example')
    await user.keyboard('{Enter}')

    expect(await screen.findByText('example')).toBeInTheDocument()
    expect(screen.getByText(/representative of all such things/i)).toBeInTheDocument()
    expect(screen.getByText(/this is an example of a red car/i)).toBeInTheDocument()

    expect(input).toHaveValue('')
  })

  it('displays an error message when a word is not found', async () => {
    const user = userEvent.setup()
    render(<Dictionary />)
    await user.type(screen.getByPlaceholderText('Enter a word'), 'nonexistentword')
    await user.click(screen.getByRole('button', { name: /search/i }))

    expect(await screen.findByText('Word not found')).toBeInTheDocument()
  })
  it('allows adding and removing favorites', async () => {
    const user = userEvent.setup()
    mockSessionStorage.getItem.mockReturnValue('[]')
    render(<Dictionary />)

    await user.type(screen.getByPlaceholderText('Enter a word'), 'example')
    await user.click(screen.getByRole('button', { name: /search/i }))

    expect(await screen.findByText('example')).toBeInTheDocument()

    const addToFavoritesButton = screen.getByRole('button', { name: /add to favorites/i })
    await user.click(addToFavoritesButton)

    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('favorites', expect.any(String))

    const removeFromFavoritesButton = screen.getByRole('button', { name: /remove from favorites/i })
    expect(removeFromFavoritesButton).toBeInTheDocument()

    await user.click(removeFromFavoritesButton)

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
    const user = userEvent.setup()
    render(<Dictionary />)
    const searchInput = screen.getByPlaceholderText('Enter a word')

    await user.type(searchInput, 'example')
    await user.click(screen.getByRole('button', { name: /search/i }))

    expect(await screen.findByText('example')).toBeInTheDocument()
    expect(searchInput).toHaveValue('')

    // Test with a failed search
    await user.type(searchInput, 'nonexistentword')
    await user.click(screen.getByRole('button', { name: /search/i }))

    expect(await screen.findByText('Word not found')).toBeInTheDocument()
    expect(searchInput).toHaveValue('')
  })
  describe('Audio playback', () => {
    it('plays the audio when the pronunciation button is clicked', async () => {
      const user = userEvent.setup()
      const playMock = vi.fn()
      window.Audio = vi.fn(() => ({
        play: playMock,
      }))

      render(<Dictionary />)

      await user.type(screen.getByPlaceholderText('Enter a word'), 'example')
      await user.click(screen.getByRole('button', { name: /search/i }))

      expect(await screen.findByText('example')).toBeInTheDocument()

      const playButton = screen.getByRole('button', { name: /play pronunciation/i })
      await user.click(playButton)

      expect(playMock).toHaveBeenCalled()
      expect(window.Audio).toHaveBeenCalledWith(
        'https://api.dictionaryapi.dev/media/pronunciations/en/example-uk.mp3'
      )
    })
  })
})

// Tester för theme
