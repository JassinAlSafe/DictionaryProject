import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import Dictionary from "./Dictionary";

const handlers = [
  http.get(
    "https://api.dictionaryapi.dev/api/v2/entries/en/:word",
    ({ params }) => {
      const { word } = params;

      if (word === "example") {
        return HttpResponse.json([
          {
            word: "example",
            phonetics: [
              {
                audio:
                  "https://api.dictionaryapi.dev/media/pronunciations/en/example-uk.mp3",
              },
            ],
            meanings: [
              {
                partOfSpeech: "noun",
                definitions: [
                  {
                    definition:
                      "Something that is representative of all such things in a group.",
                    example: "This is an example of a red car.",
                  },
                ],
              },
            ],
          },
        ]);
      }

      return HttpResponse.json(
        {
          title: "No Definitions Found",
          message:
            "Sorry pal, we couldn't find definitions for the word you were looking for.",
          resolution:
            "You can try the search again at later time or head to the web instead.",
        },
        { status: 404 }
      );
    }
  ),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("Dictionary Component", () => {
  it("renders the search input and button", () => {
    render(<Dictionary />);
    expect(screen.getByPlaceholderText("Enter a word")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
  });

  it("displays an error message when searching with an empty input", async () => {
    render(<Dictionary />);
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(
      await screen.findByText("Please enter a word to search")
    ).toBeInTheDocument();
  });

  it("fetches and displays the definition when a word is searched", async () => {
    render(<Dictionary />);
    fireEvent.change(screen.getByPlaceholderText("Enter a word"), {
      target: { value: "example" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(screen.getByTestId("defined-word")).toHaveTextContent("example");
      expect(screen.getByTestId("definition-0")).toHaveTextContent(
        "Something that is representative of all such things in a group."
      );
      expect(screen.getByTestId("example-0")).toHaveTextContent(
        "This is an example of a red car."
      );
    });
  });

  it("displays an error message when a word is not found", async () => {
    render(<Dictionary />);
    fireEvent.change(screen.getByPlaceholderText("Enter a word"), {
      target: { value: "nonexistentword" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(screen.getByText("Word not found")).toBeInTheDocument();
    });
  });

  it("allows adding and removing favorites", async () => {
    render(<Dictionary />);
    fireEvent.change(screen.getByPlaceholderText("Enter a word"), {
      target: { value: "example" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      fireEvent.click(screen.getByTestId("toggle-favorite"));
    });

    expect(screen.getByTestId("favorite-word-example")).toBeInTheDocument();
    expect(screen.getByTestId("remove-favorite-example")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("remove-favorite-example"));
    expect(screen.getByTestId("no-favorites")).toBeInTheDocument();
  });
});

export default function Component() {
  return <Dictionary />;
}
